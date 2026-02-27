"use client";

import { cn } from "@/lib/utils";

interface PokemonGridSkeletonProps {
  count?: number;
  className?: string;
}

export function RegionDeckSkeleton() {
  return (
    <div className="rounded-2xl border border-black/20 bg-white/20 p-3">
      <div className="rounded-xl border border-black/20 bg-white/60 px-3 py-2">
        <div className="pokedex-skeleton h-2.5 w-24 rounded-full" />
        <div className="pokedex-skeleton mt-2 h-2.5 w-44 rounded-full" />
      </div>

      <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
        <div className="pokedex-skeleton h-7 w-7 rounded-full" />
        <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={`region-card-skeleton-${index}`}
              className="pokedex-skeleton h-[68px] rounded-xl"
            />
          ))}
        </div>
        <div className="pokedex-skeleton h-7 w-7 rounded-full" />
      </div>
    </div>
  );
}

export function ProToolsPanelSkeleton() {
  return (
    <div className="rounded-2xl border border-black/20 bg-white/30 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="pokedex-skeleton h-2.5 w-28 rounded-full" />
        <div className="pokedex-skeleton h-7 w-16 rounded-md" />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="pokedex-skeleton h-8 rounded-lg" />
        <div className="pokedex-skeleton h-8 rounded-lg" />
        <div className="pokedex-skeleton h-8 rounded-lg" />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="pokedex-skeleton h-9 rounded-lg" />
        <div className="pokedex-skeleton h-9 rounded-lg" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="pokedex-skeleton h-9 rounded-lg" />
        <div className="pokedex-skeleton h-9 rounded-lg" />
        <div className="pokedex-skeleton h-9 rounded-lg" />
      </div>
    </div>
  );
}

export function DetailModuleSkeleton() {
  return (
    <div className="rounded-2xl border border-black/20 bg-white/60 p-3">
      <div className="pokedex-skeleton h-3 w-24 rounded-full" />
      <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr] sm:items-center">
        <div className="pokedex-skeleton h-32 rounded-xl" />
        <div className="space-y-2">
          <div className="pokedex-skeleton h-3 w-40 rounded-full" />
          <div className="pokedex-skeleton h-3 w-32 rounded-full" />
          <div className="pokedex-skeleton h-8 w-full rounded-lg" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="pokedex-skeleton h-8 rounded-lg" />
        <div className="pokedex-skeleton h-8 rounded-lg" />
      </div>
    </div>
  );
}

export function PokemonGridSkeleton({
  count = 8,
  className
}: PokemonGridSkeletonProps) {
  return (
    <div className={cn("rounded-2xl border border-black/25 bg-white/20 p-3", className)}>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
        {Array.from({ length: count }, (_, index) => (
          <article
            key={`pokemon-grid-skeleton-${index}`}
            className="rounded-2xl border border-black/15 bg-white/60 p-3.5 shadow-[0_8px_16px_rgba(0,0,0,0.07)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="pokedex-skeleton h-2.5 w-16 rounded-full" />
                <div className="pokedex-skeleton h-3.5 w-28 rounded-full" />
                <div className="pokedex-skeleton h-2.5 w-20 rounded-full" />
              </div>
              <div className="pokedex-skeleton h-8 w-8 rounded-full" />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="pokedex-skeleton h-24 w-24 rounded-xl sm:h-28 sm:w-28" />
              <div className="grid min-h-[52px] min-w-[112px] content-start justify-items-end gap-1.5 sm:min-h-[56px]">
                <div className="pokedex-skeleton h-6 w-20 rounded-full" />
                <div className="pokedex-skeleton h-6 w-20 rounded-full" />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="pokedex-skeleton h-7 w-14 rounded-lg" />
              <div className="pokedex-skeleton h-8 w-16 rounded-lg" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}


