"use client";

import { memo, useMemo } from "react";
import { ViewportRender } from "@/components/ViewportRender";
import { MegaEvolutionCard } from "@/components/mega/MegaEvolutionCard";
import { type MegaEvolutionEntry } from "@/lib/mega-evolutions-encyclopedia";

interface MegaEvolutionGridProps {
  entries: MegaEvolutionEntry[];
  selectedSlug: string | null;
  favoriteSlugs: string[];
  canToggleFavorite: boolean;
  onSelectEntry: (slug: string) => void;
  onToggleFavorite: (slug: string) => void;
}

function MegaEvolutionGridComponent({
  entries,
  selectedSlug,
  favoriteSlugs,
  canToggleFavorite,
  onSelectEntry,
  onToggleFavorite
}: MegaEvolutionGridProps) {
  const favoriteSlugSet = useMemo(() => new Set(favoriteSlugs), [favoriteSlugs]);
  const useViewportCulling = entries.length > 42;
  const enableCardEntranceMotion = entries.length <= 36 && !useViewportCulling;

  return (
    <div className="mega-grid-panel rounded-2xl border border-black/25 bg-black/[0.06] p-3">
      {entries.length > 0 ? (
        <div className="mega-grid-lattice grid gap-3 sm:gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,236px),1fr))]">
          {entries.map((entry, index) => {
            const cardContent = (
              <MegaEvolutionCard
                entry={entry}
                index={index}
                isFavorite={favoriteSlugSet.has(entry.slug)}
                isSelected={selectedSlug === entry.slug}
                canToggleFavorite={canToggleFavorite}
                onSelect={onSelectEntry}
                onToggleFavorite={onToggleFavorite}
                enableEntranceMotion={enableCardEntranceMotion}
              />
            );

            return useViewportCulling ? (
              <ViewportRender
                key={`mega-card-${entry.slug}`}
                enabled
                rootMargin="420px 0px"
                minHeight={252}
                className="h-full"
                placeholderClassName="rounded-2xl border border-black/10 bg-black/5"
              >
                {cardContent}
              </ViewportRender>
            ) : (
              <MegaEvolutionCard
                key={`mega-card-${entry.slug}`}
                entry={entry}
                index={index}
                isFavorite={favoriteSlugSet.has(entry.slug)}
                isSelected={selectedSlug === entry.slug}
                canToggleFavorite={canToggleFavorite}
                onSelect={onSelectEntry}
                onToggleFavorite={onToggleFavorite}
                enableEntranceMotion={enableCardEntranceMotion}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-black/35 bg-white/40">
          <p className="pixel-font text-center text-[11px] uppercase tracking-wide text-black/65">
            No Mega evolutions found
          </p>
        </div>
      )}
    </div>
  );
}

export const MegaEvolutionGrid = memo(MegaEvolutionGridComponent);
