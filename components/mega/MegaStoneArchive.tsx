"use client";

import { m } from "framer-motion";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { TypeBadge } from "@/components/TypeBadge";
import { ViewportRender } from "@/components/ViewportRender";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { emitFavoriteAuthNotice } from "@/lib/favorite-auth-notice";
import { MEGA_EVOLUTION_INDEX } from "@/lib/mega-evolutions-encyclopedia";
import { MEGA_STONE_ARCHIVE } from "@/lib/mega-stones-encyclopedia";
import { cn } from "@/lib/utils";

interface MegaStoneArchiveProps {
  highlightedStone?: string | null;
  selectedStone?: string | null;
  favoriteStoneNames?: string[];
  canToggleFavorite?: boolean;
  onSelectStone?: (itemName: string) => void;
  onToggleFavorite?: (itemName: string) => void;
}

const MEGA_BY_SLUG = new Map(MEGA_EVOLUTION_INDEX.map((entry) => [entry.slug, entry]));

const MEGA_STONE_CARD_INDEX = MEGA_STONE_ARCHIVE.map((entry, index) => {
  const primaryMega = entry.linkedMegaSlugs
    .map((slug) => MEGA_BY_SLUG.get(slug))
    .find((candidate) => Boolean(candidate));

  return {
    entry,
    baseDexNumber: primaryMega?.baseDexNumber ?? index + 1,
    generationLabel: primaryMega
      ? `${primaryMega.debutGeneration} (${primaryMega.region})`
      : "Mega trigger item",
    cardTypes: primaryMega?.types.slice(0, 2) ?? []
  };
});

export function MegaStoneArchive({
  highlightedStone = null,
  selectedStone = null,
  favoriteStoneNames = [],
  canToggleFavorite = true,
  onSelectStone,
  onToggleFavorite
}: MegaStoneArchiveProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 190);
  const favoriteStoneSet = useMemo(() => new Set(favoriteStoneNames), [favoriteStoneNames]);

  const filteredEntries = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase();
    if (!normalized) {
      return MEGA_STONE_CARD_INDEX;
    }
    return MEGA_STONE_CARD_INDEX.filter((candidate) =>
      candidate.entry.searchTokens.includes(normalized)
    );
  }, [debouncedQuery]);

  const useViewportCulling = filteredEntries.length > 42;
  const enableCardEntranceMotion = filteredEntries.length <= 36 && !useViewportCulling;

  const renderStoneCard = useCallback(
    (candidate: (typeof MEGA_STONE_CARD_INDEX)[number], index: number, enableMotion: boolean) => {
      const isFavorite = favoriteStoneSet.has(candidate.entry.itemName);
      const isSelected =
        selectedStone === candidate.entry.itemName || highlightedStone === candidate.entry.itemName;

      return (
        <m.article
          initial={enableMotion ? { opacity: 0, y: 16 } : false}
          animate={enableMotion ? { opacity: 1, y: 0 } : undefined}
          transition={
            enableMotion ? { duration: 0.28, ease: "easeOut", delay: Math.min(index, 16) * 0.02 } : undefined
          }
          role={onSelectStone ? "button" : undefined}
          tabIndex={onSelectStone ? 0 : undefined}
          onClick={
            onSelectStone
              ? () => {
                  onSelectStone(candidate.entry.itemName);
                }
              : undefined
          }
          onKeyDown={
            onSelectStone
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectStone(candidate.entry.itemName);
                  }
                }
              : undefined
          }
          className={cn(
            "pokemon-card-shell flex h-full min-h-[252px] flex-col overflow-hidden rounded-2xl border p-3 transition sm:p-3.5",
            onSelectStone && "cursor-pointer",
            isSelected ? "pokemon-card-selected" : "pokemon-card-idle"
          )}
        >
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="pokemon-card-index pixel-font text-[9px] uppercase tracking-[0.14em] text-black/55">
                  #{candidate.baseDexNumber.toString().padStart(4, "0")}
                </p>
                <h3 className="pokemon-card-name pixel-font mt-1 truncate text-[11px] uppercase tracking-wide">
                  {candidate.entry.itemName}
                </h3>
                <p className="pokemon-card-generation mt-1 text-[11px] text-black/55">
                  {candidate.generationLabel}
                </p>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (!canToggleFavorite) {
                    emitFavoriteAuthNotice("Sign in to add this Mega Stone to favorites.");
                    return;
                  }
                  onToggleFavorite?.(candidate.entry.itemName);
                }}
                aria-disabled={!canToggleFavorite}
                data-active={isFavorite}
                aria-pressed={isFavorite}
                aria-label={
                  canToggleFavorite
                    ? isFavorite
                      ? `remove ${candidate.entry.itemName} favorite`
                      : `add ${candidate.entry.itemName} favorite`
                    : `sign in to add ${candidate.entry.itemName} to favorites`
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
              <div className="pokemon-card-sprite relative h-[114px] w-[114px] flex-shrink-0 sm:h-[130px] sm:w-[130px]">
                <Image
                  src={candidate.entry.imageSrc}
                  alt={candidate.entry.imageAlt}
                  width={80}
                  height={80}
                  loading="lazy"
                  sizes="80px"
                  unoptimized
                  className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.25)] [image-rendering:-webkit-optimize-contrast]"
                />
              </div>

              <div className="pokemon-card-type-stack flex min-w-0 flex-col items-end gap-1.5">
                {candidate.cardTypes.length > 0 ? (
                  candidate.cardTypes.map((type) => (
                    <TypeBadge
                      key={`${candidate.entry.itemName}-${type}`}
                      type={type}
                      className="pokemon-card-type-badge h-6 min-w-[82px] justify-center px-2 text-[8px]"
                    />
                  ))
                ) : (
                  <span className="rounded-lg border border-black/20 bg-white/68 px-2.5 py-1 text-[10px] uppercase tracking-wide text-black/65">
                    {candidate.entry.isStone ? "Stone" : "Protocol"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="rounded-lg border border-black/20 bg-black/5 px-2 py-1 text-[11px]">
              Targets {candidate.entry.linkedSpecies.length}
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSelectStone?.(candidate.entry.itemName);
              }}
              className={cn(
                "pokemon-card-footer-btn pixel-font rounded-lg border px-2.5 py-1.5 text-[9px] uppercase tracking-wide text-white transition hover:brightness-110",
                isSelected ? "pokedex-accent-button pokedex-accent-glow" : "border-black/25 bg-pokedex-red"
              )}
            >
              Entry
            </button>
          </div>
        </m.article>
      );
    },
    [canToggleFavorite, favoriteStoneSet, highlightedStone, onSelectStone, onToggleFavorite, selectedStone]
  );

  return (
    <section className="rounded-2xl border border-black/25 bg-black/[0.06] p-3">
      <p className="pixel-font text-[10px] uppercase tracking-[0.18em] text-black/65">
        Mega Stone Archive
      </p>
      <h2 className="pixel-font mt-2 text-[13px] uppercase tracking-[0.12em] text-black/85">
        All Stones and Acquisition Routes
      </h2>

      <div className="mt-3">
        <label
          htmlFor="mega-stone-search"
          className="search-deck-field search-deck-field-live search-deck-legendary w-full"
        >
          <span className="search-deck-led" aria-hidden />
          <span className="search-deck-ball" aria-hidden />
          <input
            id="mega-stone-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            data-gramm="false"
            placeholder="Search stone, species, or route..."
            className="search-deck-input"
          />
          {query.trim().length > 0 ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setQuery("");
              }}
              className="search-deck-clear-btn"
              aria-label="Clear stone search"
            >
              x
            </button>
          ) : null}
          <span className="search-deck-gloss" aria-hidden />
        </label>
      </div>

      <p className="mt-2 text-sm text-black/76">
        Full reference of Mega Evolution trigger items, what each one does, and where players
        usually obtain them in Gen VI routes.
      </p>

      {filteredEntries.length > 0 ? (
        <div className="mt-3 grid gap-3 sm:gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,236px),1fr))]">
          {filteredEntries.map((candidate, index) => {
            const card = renderStoneCard(candidate, index, enableCardEntranceMotion);
            return useViewportCulling ? (
              <ViewportRender
                key={`mega-stone-${candidate.entry.itemName}`}
                enabled
                rootMargin="420px 0px"
                minHeight={252}
                className="h-full"
                placeholderClassName="rounded-2xl border border-black/10 bg-black/5"
              >
                {card}
              </ViewportRender>
            ) : (
              <div key={`mega-stone-${candidate.entry.itemName}`}>{card}</div>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 flex h-28 items-center justify-center rounded-xl border border-dashed border-black/35 bg-white/45">
          <p className="pixel-font text-center text-[11px] uppercase tracking-[0.14em] text-black/62">
            No stone entries match your query
          </p>
        </div>
      )}
    </section>
  );
}
