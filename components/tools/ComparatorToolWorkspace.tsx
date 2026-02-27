"use client";

import { ComparatorToolPanel } from "@/components/tools/pro-tools/ComparatorToolPanel";
import { usePokedexStore } from "@/store/pokedex-store";
import { type PokemonListEntry } from "@/types/pokemon";
import { useShallow } from "zustand/react/shallow";

interface ComparatorToolWorkspaceProps {
  candidatePokemon: PokemonListEntry[];
}

export function ComparatorToolWorkspace({
  candidatePokemon
}: ComparatorToolWorkspaceProps) {
  const { selectedPokemonId, setSelectedPokemon } = usePokedexStore(
    useShallow((state) => ({
      selectedPokemonId: state.selectedPokemonId,
      setSelectedPokemon: state.setSelectedPokemon
    }))
  );

  return (
    <section className="rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.8),rgba(223,236,229,0.72))] p-4">
      <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/72">
        Comparator Engine
      </p>
      <p className="mt-2 text-sm text-black/75">
        Evaluate A/B candidates by role and stat focus to pick stronger performers per slot.
      </p>
      <ComparatorToolPanel
        candidatePokemon={candidatePokemon}
        selectedPokemonId={selectedPokemonId}
        onSelectPokemon={setSelectedPokemon}
        className="mt-3"
      />
    </section>
  );
}

