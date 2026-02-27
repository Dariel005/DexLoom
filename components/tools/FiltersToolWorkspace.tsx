"use client";

import { useMemo } from "react";
import { PokemonSearchFilters } from "@/components/PokemonSearchFilters";
import { GENERATIONS } from "@/lib/generations";
import { ALL_TYPES } from "@/lib/pokedex-pro-tools";
import { type PokemonGenerationFilter } from "@/types/pokemon";

export function FiltersToolWorkspace() {
  const availableTypeOptions = useMemo(
    () => ALL_TYPES.map((type) => ({ value: type.toLowerCase(), label: type })),
    []
  );

  const availableGenerationOptions = useMemo(
    () =>
      GENERATIONS.map((generation) => ({
        value: generation.key as PokemonGenerationFilter,
        label: `${generation.label} (${generation.region})`
      })),
    []
  );

  return (
    <section className="rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.8),rgba(225,239,228,0.72))] p-4">
      <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/72">
        Filters Console
      </p>
      <p className="mt-2 text-sm text-black/75">
        Tune global filters for name, Dex ID, type, generation, and attack floor.
      </p>
      <div className="mt-3">
        <PokemonSearchFilters
          availableTypes={availableTypeOptions}
          availableGenerations={availableGenerationOptions}
        />
      </div>
    </section>
  );
}

