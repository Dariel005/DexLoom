"use client";

import { cn } from "@/lib/utils";

interface ExplorerEmptyStateProps {
    message?: string;
    className?: string;
}

/**
 * Empty-state placeholder for when a filter returns zero results.
 * Shows a dashed-border panel with a centered message.
 */
export function ExplorerEmptyState({
    message = "No results match this filter.",
    className
}: ExplorerEmptyStateProps) {
    return (
        <div className={cn("flex min-h-[300px] items-center justify-center", className)}>
            <p className="rounded-lg border border-dashed border-black/25 bg-white/75 px-4 py-3 text-sm text-black/65">
                {message}
            </p>
        </div>
    );
}
