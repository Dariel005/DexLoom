"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface ExplorerPaginationProps {
    currentPage: number;
    totalPages: number;
    onPrevious: () => void;
    onNext: () => void;
    className?: string;
}

/**
 * Compact pagination control with pixel-font styling.
 * Shared across ItemsExplorer, CardsExplorer, MapsExplorer, etc.
 */
export function ExplorerPagination({
    currentPage,
    totalPages,
    onPrevious,
    onNext,
    className
}: ExplorerPaginationProps) {
    const { t } = useTranslation();

    if (totalPages <= 1) {
        return null;
    }

    return (
        <div
            className={cn(
                "mt-2 flex items-center justify-between gap-2 rounded-xl border border-black/20 bg-white/60 px-3 py-2",
                className
            )}
        >
            <button
                type="button"
                onClick={onPrevious}
                disabled={currentPage <= 1}
                className="pixel-font rounded-lg border border-black/20 bg-white/70 px-3 py-1.5 text-[10px] uppercase tracking-wide text-black/70 transition hover:bg-white disabled:opacity-40 disabled:hover:bg-white/70"
            >
                {t("explorer.prev")}
            </button>
            <span className="pixel-font text-[10px] uppercase tracking-wide text-black/65">
                {t("explorer.page")} {currentPage} / {totalPages}
            </span>
            <button
                type="button"
                onClick={onNext}
                disabled={currentPage >= totalPages}
                className="pixel-font rounded-lg border border-black/20 bg-white/70 px-3 py-1.5 text-[10px] uppercase tracking-wide text-black/70 transition hover:bg-white disabled:opacity-40 disabled:hover:bg-white/70"
            >
                {t("explorer.next")}
            </button>
        </div>
    );
}
