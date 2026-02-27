"use client";

import { cn } from "@/lib/utils";

interface ExplorerGridSkeletonProps {
    count?: number;
    minWidth?: number;
    minHeight?: number;
    className?: string;
}

/**
 * Animated pulse skeleton grid for loading states in Explorer views.
 * Configurable column width, item height, and item count.
 */
export function ExplorerGridSkeleton({
    count = 12,
    minWidth = 188,
    minHeight = 236,
    className
}: ExplorerGridSkeletonProps) {
    return (
        <div
            className={cn("grid gap-2", className)}
            style={{
                gridTemplateColumns: `repeat(auto-fill,minmax(${minWidth}px,1fr))`
            }}
        >
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={`skeleton-${index}`}
                    className="animate-pulse rounded-xl bg-black/10"
                    style={{ minHeight: `${minHeight}px` }}
                />
            ))}
        </div>
    );
}
