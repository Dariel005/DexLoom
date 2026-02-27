"use client";

import { PokedexFrame } from "@/components/PokedexFrame";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";

interface EncyclopediaRouteShellProps {
  title: string;
  categoryLabel: string;
  description: string;
  highlights: string[];
  nextMilestones: string[];
}

export function EncyclopediaRouteShell({
  title,
  categoryLabel,
  description,
  highlights,
  nextMilestones
}: EncyclopediaRouteShellProps) {
  const leftPanel = (
    <section className="space-y-4">
      <RouteTransitionLink
        href="/"
        className="gbc-nav-link pixel-font inline-flex rounded-lg border border-black/25 bg-white/65 px-3 py-2 text-[10px] uppercase tracking-wide text-black/75 transition hover:bg-white"
      >
        Back to Pokedex
      </RouteTransitionLink>

      <div className="rounded-2xl border border-black/20 bg-white/55 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          {categoryLabel}
        </p>
        <h1 className="pixel-font mt-2 text-[14px] uppercase tracking-wide text-black/85">
          {title}
        </h1>
        <p className="mt-2 text-sm text-black/70">{description}</p>
      </div>

      <div className="rounded-2xl border border-black/20 bg-white/55 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Phase 3 Foundations
        </p>
        <div className="mt-3 grid gap-2">
          {highlights.map((highlight) => (
            <p
              key={highlight}
              className="rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/75"
            >
              {highlight}
            </p>
          ))}
        </div>
      </div>
    </section>
  );

  const rightPanel = (
    <section className="space-y-4">
      <div className="rounded-2xl border border-black/20 bg-white/55 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Delivery Plan
        </p>
        <p className="mt-2 text-sm text-black/70">
          Route scaffold is active and ready for incremental data modules.
        </p>
      </div>

      <div className="rounded-2xl border border-black/20 bg-white/55 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Next Milestones
        </p>
        <ol className="mt-2 space-y-2 text-sm text-black/75">
          {nextMilestones.map((milestone, index) => (
            <li
              key={milestone}
              className="rounded-lg border border-black/20 bg-white/70 px-3 py-2"
            >
              {index + 1}. {milestone}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );

  return (
    <PokedexFrame
      title={title}
      status="success"
      leftPanel={leftPanel}
      rightPanel={rightPanel}
    />
  );
}
