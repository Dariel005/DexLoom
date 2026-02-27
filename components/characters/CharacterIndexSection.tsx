"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
const CHARACTER_IMAGE_RETRY_LIMIT = 2;
const CHARACTER_GENERIC_PORTRAIT_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Crect width='256' height='256' fill='%23f3f5f3'/%3E%3Ccircle cx='128' cy='94' r='34' fill='%23c7cec9'/%3E%3Cpath d='M64 212c8-36 33-56 64-56s56 20 64 56' fill='%23c7cec9'/%3E%3C/svg%3E";

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

    [character.portraitSrc, character.portraitFallbackSrc, fallbackSvg, CHARACTER_GENERIC_PORTRAIT_PLACEHOLDER].forEach((value) => {
      if (typeof value !== "string" || value.trim().length === 0) {
        return;
      }
      unique.add(value);
    });

    return [...unique];
  }, [character.slug, character.portraitSrc, character.portraitFallbackSrc]);
  const [portraitIndex, setPortraitIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setPortraitIndex(0);
    setRetryCount(0);
  }, [character.slug, character.portraitSrc, character.portraitFallbackSrc]);

  const safeIndex = Math.min(Math.max(portraitIndex, 0), portraitCandidates.length - 1);
  const basePortraitSrc =
    portraitCandidates[safeIndex] ?? CHARACTER_GENERIC_PORTRAIT_PLACEHOLDER;
  const isDataUri = basePortraitSrc.startsWith("data:");
  const currentPortraitSrc = isDataUri
    ? basePortraitSrc
    : `${basePortraitSrc}${basePortraitSrc.includes("?") ? "&" : "?"}retry=${retryCount}`;

  return (
    <img
      src={currentPortraitSrc}
      alt={character.portraitAlt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className="absolute inset-0 h-full w-full object-contain object-bottom drop-shadow-[0_8px_10px_rgba(0,0,0,0.25)]"
      onError={() => {
        if (!isDataUri && retryCount < CHARACTER_IMAGE_RETRY_LIMIT) {
          setRetryCount((value) => value + 1);
          return;
        }

        setRetryCount(0);
        setPortraitIndex((currentIndex) => {
          const lastIndex = portraitCandidates.length - 1;
          return currentIndex < lastIndex ? currentIndex + 1 : currentIndex;
        });
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

