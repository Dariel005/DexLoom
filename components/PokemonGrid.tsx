"use client";

import { memo, useMemo } from "react";
import { type PokemonListEntry } from "@/types/pokemon";
import { PokemonCard } from "@/components/PokemonCard";
import { ViewportRender } from "@/components/ViewportRender";

interface PokemonGridProps {
  pokemon: PokemonListEntry[];
  selectedPokemonId: number | null;
  favoriteIds: number[];
  canToggleFavorite: boolean;
  onSelectPokemon: (id: number) => void;
  onToggleFavorite: (id: number) => void;
}

function PokemonGridComponent({
  pokemon,
  selectedPokemonId,
  favoriteIds,
  canToggleFavorite,
  onSelectPokemon,
  onToggleFavorite
}: PokemonGridProps) {
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const useViewportCulling = pokemon.length > 42;
  const enableCardEntranceMotion = pokemon.length <= 36 && !useViewportCulling;

  return (
    <div className="pokemon-grid-panel rounded-2xl border border-black/25 bg-black/[0.06] p-3">
      {pokemon.length > 0 ? (
        <div className="pokemon-grid-lattice grid gap-3 sm:gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,236px),1fr))]">
          {pokemon.map((entry, index) => {
            const cardContent = (
              <PokemonCard
                pokemon={entry}
                index={index}
                isFavorite={favoriteIdSet.has(entry.id)}
                isSelected={selectedPokemonId === entry.id}
                canToggleFavorite={canToggleFavorite}
                onSelect={onSelectPokemon}
                onToggleFavorite={onToggleFavorite}
                enableEntranceMotion={enableCardEntranceMotion}
              />
            );

            return useViewportCulling ? (
              <ViewportRender
                key={`card-${entry.id}`}
                enabled
                rootMargin="420px 0px"
                minHeight={252}
                className="h-full"
                placeholderClassName="rounded-2xl border border-black/10 bg-black/5"
              >
                {cardContent}
              </ViewportRender>
            ) : (
              <PokemonCard
                key={`card-${entry.id}`}
                pokemon={entry}
                index={index}
                isFavorite={favoriteIdSet.has(entry.id)}
                isSelected={selectedPokemonId === entry.id}
                canToggleFavorite={canToggleFavorite}
                onSelect={onSelectPokemon}
                onToggleFavorite={onToggleFavorite}
                enableEntranceMotion={enableCardEntranceMotion}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-black/35 bg-white/40">
          <p className="pixel-font text-center text-[11px] uppercase tracking-wide text-black/65">
            No Pokemon found
          </p>
        </div>
      )}
    </div>
  );
}

export const PokemonGrid = memo(PokemonGridComponent);
