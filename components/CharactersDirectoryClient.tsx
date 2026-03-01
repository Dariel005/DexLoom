"use client";

import { useQuery } from "@tanstack/react-query";
import type { ChangeEvent, JSX } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MobileDexBottomNav } from "@/components/MobileDexBottomNav";
import { PokedexFrame } from "@/components/PokedexFrame";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDevicePerformanceTier } from "@/hooks/useDevicePerformanceTier";
import { useUiTone } from "@/hooks/useUiTone";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { charactersDirectoryQueryOptions } from "@/lib/encyclopedia-query-options";
import type { CharacterWikiEntry } from "@/lib/characters-encyclopedia";
import { cn } from "@/lib/utils";

function normalize(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildCharacterSearchIndex(entries: CharacterWikiEntry[]) {
  return entries.map((entry) => ({
    entry,
    haystack: normalize(
      [
        entry.name,
        entry.slug,
        entry.roleHint,
        entry.regionLabel,
        entry.battleStyle,
        ...entry.tags,
        ...entry.gameTags
      ].join(" ")
    )
  }));
}
const CharacterIndexSection = dynamic(
  () =>
    import("@/components/characters/CharacterIndexSection").then(
      (module) => module.CharacterIndexSection
    ),
  {
    ssr: false,
    loading: () => (
      <div className="character-scroll-list pokemon-scrollbar mt-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {Array.from({ length: 18 }).map((_, index) => (
            <div
              key={`character-index-skeleton-${index}`}
              className="h-[332px] w-full animate-pulse rounded-xl border border-black/15 bg-black/[0.08]"
            />
          ))}
        </div>
      </div>
    )
  }
);

export function CharactersDirectoryClient(): JSX.Element {
  const playUiTone = useUiTone();
  const heroRef = useRef<HTMLElement | null>(null);
  const indexRef = useRef<HTMLElement | null>(null);
  const favorites = useUserFavorites();
  const performanceTier = useDevicePerformanceTier();
  const directoryQuery = useQuery(charactersDirectoryQueryOptions());
  const characters = useMemo(() => directoryQuery.data ?? [], [directoryQuery.data]);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 220);
  const didMountSearchRef = useRef(false);

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearchInput(event.target.value);
    },
    []
  );

  const handleSearchClear = useCallback(() => {
    playUiTone("switch");
    setSearchInput("");
  }, [playUiTone]);

  const scrollToElement = useCallback((element: HTMLElement | null) => {
    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleMobileExplore = useCallback(() => {
    playUiTone("switch");
    scrollToElement(indexRef.current);
  }, [playUiTone, scrollToElement]);

  const handleMobileSettings = useCallback(() => {
    playUiTone("switch");
    scrollToElement(heroRef.current);
  }, [playUiTone, scrollToElement]);

  useEffect(() => {
    if (!didMountSearchRef.current) {
      didMountSearchRef.current = true;
      return;
    }

    if (debouncedSearch.trim().length > 0) {
      playUiTone("scroll");
    }
  }, [debouncedSearch, playUiTone]);

  const characterSearchIndex = useMemo(
    () => buildCharacterSearchIndex(characters),
    [characters]
  );

  const filteredCharacters = useMemo(() => {
    const query = normalize(debouncedSearch);
    if (!query) {
      return characters;
    }

    return characterSearchIndex.filter((candidate) =>
      candidate.haystack.includes(query)
    ).map((candidate) => candidate.entry);
  }, [characterSearchIndex, characters, debouncedSearch]);
  const characterBySlug = useMemo(
    () => new Map(characters.map((entry) => [entry.slug, entry] as const)),
    [characters]
  );
  const favoriteCharacterSlugSet = useMemo(() => {
    return new Set(
      favorites.items
        .filter((entry) => entry.entityType === "character")
        .map((entry) => entry.entityId)
    );
  }, [favorites.items]);
  const handleToggleCharacterFavorite = useCallback(
    (slug: string) => {
      if (!favorites.isAuthenticated) {
        return;
      }

      const character = characterBySlug.get(slug);
      if (!character) {
        return;
      }

      const isNowFavorite = favorites.toggleFavorite({
        entityType: "character",
        entityId: character.slug,
        title: character.name,
        href: `/characters/${character.slug}`,
        imageUrl: character.portraitFallbackSrc ?? character.portraitSrc,
        subtitle: character.roleHint,
        tags: ["character", ...character.tags.slice(0, 5)]
      });
      playUiTone(isNowFavorite ? "select" : "switch");
    },
    [characterBySlug, favorites, playUiTone]
  );

  const totalCharacters = characters.length;
  const { visibleCharacters, championCount, coveredRegions } = useMemo(() => {
    const regions = new Set<string>();
    let champions = 0;

    for (const entry of filteredCharacters) {
      regions.add(entry.regionLabel);
      if (entry.roleHint.toLowerCase().includes("champion")) {
        champions += 1;
      }
    }

    return {
      visibleCharacters: filteredCharacters.length,
      championCount: champions,
      coveredRegions: regions.size
    };
  }, [filteredCharacters]);
  const characterMetrics = [
    { label: "Total", value: totalCharacters },
    { label: "Visible", value: visibleCharacters },
    { label: "Champions", value: championCount },
    { label: "Regions", value: coveredRegions }
  ];
  const characterFxTier: "full" | "balanced" | "lite" =
    performanceTier === "low"
      ? visibleCharacters > 14
        ? "lite"
        : "balanced"
      : performanceTier === "medium"
        ? visibleCharacters > 120
          ? "lite"
          : visibleCharacters > 44
            ? "balanced"
            : "full"
        : visibleCharacters > 180
          ? "lite"
          : visibleCharacters > 72
            ? "balanced"
            : "full";

  const leftPanel = (
    <section
      className={cn(
        "characters-mobile-left space-y-4",
        characterFxTier === "balanced" && "character-fx-balanced",
        characterFxTier === "lite" && "character-fx-lite"
      )}
    >
      <section
        ref={heroRef}
        className={cn(
          "characters-mobile-hero relative overflow-hidden rounded-2xl border border-black/20 bg-[linear-gradient(155deg,rgba(246,252,247,0.92),rgba(218,234,223,0.86))] p-4 shadow-[0_10px_22px_rgba(26,40,30,0.1)]"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.5),transparent_54%)]" />
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(139,205,162,0.22),transparent_70%)]" />
        <div className="relative space-y-3.5">
          <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/62">
            Character Command Center
          </p>
          <h1 className="text-balance text-[20px] font-semibold tracking-[0.01em] text-black/85 sm:text-[24px]">
            Trainers, Rivals, Champions
          </h1>
          <p className="max-w-[70ch] text-sm text-black/72">
            Browse cinematic character cards with role, appearances, battle profile, and team
            highlights.
          </p>

          <label htmlFor="characters-search" className="search-deck-field search-deck-field-live w-full">
            <span className="search-deck-led" aria-hidden />
            <span className="search-deck-ball" aria-hidden />
            <input
              id="characters-search"
              value={searchInput}
              onChange={handleSearchChange}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-gramm="false"
              placeholder="Search character, role, region..."
              className="search-deck-input"
            />
            {searchInput.trim().length > 0 ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleSearchClear();
                }}
                className="search-deck-clear-btn"
                aria-label="Clear search"
              >
                x
              </button>
            ) : null}
            <span className="search-deck-gloss" aria-hidden />
          </label>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {characterMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-black/15 bg-[linear-gradient(160deg,rgba(255,255,255,0.9),rgba(234,242,236,0.78))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_10px_rgba(29,44,33,0.08)]"
              >
                <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-black/56">
                  {metric.label}
                </p>
                <p className="mt-0.5 text-[17px] font-semibold leading-none text-black/84">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        ref={indexRef}
        className="characters-mobile-index rounded-2xl border border-black/20 bg-white/60 p-3"
      >
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Character Index
        </p>
        <CharacterIndexSection
          filteredCharacters={filteredCharacters}
          favoriteCharacterSlugSet={favoriteCharacterSlugSet}
          canToggleFavorite={favorites.isAuthenticated}
          onToggleFavorite={handleToggleCharacterFavorite}
        />
      </section>
    </section>
  );

  return (
    <main className="characters-mobile-page pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
      <PokedexFrame
        title="Pokemon Characters Encyclopedia"
        status={directoryQuery.isError ? "error" : directoryQuery.isLoading ? "loading" : "success"}
        leftPanel={leftPanel}
        className="characters-mobile-frame"
      />
      <MobileDexBottomNav
        activeKey="explore"
        onExplore={handleMobileExplore}
        onSettings={handleMobileSettings}
        className="characters-mobile-bottom-nav"
      />
    </main>
  );
}

