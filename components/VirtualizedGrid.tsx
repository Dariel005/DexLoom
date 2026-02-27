"use client";

import {
  type UIEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

interface VirtualizedGridProps<T> {
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemKey: (item: T, index: number) => string | number;
  minColumnWidth: number;
  itemHeight: number;
  gap?: number;
  overscanRows?: number;
  className?: string;
}

export function VirtualizedGrid<T>({
  items,
  renderItem,
  itemKey,
  minColumnWidth,
  itemHeight,
  gap = 8,
  overscanRows = 2,
  className
}: VirtualizedGridProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const updateMetrics = () => {
      setViewportHeight(node.clientHeight);
      setContainerWidth(node.clientWidth);
    };
    updateMetrics();

    if (typeof window === "undefined" || typeof window.ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(updateMetrics);
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current !== null && typeof window !== "undefined") {
        window.cancelAnimationFrame(rafRef.current);
      }
    },
    []
  );

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const nextScrollTop = event.currentTarget.scrollTop;

    if (typeof window === "undefined") {
      setScrollTop(nextScrollTop);
      return;
    }

    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = window.requestAnimationFrame(() => {
      setScrollTop(nextScrollTop);
      rafRef.current = null;
    });
  }, []);

  const { columnCount, itemWidth, rowCount, rowStride, totalHeight } = useMemo(() => {
    const safeWidth = Math.max(containerWidth, minColumnWidth);
    const computedColumns = Math.max(
      1,
      Math.floor((safeWidth + gap) / (Math.max(minColumnWidth, 1) + gap))
    );
    const computedItemWidth =
      computedColumns > 1
        ? (safeWidth - gap * (computedColumns - 1)) / computedColumns
        : safeWidth;
    const computedRowCount = Math.ceil(items.length / computedColumns);
    const computedRowStride = itemHeight + gap;
    const computedTotalHeight =
      computedRowCount > 0 ? computedRowCount * computedRowStride - gap : 0;

    return {
      columnCount: computedColumns,
      itemWidth: computedItemWidth,
      rowCount: computedRowCount,
      rowStride: computedRowStride,
      totalHeight: computedTotalHeight
    };
  }, [containerWidth, gap, itemHeight, items.length, minColumnWidth]);
  const maxScrollTop = useMemo(
    () => Math.max(0, totalHeight - viewportHeight),
    [totalHeight, viewportHeight]
  );

  useEffect(() => {
    if (scrollTop <= maxScrollTop) {
      return;
    }

    const nextScrollTop = maxScrollTop;
    const node = containerRef.current;
    if (node && node.scrollTop !== nextScrollTop) {
      node.scrollTop = nextScrollTop;
    }
    setScrollTop(nextScrollTop);
  }, [maxScrollTop, scrollTop]);

  const { startRow, endRow } = useMemo(() => {
    if (rowCount === 0 || viewportHeight <= 0) {
      return { startRow: 0, endRow: 0 };
    }

    const visibleStart = Math.floor(scrollTop / Math.max(rowStride, 1));
    const visibleEnd = Math.ceil((scrollTop + viewportHeight) / Math.max(rowStride, 1));

    return {
      startRow: Math.max(0, visibleStart - overscanRows),
      endRow: Math.min(rowCount, visibleEnd + overscanRows)
    };
  }, [overscanRows, rowCount, rowStride, scrollTop, viewportHeight]);

  const visibleEntries = useMemo(() => {
    const entries: Array<{ item: T; index: number; row: number; col: number }> = [];

    for (let row = startRow; row < endRow; row += 1) {
      for (let col = 0; col < columnCount; col += 1) {
        const index = row * columnCount + col;
        if (index >= items.length) {
          break;
        }
        entries.push({
          item: items[index],
          index,
          row,
          col
        });
      }
    }

    return entries;
  }, [columnCount, endRow, items, startRow]);

  return (
    <div ref={containerRef} onScroll={handleScroll} className={className}>
      <div style={{ position: "relative", height: `${totalHeight}px` }}>
        {visibleEntries.map(({ item, index, row, col }) => (
          <div
            key={itemKey(item, index)}
            style={{
              position: "absolute",
              top: `${row * rowStride}px`,
              left: `${col * (itemWidth + gap)}px`,
              width: `${itemWidth}px`,
              height: `${itemHeight}px`
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
