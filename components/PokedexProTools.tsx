"use client";

import { useState } from "react";
import { ComparatorToolPanel } from "@/components/tools/pro-tools/ComparatorToolPanel";
import { MovePlannerToolPanel } from "@/components/tools/pro-tools/MovePlannerToolPanel";
import { TeamBuilderToolPanel } from "@/components/tools/pro-tools/TeamBuilderToolPanel";
import { cn } from "@/lib/utils";
import { type PokemonListEntry } from "@/types/pokemon";

type ToolTab = "compare" | "team" | "planner";

interface PokedexProToolsProps {
  candidatePokemon: PokemonListEntry[];
  selectedPokemonId: number | null;
  onSelectPokemon: (pokemonId: number) => void;
}

export function PokedexProTools({
  candidatePokemon,
  selectedPokemonId,
  onSelectPokemon
}: PokedexProToolsProps) {
  const [activeTab, setActiveTab] = useState<ToolTab>("compare");

  return (
    <section className="rounded-2xl border border-black/20 bg-white/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="pixel-font text-[10px] uppercase tracking-[0.18em] text-black/70">
          Pro Tools Lab
        </p>
        <p className="text-xs text-black/55">Comparator + Team Builder + Move Planner</p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("compare")}
          className={cn(
            "rounded-lg border px-2 py-1.5 text-xs transition",
            activeTab === "compare"
              ? "border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-black/85 pokedex-accent-glow"
              : "border-black/20 bg-white/60 text-black/70"
          )}
        >
          Comparator
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("team")}
          className={cn(
            "rounded-lg border px-2 py-1.5 text-xs transition",
            activeTab === "team"
              ? "border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-black/85 pokedex-accent-glow"
              : "border-black/20 bg-white/60 text-black/70"
          )}
        >
          Team Builder
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("planner")}
          className={cn(
            "rounded-lg border px-2 py-1.5 text-xs transition",
            activeTab === "planner"
              ? "border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-black/85 pokedex-accent-glow"
              : "border-black/20 bg-white/60 text-black/70"
          )}
        >
          Move Planner
        </button>
      </div>

      <div className="mt-3">
        {activeTab === "compare" ? (
          <ComparatorToolPanel
            candidatePokemon={candidatePokemon}
            selectedPokemonId={selectedPokemonId}
            onSelectPokemon={onSelectPokemon}
          />
        ) : null}

        {activeTab === "team" ? (
          <TeamBuilderToolPanel
            candidatePokemon={candidatePokemon}
            selectedPokemonId={selectedPokemonId}
          />
        ) : null}

        {activeTab === "planner" ? (
          <MovePlannerToolPanel
            candidatePokemon={candidatePokemon}
            selectedPokemonId={selectedPokemonId}
          />
        ) : null}
      </div>
    </section>
  );
}

