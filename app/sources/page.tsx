import type { Metadata } from "next";
import Link from "next/link";
import { MobileDexBottomNav } from "@/components/MobileDexBottomNav";
import { PokedexFrame } from "@/components/PokedexFrame";
import { ReferencesBlock } from "@/components/wiki/ReferencesBlock";
import { CHARACTER_WIKI_INDEX } from "@/lib/characters-encyclopedia";

export const metadata: Metadata = {
  title: "Sources & Credits",
  description:
    "References, credits, data-source attribution, and copyright notice for this Pokemon wiki."
};

export default function SourcesPage() {
  const characterPortraitReferences = CHARACTER_WIKI_INDEX.map((character) => ({
    label: `${character.name} portrait - ${character.portraitCreditLabel}`,
    href: character.portraitCreditHref,
    note: character.portraitCreditNote
  }));

  const leftPanel = (
    <section id="sources-top" className="sources-mobile-left space-y-4">
      <section className="sources-mobile-hero rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Sources
        </p>
        <h1 className="pixel-font mt-2 text-[14px] uppercase tracking-[0.12em] text-black/85">
          Data & Media References
        </h1>
        <p className="mt-2 text-sm text-black/75">
          This page centralizes origin references for API data, sprites, maps, and supporting
          metadata used across the wiki.
        </p>
      </section>

      <ReferencesBlock
        className="sources-mobile-section"
        references={[
          {
            label: "PokeAPI",
            href: "https://pokeapi.co/",
            note: "Pokemon species, moves, abilities, items, and core game data."
          },
          {
            label: "Pokemon TCG API",
            href: "https://pokemontcg.io/",
            note: "Trading card catalog and card metadata."
          },
          {
            label: "Bulbagarden Archives",
            href: "https://archives.bulbagarden.net/",
            note: "Region map images and mechanics HUD captures used across encyclopedia modules."
          },
          {
            label: "Pokemon-3D community assets",
            href: "https://github.com/Pokemon-3D/api-assets",
            note: "GLB model references for 3D viewer."
          }
        ]}
      />

      <ReferencesBlock
        className="sources-mobile-section"
        title="Character Portrait Credits"
        references={characterPortraitReferences}
      />
    </section>
  );

  const rightPanel = (
    <section id="sources-links" className="sources-mobile-right space-y-4">
      <section className="sources-mobile-section rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Credits
        </p>
        <p className="mt-2 text-sm text-black/75">
          Wiki structure, UI, and integration work are assembled in this project with official
          public APIs and media attribution.
        </p>
      </section>

      <section className="sources-mobile-section rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Copyright Notice
        </p>
        <p className="mt-2 text-sm text-black/75">
          Pokemon and all related names, logos, characters, and images are trademarks and
          copyrights of Nintendo, GAME FREAK, Creatures, and The Pokemon Company.
        </p>
        <p className="mt-2 text-sm text-black/75">
          This project is a fan-made encyclopedic interface and does not claim ownership of those
          IP assets.
        </p>
      </section>

      <section className="sources-mobile-section rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Related
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href="/"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Back to Pokedex
          </Link>
          <Link
            href="/credits"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Credits alias page
          </Link>
        </div>
      </section>
    </section>
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Sources and Credits"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="sources-mobile-page pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <PokedexFrame
          title="Sources & Credits"
          status="success"
          leftPanel={leftPanel}
          rightPanel={rightPanel}
          className="sources-mobile-frame"
        />
        <MobileDexBottomNav
          activeKey="explore"
          exploreHref="/sources#sources-top"
          settingsHref="/sources#sources-links"
          className="sources-mobile-bottom-nav"
        />
      </main>
    </>
  );
}
