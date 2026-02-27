import { PokedexFrame } from "@/components/PokedexFrame";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";

export default function GameNotFound() {
  const leftPanel = (
    <section className="space-y-4 rounded-2xl border border-black/20 bg-white/60 p-4">
      <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Game Entry</p>
      <h1 className="pixel-font text-[14px] uppercase tracking-[0.12em] text-black/85">
        Entry not found
      </h1>
      <p className="text-sm text-black/75">
        This game slug does not exist in the game catalog.
      </p>
      <div className="flex flex-wrap gap-2">
        <RouteTransitionLink
          href="/games"
          className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
        >
          Back to Games
        </RouteTransitionLink>
        <RouteTransitionLink
          href="/"
          className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
        >
          Back to Pokedex
        </RouteTransitionLink>
      </div>
    </section>
  );

  return (
    <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
      <PokedexFrame title="Game Entry Not Found" status="error" leftPanel={leftPanel} />
    </main>
  );
}
