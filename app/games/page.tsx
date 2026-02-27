import type { Metadata } from "next";
import { GameCard } from "@/components/games/GameCard";
import { PokedexFrame } from "@/components/PokedexFrame";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { SectionModuleNav } from "@/components/SectionModuleNav";
import { MAINLINE_GAME_CATALOG, MOBILE_GAME_CATALOG } from "@/lib/mainline-games";

export const revalidate = 604800; // 7 days

export const metadata: Metadata = {
  title: "Pokemon Video Games",
  description:
    "Pokemon game catalog with mainline and mobile entries, card-style browsing, and full detail pages for each listed release."
};

function InfoChip({
  label,
  tone = "neutral"
}: {
  label: string;
  tone?: "neutral" | "sky" | "amber" | "green";
}) {
  const toneClass =
    tone === "sky"
      ? "border-sky-300/85 bg-sky-100/72 text-sky-900"
      : tone === "amber"
        ? "border-amber-300/85 bg-amber-100/72 text-amber-900"
        : tone === "green"
          ? "border-emerald-300/85 bg-emerald-100/72 text-emerald-900"
          : "border-black/20 bg-white/72 text-black/74";

  return <span className={`rounded-md border px-2 py-1 text-xs ${toneClass}`}>{label}</span>;
}

export default function GamesPage() {
  const platformCount = new Set(
    [...MAINLINE_GAME_CATALOG, ...MOBILE_GAME_CATALOG].map((entry) => entry.platform)
  ).size;
  const generationCount = new Set(MAINLINE_GAME_CATALOG.map((entry) => entry.generationKey)).size;
  const mobilePlatformCount = new Set(MOBILE_GAME_CATALOG.map((entry) => entry.platform)).size;

  const leftPanel = (
    <section className="space-y-4">
      <section className="rounded-2xl border border-black/20 bg-[radial-gradient(circle_at_10%_6%,rgba(255,255,255,0.6),transparent_36%),linear-gradient(158deg,rgba(255,255,255,0.84),rgba(224,238,227,0.72))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_10px_20px_rgba(0,0,0,0.08)]">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/68">Video Games</p>
        <h1 className="pixel-font mt-2 text-[14px] uppercase tracking-[0.12em] text-black/86">
          Pokemon Game Index
        </h1>
        <p className="mt-2 text-sm text-black/76">
          Browse mainline and mobile Pokemon releases as entry cards, then open each game page for
          full key information, feature notes, and related titles.
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <InfoChip label={`Mainline entries: ${MAINLINE_GAME_CATALOG.length}`} />
          <InfoChip label={`Mobile entries: ${MOBILE_GAME_CATALOG.length}`} tone="green" />
          <InfoChip label={`Generation blocks: ${generationCount}`} tone="amber" />
          <InfoChip label={`Platform groups: ${platformCount}`} tone="sky" />
          <InfoChip label="Detail page per game" tone="neutral" />
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.78),rgba(228,238,229,0.7))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Quick Links</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <RouteTransitionLink
            href="/"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Back to Pokedex
          </RouteTransitionLink>
          <RouteTransitionLink
            href="/maps"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Region Maps
          </RouteTransitionLink>
          <RouteTransitionLink
            href="/characters"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Character Directory
          </RouteTransitionLink>
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.8),rgba(223,236,229,0.72))] p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
              Mainline Cards
            </p>
            <p className="mt-1 text-sm text-black/75">
              Card layout mirrors the Pokedex home style. Click any part of a card to open the full
              game entry.
            </p>
          </div>
          <span className="rounded-md border border-black/20 bg-white/72 px-2 py-1 text-xs text-black/72">
            {MAINLINE_GAME_CATALOG.length} games
          </span>
        </div>

        <div className="mt-3 rounded-2xl border border-black/25 bg-black/[0.06] p-3">
          <div className="grid gap-3.5 sm:gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,268px),1fr))]">
            {MAINLINE_GAME_CATALOG.map((game) => (
              <GameCard key={game.slug} game={game} />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.8),rgba(220,241,233,0.74))] p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
              Mobile & Live Service Cards
            </p>
            <p className="mt-1 text-sm text-black/75">
              Mobile Pokemon games now appear here with the same card interaction and dedicated entry pages.
            </p>
          </div>
          <span className="rounded-md border border-black/20 bg-white/72 px-2 py-1 text-xs text-black/72">
            {MOBILE_GAME_CATALOG.length} games
          </span>
        </div>

        <div className="mt-3 rounded-2xl border border-black/25 bg-black/[0.06] p-3">
          <div className="grid gap-3.5 sm:gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,268px),1fr))]">
            {MOBILE_GAME_CATALOG.map((game) => (
              <GameCard key={game.slug} game={game} />
            ))}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <InfoChip label={`Mobile platform groups: ${mobilePlatformCount}`} tone="sky" />
          <InfoChip label="Includes active service titles" tone="green" />
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Data Coverage</p>
        <p className="mt-2 text-sm text-black/75">
          Every card opens a dedicated detail entry with release profile, key features, progression
          summary, and related-game navigation.
        </p>
      </section>

      <SectionModuleNav />
    </section>
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Pokemon Video Games",
    description:
      "Pokemon game catalog with mainline and mobile entries, card-style browsing, and full detail pages for each listed release."
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <PokedexFrame title="Pokemon Video Games" status="success" leftPanel={leftPanel} />
      </main>
    </>
  );
}
