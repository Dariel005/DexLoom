"use client";

import { type ReactNode, type CSSProperties } from "react";

interface ExplorerDetailSectionProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    /** Optional accent color for the section border and title. */
    accentColor?: string;
    /** Optional soft background tint color. */
    softColor?: string;
}

/**
 * Reusable detail panel section with GBA-styled border, gradient background,
 * pixel-font heading, and optional subtitle. Used in right-panel detail views.
 */
export function ExplorerDetailSection({
    title,
    subtitle,
    children,
    accentColor,
    softColor
}: ExplorerDetailSectionProps) {
    const style: CSSProperties = {
        ...(accentColor ? { borderColor: accentColor } : {}),
        ...(softColor
            ? { background: `linear-gradient(160deg, ${softColor}, rgba(255,255,255,0.72))` }
            : {})
    };

    return (
        <section className="rounded-2xl border border-black/20 bg-white/55 p-4" style={style}>
            <div className="mb-3">
                <h2
                    className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75"
                    style={accentColor ? { color: accentColor } : undefined}
                >
                    {title}
                </h2>
                {subtitle ? <p className="mt-1 text-sm text-black/60">{subtitle}</p> : null}
            </div>
            {children}
        </section>
    );
}
