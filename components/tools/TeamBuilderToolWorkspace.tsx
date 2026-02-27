"use client";

import { TeamBuilderToolPanel } from "@/components/tools/pro-tools/TeamBuilderToolPanel";
import { usePokedexStore } from "@/store/pokedex-store";
import { type PokemonListEntry } from "@/types/pokemon";

interface TeamBuilderToolWorkspaceProps {
  candidatePokemon: PokemonListEntry[];
}

export function TeamBuilderToolWorkspace({
  candidatePokemon
}: TeamBuilderToolWorkspaceProps) {
  const selectedPokemonId = usePokedexStore((state) => state.selectedPokemonId);

  return (
    <section className="rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.8),rgba(223,236,229,0.72))] p-4">
      <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/72">
        Team Builder Matrix
      </p>
      <p className="mt-2 text-sm text-black/75">
        Assemble up to six members, diagnose coverage risks, and iterate toward stable synergy.
      </p>
      <TeamBuilderToolPanel
        candidatePokemon={candidatePokemon}
        selectedPokemonId={selectedPokemonId}
        className="mt-3"
      />
    </section>
  );
}

