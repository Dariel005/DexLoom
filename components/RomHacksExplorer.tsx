"use client";

import Image from "next/image";
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MobileDexBottomNav } from "@/components/MobileDexBottomNav";
import { PokedexFrame } from "@/components/PokedexFrame";
import { SectionModuleNav } from "@/components/SectionModuleNav";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ROM_HACKS_CATALOG, type RomHackEntry } from "@/lib/rom-hacks-encyclopedia";

function InfoChip({
  label,
  tone = "neutral"
}: {
  label: string;
  tone?: "neutral" | "green" | "amber" | "sky";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-300/90 bg-emerald-100/70 text-emerald-900"
      : tone === "amber"
        ? "border-amber-300/90 bg-amber-100/70 text-amber-900"
        : tone === "sky"
          ? "border-sky-300/90 bg-sky-100/70 text-sky-900"
          : "border-black/20 bg-white/72 text-black/74";

  return <span className={`rounded-md border px-2 py-1 text-xs ${toneClass}`}>{label}</span>;
}

const ROM_HACKS_PAGE_SIZE = 14;
const ACTIVE_PAGE_BUTTON_STYLE: CSSProperties = {
  borderColor: "#1f7f57",
  background:
    "linear-gradient(180deg,#e6fff2,#79d6a7),repeating-linear-gradient(135deg,rgba(255,255,255,0.18) 0 2px,rgba(255,255,255,0) 2px 5px)",
  color: "#0f3b2a",
  textShadow: "0 1px 0 rgba(255,255,255,0.72)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.92),inset 0 -1px 0 rgba(6,59,38,0.24),0 2px 0 rgba(0,0,0,0.24),0 0 0 1px rgba(18,111,76,0.6),0 0 0 3px rgba(123,233,180,0.52),0 12px 18px -12px rgba(7,54,36,0.78)",
  transform: "translateY(-1px) scale(1.08)",
  fontWeight: 700
};

type SearchableRomHackEntry = {
  entry: RomHackEntry;
  title: string;
  platform: string;
  summary: string;
  versionLabel: string;
  status: string;
  tags: string[];
  source: string;
  words: string[];
};

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function tokenizeSearchQuery(value: string) {
  return normalizeSearchText(value)
    .split(/\s+/)
    .filter(Boolean);
}

function isGifImageUrl(value: string) {
  const normalized = value.toLowerCase().split("#")[0]?.split("?")[0] ?? "";
  return normalized.endsWith(".gif");
}

function isWithinEditDistance(source: string, target: string, maxDistance: number) {
  if (source === target) {
    return true;
  }

  const sourceLength = source.length;
  const targetLength = target.length;
  if (Math.abs(sourceLength - targetLength) > maxDistance) {
    return false;
  }

  const previous = new Array<number>(targetLength + 1);
  const current = new Array<number>(targetLength + 1);

  for (let column = 0; column <= targetLength; column += 1) {
    previous[column] = column;
  }

  for (let row = 1; row <= sourceLength; row += 1) {
    current[0] = row;
    let rowMinimum = current[0];

    for (let column = 1; column <= targetLength; column += 1) {
      const substitutionCost = source[row - 1] === target[column - 1] ? 0 : 1;
      const insertion = current[column - 1] + 1;
      const deletion = previous[column] + 1;
      const substitution = previous[column - 1] + substitutionCost;
      const value = Math.min(insertion, deletion, substitution);

      current[column] = value;
      if (value < rowMinimum) {
        rowMinimum = value;
      }
    }

    if (rowMinimum > maxDistance) {
      return false;
    }

    for (let column = 0; column <= targetLength; column += 1) {
      previous[column] = current[column];
    }
  }

  return previous[targetLength] <= maxDistance;
}

function hasFuzzyWordMatch(token: string, words: readonly string[]) {
  if (token.length < 4) {
    return false;
  }

  const maxDistance = token.length >= 8 ? 2 : 1;
  return words.some((word) => {
    if (Math.abs(word.length - token.length) > maxDistance) {
      return false;
    }
    return isWithinEditDistance(token, word, maxDistance);
  });
}

function toSearchableEntry(entry: RomHackEntry): SearchableRomHackEntry {
  const title = normalizeSearchText(entry.title);
  const platform = normalizeSearchText(entry.platform);
  const summary = normalizeSearchText(entry.summary);
  const versionLabel = normalizeSearchText(entry.versionLabel);
  const status = normalizeSearchText(entry.status);
  const tags = entry.tags.map((tag) => normalizeSearchText(tag));
  const source = normalizeSearchText(
    [entry.id, entry.title, entry.platform, entry.versionLabel, entry.status, entry.summary, ...entry.tags].join(" ")
  );
  const words = Array.from(new Set(source.split(/[^a-z0-9]+/g).filter((token) => token.length >= 3)));

  return {
    entry,
    title,
    platform,
    summary,
    versionLabel,
    status,
    tags,
    source,
    words
  };
}

function rankRomHackEntry(searchable: SearchableRomHackEntry, query: string, tokens: readonly string[]) {
  let score = 0;

  if (searchable.title === query) {
    score += 140;
  } else if (searchable.title.startsWith(query)) {
    score += 96;
  } else if (searchable.source.includes(query)) {
    score += 36;
  }

  for (const token of tokens) {
    let tokenScore = 0;

    if (searchable.title.includes(token)) {
      tokenScore = Math.max(tokenScore, 38);
    }
    if (searchable.tags.some((tag) => tag.includes(token))) {
      tokenScore = Math.max(tokenScore, 32);
    }
    if (searchable.platform.includes(token)) {
      tokenScore = Math.max(tokenScore, 22);
    }
    if (searchable.versionLabel.includes(token)) {
      tokenScore = Math.max(tokenScore, 20);
    }
    if (searchable.status.includes(token)) {
      tokenScore = Math.max(tokenScore, 16);
    }
    if (searchable.summary.includes(token)) {
      tokenScore = Math.max(tokenScore, 12);
    }
    if (!tokenScore && hasFuzzyWordMatch(token, searchable.words)) {
      tokenScore = 8;
    }

    if (!tokenScore) {
      return 0;
    }

    score += tokenScore;
  }

  if (tokens.length > 1) {
    score += 6;
  }

  return score;
}

export function RomHacksExplorer() {
  const controlsRef = useRef<HTMLElement | null>(null);
  const indexRef = useRef<HTMLElement | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 160);
  const playableCount = ROM_HACKS_CATALOG.filter((entry) => entry.status === "Playable").length;
  const inDevelopmentCount = ROM_HACKS_CATALOG.length - playableCount;
  const latestVerification = ROM_HACKS_CATALOG[0]?.verifiedOn ?? "Unknown";
  const searchableCatalog = useMemo(() => ROM_HACKS_CATALOG.map((entry) => toSearchableEntry(entry)), []);
  const normalizedSearch = useMemo(() => normalizeSearchText(debouncedSearch), [debouncedSearch]);
  const filteredEntries = useMemo(() => {
    if (!normalizedSearch) {
      return ROM_HACKS_CATALOG;
    }

    const tokens = tokenizeSearchQuery(normalizedSearch);
    if (tokens.length === 0) {
      return ROM_HACKS_CATALOG;
    }

    return searchableCatalog
      .map((searchable) => ({
        entry: searchable.entry,
        score: rankRomHackEntry(searchable, normalizedSearch, tokens)
      }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title, "en", { sensitivity: "base" }))
      .map((result) => result.entry);
  }, [normalizedSearch, searchableCatalog]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / ROM_HACKS_PAGE_SIZE));
  const [activePage, setActivePage] = useState<number>(1);
  const currentPage = Math.min(Math.max(activePage, 1), totalPages);
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  const paginationItems = useMemo(() => {
    if (totalPages <= 9) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const items: Array<number | "start-ellipsis" | "end-ellipsis"> = [1];

    const addRange = (from: number, to: number) => {
      for (let page = from; page <= to; page += 1) {
        items.push(page);
      }
    };

    if (currentPage <= 4) {
      addRange(2, 5);
      items.push("end-ellipsis");
    } else if (currentPage >= totalPages - 3) {
      items.push("start-ellipsis");
      addRange(totalPages - 4, totalPages - 1);
    } else {
      items.push("start-ellipsis");
      addRange(currentPage - 1, currentPage + 1);
      items.push("end-ellipsis");
    }

    items.push(totalPages);
    return items;
  }, [currentPage, totalPages]);
  const visibleEntries = useMemo(
    () => filteredEntries.slice((currentPage - 1) * ROM_HACKS_PAGE_SIZE, currentPage * ROM_HACKS_PAGE_SIZE),
    [currentPage, filteredEntries]
  );
  const isSearchActive = normalizedSearch.length > 0;

  useEffect(() => {
    setActivePage(1);
  }, [normalizedSearch]);

  const scrollToElement = useCallback((element: HTMLElement | null) => {
    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleMobileExplore = useCallback(() => {
    scrollToElement(indexRef.current);
  }, [scrollToElement]);

  const handleMobileSettings = useCallback(() => {
    scrollToElement(controlsRef.current);
  }, [scrollToElement]);

  const leftPanel = (
    <section className="rom-hacks-mobile-left space-y-4">
      <section
        ref={controlsRef}
        className="rom-hacks-mobile-hero rounded-2xl border border-black/20 bg-[radial-gradient(circle_at_10%_6%,rgba(255,255,255,0.58),transparent_38%),linear-gradient(158deg,rgba(255,255,255,0.82),rgba(222,238,227,0.74))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_10px_20px_rgba(0,0,0,0.08)]"
      >
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/68">Community Projects</p>
        <h1 className="pixel-font mt-2 text-[14px] uppercase tracking-[0.12em] text-black/86">
          Pokemon ROM Hacks
        </h1>
        <p className="mt-2 text-sm text-black/76">
          Curated ROM hack list with official project hubs, visual references, and safe outbound links.
          This module does not host ROM files.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <InfoChip label={`Total projects: ${ROM_HACKS_CATALOG.length}`} />
          <InfoChip label={`Visible: ${filteredEntries.length}`} tone={isSearchActive ? "sky" : "neutral"} />
          <InfoChip label={`Pages: ${totalPages}`} />
          <InfoChip label={`Per page: ${ROM_HACKS_PAGE_SIZE}`} />
          <InfoChip label={`Playable: ${playableCount}`} tone="green" />
          <InfoChip label={`Active development: ${inDevelopmentCount}`} tone="amber" />
          <InfoChip label={`Verified: ${latestVerification}`} tone="sky" />
        </div>
      </section>

      <section className="rounded-2xl border border-amber-500/40 bg-amber-100/55 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-amber-900/85">Legal Notice</p>
        <p className="mt-2 text-sm text-amber-950/82">
          External links point to official project pages and repositories only. Use legally obtained base
          games when a patcher workflow is required.
        </p>
      </section>

      <section
        ref={indexRef}
        className="rom-hacks-mobile-index rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.8),rgba(223,236,229,0.72))] p-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">ROM Hack Index</p>
            <p className="mt-1 text-sm text-black/75">
              Click any official button to open the project source in a new tab.
            </p>
          </div>
          <span className="rounded-md border border-black/20 bg-white/72 px-2 py-1 text-xs text-black/72">
            {isSearchActive ? `${filteredEntries.length} matches` : `${ROM_HACKS_CATALOG.length} entries`}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="rom-hacks-search" className="search-deck-field search-deck-field-live w-full sm:flex-1">
            <span className="search-deck-led" aria-hidden />
            <span className="search-deck-ball" aria-hidden />
            <input
              id="rom-hacks-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-gramm="false"
              placeholder="Smart search: name, platform, status, version, tag..."
              className="search-deck-input"
            />
            {searchInput.trim().length > 0 ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setSearchInput("");
                }}
                className="search-deck-clear-btn"
                aria-label="Clear ROM hack search"
              >
                x
              </button>
            ) : null}
            <span className="search-deck-gloss" aria-hidden />
          </label>

          <span className="rounded-md border border-black/20 bg-white/72 px-2 py-1 text-xs text-black/72">
            {isSearchActive ? "Smart ranking enabled" : "Type to search"}
          </span>
        </div>

        <div className="mt-3 rounded-xl border border-black/20 bg-white/70 p-2">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (!canGoPrev) {
                  return;
                }
                setActivePage(currentPage - 1);
              }}
              disabled={!canGoPrev}
              className="gbc-nav-link pixel-font rounded-md border border-black/25 bg-white/80 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-black/75 transition hover:bg-white/95 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Prev
            </button>

            {paginationItems.map((item, index) =>
              typeof item === "number" ? (
                <button
                  key={`rom-hacks-page-${item}`}
                  type="button"
                  onClick={() => setActivePage(item)}
                  className={`gbc-nav-link pixel-font rounded-md border border-black/25 bg-white/80 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-black/74 transition hover:bg-white/95 ${
                    item === currentPage ? "ring-2 ring-emerald-200/80" : ""
                  }`}
                  style={item === currentPage ? ACTIVE_PAGE_BUTTON_STYLE : undefined}
                  aria-label={`Open ROM hacks page ${item}`}
                  aria-current={item === currentPage ? "page" : undefined}
                >
                  {item}
                </button>
              ) : (
                <span
                  key={`rom-hacks-page-${item}-${index}`}
                  aria-hidden="true"
                  className="pixel-font px-1 text-[10px] uppercase tracking-[0.12em] text-black/50"
                >
                  ...
                </span>
              )
            )}

            <button
              type="button"
              onClick={() => {
                if (!canGoNext) {
                  return;
                }
                setActivePage(currentPage + 1);
              }}
              disabled={!canGoNext}
              className="gbc-nav-link pixel-font rounded-md border border-black/25 bg-white/80 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-black/75 transition hover:bg-white/95 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Next
            </button>
          </div>

          <div className="mt-2 flex justify-center">
            <span
              aria-live="polite"
              className="rounded-md border border-black/20 bg-white/78 px-2 py-1 text-xs text-black/70"
            >
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-black/25 bg-black/[0.06] p-3">
          <div className="grid gap-3.5 sm:gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr))]">
            {visibleEntries.length === 0 ? (
              <p className="col-span-full rounded-xl border border-dashed border-black/24 bg-white/75 px-3 py-4 text-sm text-black/66">
                No ROM hacks matched this search. Try terms like &quot;gba&quot;, &quot;complete&quot;,
                &quot;pokeharbor&quot;, or part of a title.
              </p>
            ) : (
              visibleEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="w-full max-w-[390px] justify-self-center rounded-2xl border border-black/20 bg-[linear-gradient(165deg,rgba(248,250,248,0.96),rgba(234,240,233,0.92))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_16px_-12px_rgba(0,0,0,0.42)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-black/20 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.94),rgba(230,236,230,0.9))]">
                    <Image
                      src={entry.imageSrc}
                      alt={entry.imageAlt}
                      fill
                      unoptimized={isGifImageUrl(entry.imageSrc)}
                      sizes="(max-width: 1024px) 90vw, 360px"
                      className="object-contain p-1.5"
                    />
                  </div>

                  <div className="mt-2 space-y-2">
                    <p className="pixel-font text-[9px] uppercase tracking-[0.14em] text-black/56">
                      {entry.platform}
                    </p>
                    <h2 className="pixel-font text-[12px] uppercase tracking-wide text-black/85">{entry.title}</h2>
                    <p className="text-sm text-black/74">{entry.summary}</p>

                    <div className="flex flex-wrap gap-1.5">
                      <InfoChip label={entry.status} tone={entry.status === "Playable" ? "green" : "amber"} />
                      <InfoChip label={entry.versionLabel} tone="sky" />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {entry.tags.map((tag) => (
                        <span
                          key={`${entry.id}-tag-${tag}`}
                          className="rounded-md border border-black/20 bg-white/70 px-2 py-0.5 text-[11px] text-black/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <p className="text-xs text-black/62">
                        {entry.officialLabel} | Verified {entry.verifiedOn}
                      </p>
                      <a
                        href={entry.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gbc-nav-link pixel-font inline-flex items-center rounded-md border border-black/25 bg-white/80 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-black/78"
                      >
                        Official Link
                      </a>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <SectionModuleNav className="rom-hacks-mobile-nav" />
    </section>
  );

  return (
    <div className="rom-hacks-mobile-page">
      <PokedexFrame
        title="Pokemon ROM Hacks"
        status="success"
        leftPanel={leftPanel}
        className="rom-hacks-mobile-frame"
      />
      <MobileDexBottomNav
        activeKey="explore"
        onExplore={handleMobileExplore}
        onSettings={handleMobileSettings}
        className="rom-hacks-mobile-bottom-nav"
      />
    </div>
  );
}
