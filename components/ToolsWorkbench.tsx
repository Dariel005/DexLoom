"use client";

import { useMemo } from "react";
import { PokedexProTools } from "@/components/PokedexProTools";
import { PokemonSearchFilters } from "@/components/PokemonSearchFilters";
import { SoundControlPanel } from "@/components/SoundControlPanel";
import { GENERATIONS } from "@/lib/generations";
import { ALL_TYPES } from "@/lib/pokedex-pro-tools";
import { usePokedexStore } from "@/store/pokedex-store";
import { type PokemonGenerationFilter, type PokemonListEntry } from "@/types/pokemon";
import { useShallow } from "zustand/react/shallow";

interface ToolsWorkbenchProps {
  candidatePokemon: PokemonListEntry[];
}

export function ToolsWorkbench({ candidatePokemon }: ToolsWorkbenchProps) {
  const { selectedPokemonId, setSelectedPokemon } = usePokedexStore(
    useShallow((state) => ({
      selectedPokemonId: state.selectedPokemonId,
      setSelectedPokemon: state.setSelectedPokemon
    }))
  );

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
    <section className="space-y-4">
      <section className="rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.8),rgba(225,239,228,0.72))] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/72">
            Filters Console
          </p>
          <span className="rounded-md border border-black/20 bg-white/72 px-2 py-1 text-xs text-black/72">
            Global filter state
          </span>
        </div>
        <p className="mt-2 text-sm text-black/75">
          Use advanced filters for name, National Dex ID, type, generation, and attack range.
        </p>
        <div className="mt-3">
          <PokemonSearchFilters
            availableTypes={availableTypeOptions}
            availableGenerations={availableGenerationOptions}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.8),rgba(223,236,229,0.72))] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/72">
            Pro Tools Lab
          </p>
          <span className="rounded-md border border-black/20 bg-white/72 px-2 py-1 text-xs text-black/72">
            {candidatePokemon.length} selectable entries
          </span>
        </div>
        <p className="mt-2 text-sm text-black/75">
          Comparator, Team Builder, and Move Planner from one workspace.
        </p>

        <div className="mt-3">
          {candidatePokemon.length > 0 ? (
            <PokedexProTools
              candidatePokemon={candidatePokemon}
              selectedPokemonId={selectedPokemonId}
              onSelectPokemon={setSelectedPokemon}
            />
          ) : (
            <div className="rounded-xl border border-black/20 bg-white/72 p-3 text-sm text-black/74">
              Tool data is temporarily unavailable. Please refresh in a moment.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.8),rgba(227,237,232,0.72))] p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/72">
          Audio Deck
        </p>
        <p className="mt-2 text-sm text-black/75">
          Control UI sound effects and output volume directly from the tools page.
        </p>
        <div className="mt-3 max-w-[460px]">
          <SoundControlPanel className="border border-black/20 bg-white/60 shadow-none" defaultExpanded />
        </div>
      </section>
    </section>
  );
}

