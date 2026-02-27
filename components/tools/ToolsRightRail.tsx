import { type ReactNode } from "react";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { ToolsSectionNav } from "@/components/tools/ToolsSectionNav";

interface ToolsRightRailProps {
  guideTitle: string;
  guideItems: string[];
  footerNote?: ReactNode;
}

export function ToolsRightRail({
  guideTitle,
  guideItems,
  footerNote
}: ToolsRightRailProps) {
  return (
    <section className="space-y-4">
      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Quick Links
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <RouteTransitionLink
            href="/"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Back to Pokedex
          </RouteTransitionLink>
          <RouteTransitionLink
            href="/tools"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Tools Hub
          </RouteTransitionLink>
          <RouteTransitionLink
            href="/sources"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Sources
          </RouteTransitionLink>
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Tools Navigation
        </p>
        <ToolsSectionNav className="mt-2" />
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          {guideTitle}
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-black/75">
          {guideItems.map((item) => (
            <li
              key={`${guideTitle}-${item}`}
              className="rounded-lg border border-black/15 bg-white/70 px-2.5 py-2"
            >
              {item}
            </li>
          ))}
        </ul>
        {footerNote ? (
          <div className="mt-2 rounded-lg border border-black/15 bg-white/70 px-2.5 py-2 text-xs text-black/68">
            {footerNote}
          </div>
        ) : null}
      </section>
    </section>
  );
}

