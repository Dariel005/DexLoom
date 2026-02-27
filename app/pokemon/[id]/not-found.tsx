import Link from "next/link";
import { PokedexFrame } from "@/components/PokedexFrame";

export default function PokemonNotFound() {
  const leftPanel = (
    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-black/30 bg-white/45 p-6">
      <p className="pixel-font text-center text-[11px] uppercase tracking-wide text-black/70">
        Unknown Pokemon
      </p>
    </div>
  );

  const rightPanel = (
    <div className="space-y-3 rounded-2xl border border-black/25 bg-white/60 p-4">
      <h2 className="pixel-font text-[11px] uppercase tracking-wide text-black/70">
        Pokemon not found
      </h2>
      <p className="text-sm text-black/75">
        The requested entry does not exist in this dataset.
      </p>
      <Link
        href="/"
        className="pixel-font inline-flex rounded-lg border border-black/35 bg-pokedex-red px-3 py-2 text-[10px] uppercase tracking-wide text-white"
      >
        Return to index
      </Link>
    </div>
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <PokedexFrame title="Missing Entry" status="error" leftPanel={leftPanel} rightPanel={rightPanel} />
    </main>
  );
}
