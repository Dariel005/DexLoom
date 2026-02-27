"use client";

import { MovePlannerToolPanel } from "@/components/tools/pro-tools/MovePlannerToolPanel";
import { usePokedexStore } from "@/store/pokedex-store";
import { type PokemonListEntry } from "@/types/pokemon";

interface MovePlannerToolWorkspaceProps {
  candidatePokemon: PokemonListEntry[];
}

export function MovePlannerToolWorkspace({
  candidatePokemon
}: MovePlannerToolWorkspaceProps) {
  const selectedPokemonId = usePokedexStore((state) => state.selectedPokemonId);

  return (
    <section className="rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.8),rgba(223,236,229,0.72))] p-4">
      <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/72">
        Move Planner Desk
      </p>
      <p className="mt-2 text-sm text-black/75">
        Filter learn methods, search move pools, and build practical acquisition plans quickly.
      </p>
      <MovePlannerToolPanel
        candidatePokemon={candidatePokemon}
        selectedPokemonId={selectedPokemonId}
        className="mt-3"
      />
    </section>
  );
}

