"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { ViewportRender } from "@/components/ViewportRender";
import type { CharacterWikiEntry } from "@/lib/characters-encyclopedia";
import { emitFavoriteAuthNotice } from "@/lib/favorite-auth-notice";
import { cn } from "@/lib/utils";

interface CharacterIndexSectionProps {
  filteredCharacters: CharacterWikiEntry[];
  favoriteCharacterSlugSet: Set<string>;
  canToggleFavorite: boolean;
  onToggleFavorite: (slug: string) => void;
}

const CHARACTER_CATALOG_MIN_HEIGHT = 332;

function formatCharacterChip(value: string): string {
  return value
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter((entry) => entry.length > 0)
    .map((entry) => entry.charAt(0).toUpperCase() + entry.slice(1))
    .join(" ");
}

function CharacterPortraitImage({ character }: { character: CharacterWikiEntry }) {
  const portraitCandidates = useMemo(() => {
    const unique = new Set<string>();
    const fallbackSvg = `/images/characters/${character.slug}.svg`;

    [character.portraitSrc, character.portraitFallbackSrc, fallbackSvg].forEach((value) => {
      if (typeof value !== "string" || value.trim().length === 0) {
        return;
      }
      unique.add(value);
    });

    return [...unique];
  }, [character.slug, character.portraitSrc, character.portraitFallbackSrc]);
  const [portraitIndex, setPortraitIndex] = useState(0);

  useEffect(() => {
    setPortraitIndex(0);
  }, [character.slug, character.portraitSrc, character.portraitFallbackSrc]);

  const safeIndex = Math.min(portraitIndex, portraitCandidates.length - 1);
  const currentPortraitSrc =
    portraitCandidates[safeIndex] ?? character.portraitSrc;

  return (
    <Image
      src={currentPortraitSrc}
      alt={character.portraitAlt}
      fill
      sizes="(min-width: 640px) 156px, 138px"
      className="object-contain object-bottom drop-shadow-[0_8px_10px_rgba(0,0,0,0.25)]"
      unoptimized
      onError={() => {
        setPortraitIndex((currentIndex) =>
          currentIndex < portraitCandidates.length - 1 ? currentIndex + 1 : currentIndex
        );
      }}
    />
  );
}

export function CharacterIndexSection({
  filteredCharacters,
  favoriteCharacterSlugSet,
  canToggleFavorite,
  onToggleFavorite
}: CharacterIndexSectionProps) {
  const shouldCullCharacterCards = filteredCharacters.length > 14;
  const renderCharacterIndexCard = useCallback(
    (character: CharacterWikiEntry, index: number) => {
      const isFavorite = favoriteCharacterSlugSet.has(character.slug);
      const roleTag = character.tags.find((tag) => tag !== "character") ?? character.tags[0] ?? "trainer";
      const roleChip = formatCharacterChip(roleTag);
      const gameCount = character.gameTags.length;
      const gameLabel = gameCount === 1 ? "1 juego" : `${gameCount} juegos`;

      return (
        <article
          data-selected="false"
          className="pokemon-card-shell character-index-card flex h-full min-h-[300px] flex-col overflow-hidden rounded-2xl border p-3 transition sm:p-3.5 pokemon-card-idle"
        >
          <div className="w-full flex-1 text-left">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="pokemon-card-index pixel-font text-[9px] uppercase tracking-[0.14em] text-black/55">
                  {`#c${(index + 1).toString().padStart(4, "0")}`}
                </p>
                <h3 className="pokemon-card-name pixel-font mt-1 truncate text-[11px] uppercase tracking-wide">
                  {character.name}
                </h3>
                <p className="pokemon-card-generation mt-1 line-clamp-1 text-[11px] text-black/55">
                  {character.roleHint}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!canToggleFavorite) {
                    emitFavoriteAuthNotice("Sign in to add this character to favorites.");
                    return;
                  }
                  onToggleFavorite(character.slug);
                }}
                aria-disabled={!canToggleFavorite}
                data-active={isFavorite}
                aria-pressed={isFavorite}
                aria-label={
                  canToggleFavorite
                    ? isFavorite
                      ? `remove ${character.name} favorite`
                      : `add ${character.name} favorite`
                    : `sign in to add ${character.name} to favorites`
                }
                title={canToggleFavorite ? undefined : "Sign in to use favorites"}
                className={cn(
                  "favorite-star-btn inline-flex h-9 w-9 items-center justify-center text-[16px] leading-none transition-all duration-200 active:scale-[0.96]",
                  !canToggleFavorite && "cursor-not-allowed opacity-55"
                )}
              >
                <span className={cn("favorite-star-icon transition-transform", isFavorite && "scale-110")}>
                  {isFavorite ? "\u2605" : "\u2606"}
                </span>
              </button>
            </div>

            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 sm:gap-3">
              <div className="pokemon-card-sprite relative h-[138px] w-[138px] flex-shrink-0 sm:h-[156px] sm:w-[156px]">
                <CharacterPortraitImage character={character} />
              </div>

              <div className="flex min-w-0 flex-col items-end gap-1.5">
                <span className="character-card-type-badge character-card-type-badge-region pixel-font inline-flex h-6 min-w-[82px] items-center justify-center px-2 text-[8px] uppercase tracking-wide">
                  {character.regionLabel}
                </span>
                <span className="character-card-type-badge character-card-type-badge-role pixel-font inline-flex h-6 min-w-[82px] items-center justify-center px-2 text-[8px] uppercase tracking-wide">
                  {roleChip}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="rounded-lg border border-black/20 bg-black/5 px-2 py-1 text-[11px]">
              {gameLabel}
            </span>
            <RouteTransitionLink
              href={`/characters/${character.slug}`}
              prefetch={false}
              className="pokemon-card-footer-btn pixel-font rounded-lg border border-black/25 bg-pokedex-red px-2.5 py-1.5 text-[9px] uppercase tracking-wide text-white transition hover:brightness-110"
            >
              Entry
            </RouteTransitionLink>
          </div>
        </article>
      );
    },
    [canToggleFavorite, favoriteCharacterSlugSet, onToggleFavorite]
  );

  if (filteredCharacters.length === 0) {
    return (
      <div className="character-scroll-list pokemon-scrollbar mt-3">
        <p className="rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-4 text-sm text-black/65">
          No characters found with this search.
        </p>
      </div>
    );
  }

  return (
    <div className="character-scroll-list pokemon-scrollbar mt-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {filteredCharacters.map((character, index) => {
          const characterCard = renderCharacterIndexCard(character, index);

          if (!shouldCullCharacterCards) {
            return <div key={character.slug} className="w-full">{characterCard}</div>;
          }

          return (
            <ViewportRender
              key={character.slug}
              enabled
              rootMargin="340px 0px"
              minHeight={CHARACTER_CATALOG_MIN_HEIGHT}
              placeholderClassName="rounded-xl border border-black/10 bg-black/5"
              className="w-full"
            >
              {characterCard}
            </ViewportRender>
          );
        })}
      </div>
    </div>
  );
}

