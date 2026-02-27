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

interface VirtualizedStackProps<T> {
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemKey: (item: T, index: number) => string | number;
  itemHeight: number;
  gap?: number;
  overscan?: number;
  className?: string;
}

export function VirtualizedStack<T>({
  items,
  renderItem,
  itemKey,
  itemHeight,
  gap = 0,
  overscan = 6,
  className
}: VirtualizedStackProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const stride = itemHeight + gap;

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const updateViewportHeight = () => setViewportHeight(node.clientHeight);
    updateViewportHeight();

    if (typeof window === "undefined" || typeof window.ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(updateViewportHeight);
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

  const totalHeight = useMemo(() => {
    if (items.length === 0) {
      return 0;
    }
    return items.length * stride - gap;
  }, [gap, items.length, stride]);
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

  const { startIndex, endIndex } = useMemo(() => {
    if (items.length === 0 || viewportHeight <= 0) {
      return { startIndex: 0, endIndex: 0 };
    }

    const visibleStart = Math.floor(scrollTop / Math.max(stride, 1));
    const visibleEnd = Math.ceil((scrollTop + viewportHeight) / Math.max(stride, 1));

    return {
      startIndex: Math.max(0, visibleStart - overscan),
      endIndex: Math.min(items.length, visibleEnd + overscan)
    };
  }, [items.length, overscan, scrollTop, stride, viewportHeight]);

  const visibleEntries = useMemo(() => {
    const entries: Array<{ item: T; index: number }> = [];
    for (let index = startIndex; index < endIndex; index += 1) {
      entries.push({ item: items[index], index });
    }
    return entries;
  }, [endIndex, items, startIndex]);

  return (
    <div ref={containerRef} onScroll={handleScroll} className={className}>
      <div style={{ position: "relative", height: `${totalHeight}px` }}>
        {visibleEntries.map(({ item, index }) => (
          <div
            key={itemKey(item, index)}
            style={{
              position: "absolute",
              top: `${index * stride}px`,
              left: 0,
              right: 0,
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
