"use client";

import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type VisibilityCallback = (entry: IntersectionObserverEntry) => void;

interface ObserverBucket {
  observer: IntersectionObserver;
  callbacks: Map<Element, VisibilityCallback>;
}

const observerBuckets = new Map<string, ObserverBucket>();

function getObserverKey(rootMargin: string, threshold: number) {
  return `${rootMargin}::${threshold}`;
}

function getObserverBucket(rootMargin: string, threshold: number): ObserverBucket | null {
  if (typeof window === "undefined" || typeof window.IntersectionObserver === "undefined") {
    return null;
  }

  const key = getObserverKey(rootMargin, threshold);
  const existing = observerBuckets.get(key);
  if (existing) {
    return existing;
  }

  const callbacks = new Map<Element, VisibilityCallback>();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const callback = callbacks.get(entry.target);
        if (callback) {
          callback(entry);
        }
      });
    },
    {
      root: null,
      rootMargin,
      threshold
    }
  );

  const bucket: ObserverBucket = {
    observer,
    callbacks
  };

  observerBuckets.set(key, bucket);
  return bucket;
}

function observeElement(
  node: Element,
  rootMargin: string,
  threshold: number,
  callback: VisibilityCallback
) {
  const bucket = getObserverBucket(rootMargin, threshold);
  if (!bucket) {
    callback({
      isIntersecting: true
    } as IntersectionObserverEntry);
    return () => {};
  }

  const key = getObserverKey(rootMargin, threshold);
  bucket.callbacks.set(node, callback);
  bucket.observer.observe(node);

  return () => {
    const currentBucket = observerBuckets.get(key);
    if (!currentBucket) {
      return;
    }

    currentBucket.observer.unobserve(node);
    currentBucket.callbacks.delete(node);

    if (currentBucket.callbacks.size === 0) {
      currentBucket.observer.disconnect();
      observerBuckets.delete(key);
    }
  };
}

interface ViewportRenderProps {
  children: ReactNode;
  enabled?: boolean;
  rootMargin?: string;
  threshold?: number;
  minHeight?: number | string;
  placeholderClassName?: string;
  className?: string;
}

export function ViewportRender({
  children,
  enabled = true,
  rootMargin = "360px 0px",
  threshold = 0,
  minHeight,
  placeholderClassName,
  className
}: ViewportRenderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(!enabled);
  const hasBeenVisibleRef = useRef(!enabled);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(true);
      hasBeenVisibleRef.current = true;
      return;
    }

    if (hasBeenVisibleRef.current) {
      setIsVisible(true);
      return;
    }

    const node = containerRef.current;
    if (!node) {
      setIsVisible(true);
      hasBeenVisibleRef.current = true;
      return;
    }

    let unobserve = () => {};

    unobserve = observeElement(node, rootMargin, threshold, (entry) => {
      if (!entry.isIntersecting || hasBeenVisibleRef.current) {
        return;
      }

      hasBeenVisibleRef.current = true;
      setIsVisible(true);
      unobserve();
    });

    return () => {
      unobserve();
    };
  }, [enabled, rootMargin, threshold]);

  const placeholderStyle = useMemo<CSSProperties | undefined>(() => {
    if (minHeight === undefined) {
      return undefined;
    }
    const resolved = typeof minHeight === "number" ? `${minHeight}px` : minHeight;
    return { minHeight: resolved };
  }, [minHeight]);

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? (
        children
      ) : (
        <div
          aria-hidden
          style={placeholderStyle}
          className={cn("rounded-xl border border-black/10 bg-black/5", placeholderClassName)}
        />
      )}
    </div>
  );
}
