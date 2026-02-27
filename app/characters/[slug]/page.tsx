import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteStarButton } from "@/components/FavoriteStarButton";
import { CharacterPageTemplate } from "@/components/templates/CharacterPageTemplate";
import { PokedexFrame } from "@/components/PokedexFrame";
import { ReferencesBlock } from "@/components/wiki/ReferencesBlock";
import {
  CHARACTER_WIKI_INDEX,
  getCharacterBySlug
} from "@/lib/characters-encyclopedia";
import { formatLabel } from "@/lib/utils";

interface CharacterDetailPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return CHARACTER_WIKI_INDEX.map((character) => ({ slug: character.slug }));
}

export function generateMetadata({ params }: CharacterDetailPageProps): Metadata {
  const character = getCharacterBySlug(params.slug);
  const title = character?.name ?? formatLabel(params.slug);

  return {
    title: `${title} - Character Entry`,
    description: "Character entry with role, game appearances, and team-by-game structure."
  };
}

export default function CharacterDetailPage({ params }: CharacterDetailPageProps) {
  const character = getCharacterBySlug(params.slug);
  if (!character) {
    notFound();
  }

  const portraitReference = {
    label: character.portraitCreditLabel,
    href: character.portraitCreditHref,
    note: character.portraitCreditNote
  };

  const combinedReferences = [portraitReference, ...character.references];

  const leftPanel = (
    <CharacterPageTemplate
      data={{
        name: character.name,
        role: character.roleHint,
        regionLabel: character.regionLabel,
        portraitSrc: character.portraitSrc,
        portraitAlt: character.portraitAlt,
        overview: character.overview,
        battleStyle: character.battleStyle,
        signaturePokemon: character.signaturePokemon,
        quote: character.quote,
        games: character.appearances,
        teamsByGame: character.teamsByGame,
        tags: character.tags,
        references: combinedReferences
      }}
    />
  );

  const rightPanel = (
    <section className="space-y-4">
      <section className="rounded-2xl border border-black/20 bg-gradient-to-br from-white/70 via-white/60 to-black/[0.03] p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Character Navigation
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <FavoriteStarButton
            favorite={{
              entityType: "character",
              entityId: character.slug,
              title: character.name,
              href: `/characters/${character.slug}`,
              imageUrl: character.portraitSrc,
              subtitle: character.roleHint,
              tags: ["character", ...character.tags.slice(0, 5)]
            }}
            showLabel
          />
          <Link
            href="/"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Back to Pokedex
          </Link>
          <Link
            href="/characters"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Back to characters
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-gradient-to-br from-white/70 via-white/60 to-black/[0.03] p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Character Intel Matrix
        </p>
        <div className="mt-2 grid gap-2 text-sm text-black/75 sm:grid-cols-2">
          <p className="rounded-lg border border-black/20 bg-white/75 px-3 py-2">
            Region: <span className="font-medium text-black/80">{character.regionLabel}</span>
          </p>
          <p className="rounded-lg border border-black/20 bg-white/75 px-3 py-2">
            Appearances: <span className="font-medium text-black/80">{character.appearances.length}</span>
          </p>
          <p className="rounded-lg border border-black/20 bg-white/75 px-3 py-2">
            Team snapshots: <span className="font-medium text-black/80">{character.teamsByGame.length}</span>
          </p>
          <p className="rounded-lg border border-black/20 bg-white/75 px-3 py-2">
            Portrait source:{" "}
            <span className="font-medium text-black/80">
              {character.portraitType === "local" ? "Local cached asset" : "Remote official asset"}
            </span>
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-gradient-to-br from-white/70 via-white/60 to-black/[0.03] p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Signature Core
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {character.signaturePokemon.map((pokemon) => (
            <span
              key={pokemon}
              className="rounded-md border border-black/20 bg-white/80 px-2 py-1 text-xs font-medium text-black/75"
            >
              {pokemon}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-gradient-to-br from-white/70 via-white/60 to-black/[0.03] p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Tactical Summary
        </p>
        <p className="mt-2 text-sm text-black/75">{character.battleStyle}</p>
      </section>

      <ReferencesBlock references={combinedReferences} />
    </section>
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${character.name} Character Entry`,
    image: character.portraitSrc,
    about: ["pokemon character", character.name, character.regionLabel]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <PokedexFrame
          title={`${character.name} - Character Encyclopedia`}
          status="success"
          leftPanel={leftPanel}
          rightPanel={rightPanel}
        />
      </main>
    </>
  );
}
