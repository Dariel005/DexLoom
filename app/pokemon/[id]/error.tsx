"use client";

import Link from "next/link";
import { PokedexFrame } from "@/components/PokedexFrame";

interface PokemonDetailErrorProps {
  reset: () => void;
}

export default function PokemonDetailError({ reset }: PokemonDetailErrorProps) {
  const leftPanel = (
    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-black/30 bg-white/45 p-6">
      <p className="pixel-font text-center text-[11px] uppercase tracking-wide text-black/70">
        Data read error
      </p>
    </div>
  );

  const rightPanel = (
    <div className="space-y-3 rounded-2xl border border-black/25 bg-white/60 p-4">
      <h2 className="pixel-font text-[11px] uppercase tracking-wide text-black/70">
        Unable to load Pokemon
      </h2>
      <p className="text-sm text-black/75">
        The request failed while loading this Pokemon profile.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={reset}
          className="pixel-font rounded-lg border border-black/35 bg-electric-yellow px-3 py-2 text-[10px] uppercase tracking-wide"
        >
          Retry
        </button>
        <Link
          href="/"
          className="pixel-font rounded-lg border border-black/35 bg-pokedex-red px-3 py-2 text-[10px] uppercase tracking-wide text-white"
        >
          Return home
        </Link>
      </div>
    </div>
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <PokedexFrame title="System Error" status="error" leftPanel={leftPanel} rightPanel={rightPanel} />
    </main>
  );
}
