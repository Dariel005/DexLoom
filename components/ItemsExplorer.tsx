"use client";

import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { AnimatePresence, m } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { FavoriteStarButton } from "@/components/FavoriteStarButton";
import { ExplorerEmptyState, ExplorerSearchBar } from "@/components/explorer";
import { PokedexFrame } from "@/components/PokedexFrame";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { VirtualizedGrid } from "@/components/VirtualizedGrid";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  buildAcquisitionHints,
  buildAvailabilitySummary,
  buildComboTips,
  buildItemGuide,
  buildItemTier,
  DEFAULT_SECTION_THEME,
  formatCost,
  getSectionTheme,
  ITEM_KITS,
  ITEM_SECTIONS,
  matchesSection,
  normalizeSearchText,
  resolveSectionLabel,
  type ItemKitDefinition,
  type ItemSectionDefinition,
  type SectionVisualTheme
} from "@/lib/items-encyclopedia";
import {
  pokemonItemDetailQueryOptions,
  pokemonItemIndexQueryOptions
} from "@/lib/pokemon-query-options";
import { cn } from "@/lib/utils";
import { SoundControlPanel } from "@/components/SoundControlPanel";
import { useSoundStore } from "@/store/sound-store";
import { type PokemonItemDetail } from "@/types/item";

const ITEMS_PER_PAGE = 42;
const ITEM_CARD_MIN_WIDTH = 188;
const ITEM_CARD_MIN_HEIGHT = 236;
const ITEM_GRID_SCROLL_VIEWPORT_CLASSNAME =
  "pokemon-scrollbar mt-3 min-h-0 flex-1 overflow-y-scroll pr-1";
const GIF_ASSET_PATTERN = /\.gif(?:$|\?)/i;

function shouldBypassImageOptimization(url: string) {
  return GIF_ASSET_PATTERN.test(url);
}

type ItemToneKey = "select" | "filter" | "toggle" | "compare";
type AuxPanel = "filters" | "sound" | null;

const ITEM_TONE_CONFIG: Record<
  ItemToneKey,
  {
    frequency: number;
    endFrequency?: number;
    duration: number;
    gain: number;
    type: OscillatorType;
  }
> = {
  select: { frequency: 720, duration: 0.07, gain: 0.06, type: "square" },
  filter: {
    frequency: 530,
    endFrequency: 800,
    duration: 0.1,
    gain: 0.065,
    type: "triangle"
  },
  toggle: {
    frequency: 880,
    endFrequency: 1060,
    duration: 0.08,
    gain: 0.055,
    type: "sine"
  },
  compare: {
    frequency: 640,
    endFrequency: 900,
    duration: 0.09,
    gain: 0.06,
    type: "square"
  }
};

function DetailSection({
  title,
  subtitle,
  children,
  tone
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  tone?: SectionVisualTheme;
}) {
  const resolvedTone = tone ?? DEFAULT_SECTION_THEME;
  const style: CSSProperties = {
    borderColor: resolvedTone.chip,
    background: `linear-gradient(160deg, ${resolvedTone.soft}, rgba(255,255,255,0.72))`
  };

  return (
    <section className="rounded-2xl border p-4" style={style}>
      <div className="mb-3">
        <h2
          className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75"
          style={{ color: resolvedTone.accent }}
        >
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-sm text-black/60">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function ItemsExplorer() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [activeKitKey, setActiveKitKey] = useState<string | null>(null);
  const [activeSection, setActiveSection] =
    useState<ItemSectionDefinition["key"]>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeAuxPanel, setActiveAuxPanel] = useState<AuxPanel>(null);
  const [page, setPage] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isCompareModeEnabled, setIsCompareModeEnabled] = useState(false);
  const [compareSelection, setCompareSelection] = useState<number[]>([]);
  const [brokenHdSpriteIds, setBrokenHdSpriteIds] = useState<Set<number>>(() => new Set());
  const [brokenDefaultSpriteIds, setBrokenDefaultSpriteIds] = useState<Set<number>>(
    () => new Set()
  );
  const [detailHdBroken, setDetailHdBroken] = useState(false);
  const [detailDefaultBroken, setDetailDefaultBroken] = useState(false);
  const debouncedSearch = useDebouncedValue(searchInput, 220);
  const soundEnabled = useSoundStore((state) => state.enabled);
  const soundVolume = useSoundStore((state) => state.volume);
  const soundVolumePercent = Math.round(soundVolume * 100);

  const playTone = useCallback(
    (tone: ItemToneKey) => {
      if (
        !soundEnabled ||
        soundVolume <= 0 ||
        typeof window === "undefined" ||
        typeof window.AudioContext === "undefined"
      ) {
        return;
      }

      const config = ITEM_TONE_CONFIG[tone];
      const audioContext = audioContextRef.current ?? new window.AudioContext();
      audioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        void audioContext.resume();
      }

      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const peakGain = Math.max(config.gain * soundVolume, 0.0001);

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, now);
      if (config.endFrequency && config.endFrequency > 0) {
        oscillator.frequency.exponentialRampToValueAtTime(
          config.endFrequency,
          now + config.duration
        );
      }

      gainNode.gain.setValueAtTime(peakGain, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + config.duration + 0.01);
    },
    [soundEnabled, soundVolume]
  );

  const indexQuery = useQuery(pokemonItemIndexQueryOptions());
  const items = useMemo(() => indexQuery.data ?? [], [indexQuery.data]);

  const activeSectionMeta = useMemo(
    () => ITEM_SECTIONS.find((section) => section.key === activeSection) ?? ITEM_SECTIONS[0],
    [activeSection]
  );
  const activeSectionTheme = useMemo(
    () => getSectionTheme(activeSectionMeta.label),
    [activeSectionMeta.label]
  );

  const sectionCounts = useMemo(() => {
    const countMap = new Map<ItemSectionDefinition["key"], number>();
    ITEM_SECTIONS.forEach((section) => {
      countMap.set(
        section.key,
        items.filter((item) => matchesSection(item, section.key)).length
      );
    });
    return countMap;
  }, [items]);

  const sectionItems = useMemo(
    () => items.filter((item) => matchesSection(item, activeSection)),
    [activeSection, items]
  );
  const searchableSectionItems = useMemo(
    () =>
      sectionItems.map((item) => ({
        item,
        haystack: [
          item.displayName,
          item.name,
          item.category,
          item.pocket,
          String(item.id)
        ]
          .join(" ")
          .toLowerCase()
      })),
    [sectionItems]
  );

  const categoryOptions = useMemo(() => {
    const options = new Map<string, string>();
    sectionItems.forEach((item) => {
      options.set(item.categoryKey, item.category);
    });
    return Array.from(options.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [sectionItems]);

  useEffect(() => {
    if (categoryFilter === "all") {
      return;
    }
    if (!categoryOptions.some((option) => option.key === categoryFilter)) {
      setCategoryFilter("all");
    }
  }, [categoryFilter, categoryOptions]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = normalizeSearchText(debouncedSearch);
    return searchableSectionItems
      .filter(({ item, haystack }) => {
        const matchesCategory =
          categoryFilter === "all" || item.categoryKey === categoryFilter;
        if (!matchesCategory) {
          return false;
        }
        if (!normalizedSearch) {
          return true;
        }

        return haystack.includes(normalizedSearch);
      })
      .map((entry) => entry.item);
  }, [categoryFilter, debouncedSearch, searchableSectionItems]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeSection, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pagedItems = useMemo(
    () =>
      filteredItems.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE),
    [filteredItems, safePage]
  );

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  useEffect(() => {
    if (filteredItems.length === 0) {
      setSelectedItemId(null);
      return;
    }

    if (selectedItemId && filteredItems.some((item) => item.id === selectedItemId)) {
      return;
    }

    setSelectedItemId(pagedItems[0]?.id ?? filteredItems[0]?.id ?? null);
  }, [filteredItems, pagedItems, selectedItemId]);

  const detailQuery = useQuery({
    ...pokemonItemDetailQueryOptions(selectedItemId ?? ""),
    enabled: Boolean(selectedItemId),
    placeholderData: keepPreviousData
  });

  const compareQueries = useQueries({
    queries: compareSelection.map((itemId) => ({
      ...pokemonItemDetailQueryOptions(itemId),
      enabled: isCompareModeEnabled,
      placeholderData: keepPreviousData
    }))
  });

  const comparedItems = useMemo(
    () =>
      compareQueries
        .map((query) => query.data)
        .filter((item): item is PokemonItemDetail => Boolean(item)),
    [compareQueries]
  );

  const comparedItemsById = useMemo(
    () => new Map(comparedItems.map((item) => [item.id, item])),
    [comparedItems]
  );

  const compareIsLoading = compareQueries.some(
    (query) => query.isLoading || query.isFetching
  );

  useEffect(() => {
    if (isCompareModeEnabled) {
      return;
    }
    setCompareSelection([]);
  }, [isCompareModeEnabled]);

  useEffect(
    () => () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    },
    []
  );

  const frameStatus = useMemo(() => {
    const indexPending =
      indexQuery.isLoading || (indexQuery.isFetching && !indexQuery.data);
    const detailPending =
      Boolean(selectedItemId) &&
      (detailQuery.isLoading || (detailQuery.isFetching && !detailQuery.data));
    const comparePending = compareQueries.some(
      (query) => query.isLoading || (query.isFetching && !query.data)
    );

    if (indexQuery.isError || detailQuery.isError || compareQueries.some((query) => query.isError)) {
      return "error" as const;
    }
    if (indexPending || detailPending || comparePending) {
      return "loading" as const;
    }
    return "success" as const;
  }, [
    compareQueries,
    detailQuery.data,
    detailQuery.isLoading,
    detailQuery.isError,
    detailQuery.isFetching,
    indexQuery.data,
    indexQuery.isError,
    indexQuery.isFetching,
    indexQuery.isLoading,
    selectedItemId
  ]);

  const selectedItem = detailQuery.data ?? null;
  const selectedItemGuide = useMemo(
    () => (selectedItem ? buildItemGuide(selectedItem) : null),
    [selectedItem]
  );
  const selectedItemTier = useMemo(
    () => (selectedItem ? buildItemTier(selectedItem) : null),
    [selectedItem]
  );
  const selectedItemAcquisitionHints = useMemo(
    () => (selectedItem ? buildAcquisitionHints(selectedItem) : []),
    [selectedItem]
  );
  const selectedItemAvailabilitySummary = useMemo(
    () => (selectedItem ? buildAvailabilitySummary(selectedItem) : null),
    [selectedItem]
  );
  const selectedItemComboTips = useMemo(
    () => (selectedItem ? buildComboTips(selectedItem) : []),
    [selectedItem]
  );
  const selectedItemSectionLabel = useMemo(
    () => (selectedItem ? resolveSectionLabel(selectedItem) : null),
    [selectedItem]
  );
  const selectedItemTheme = useMemo(
    () => getSectionTheme(selectedItemSectionLabel ?? activeSectionMeta.label),
    [activeSectionMeta.label, selectedItemSectionLabel]
  );

  useEffect(() => {
    setDetailHdBroken(false);
    setDetailDefaultBroken(false);
  }, [selectedItemId]);

  const markHdSpriteAsBroken = (itemId: number) => {
    setBrokenHdSpriteIds((current) => {
      if (current.has(itemId)) {
        return current;
      }
      const next = new Set(current);
      next.add(itemId);
      return next;
    });
  };

  const markDefaultSpriteAsBroken = (itemId: number) => {
    setBrokenDefaultSpriteIds((current) => {
      if (current.has(itemId)) {
        return current;
      }
      const next = new Set(current);
      next.add(itemId);
      return next;
    });
  };

  const applyKit = (kit: ItemKitDefinition) => {
    playTone("filter");
    setActiveKitKey(kit.key);
    setActiveSection(kit.section);
    setCategoryFilter("all");
    setSearchInput(kit.query ?? "");
    setPage(1);
  };

  const clearFilters = () => {
    playTone("filter");
    setActiveKitKey(null);
    setActiveSection("all");
    setCategoryFilter("all");
    setSearchInput("");
  };

  const handleToggleAuxPanel = useCallback(
    (panel: Exclude<AuxPanel, null>) => {
      playTone("toggle");
      setActiveAuxPanel((current) => (current === panel ? null : panel));
    },
    [playTone]
  );

  const toggleCompareSelection = (itemId: number) => {
    playTone("compare");
    setCompareSelection((current) => {
      if (current.includes(itemId)) {
        return current.filter((id) => id !== itemId);
      }

      if (current.length >= 2) {
        return [current[1], itemId];
      }

      return [...current, itemId];
    });
  };

  const leftPanel = (
    <section className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <RouteTransitionLink
          href="/"
          className="gbc-nav-link pixel-font inline-flex rounded-lg border border-black/25 bg-white/65 px-3 py-2 text-[10px] uppercase tracking-wide text-black/75 transition hover:bg-white"
        >
          Back to Pokedex
        </RouteTransitionLink>
      </div>

      <div className="rounded-2xl border border-black/20 bg-white/55 p-3">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Item Explorer
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <ExplorerSearchBar
            id="items-search"
            value={searchInput}
            onChange={(value) => {
              setActiveKitKey(null);
              setSearchInput(value);
            }}
            onClear={() => {
              setActiveKitKey(null);
              setSearchInput("");
            }}
            placeholder="Search items..."
            trailing={
              <>
                <button
                  type="button"
                  onClick={() => handleToggleAuxPanel("filters")}
                  className={cn(
                    "pixel-font self-end rounded-lg border px-2.5 py-2 text-[10px] uppercase tracking-[0.14em] transition sm:min-w-[92px] sm:self-auto",
                    activeAuxPanel === "filters"
                      ? "border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-black/85 pokedex-accent-glow"
                      : "border-black/20 bg-white/65 text-black/70 hover:bg-white/85"
                  )}
                >
                  Filters
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAuxPanel("sound")}
                  className={cn(
                    "pixel-font self-end rounded-lg border px-2.5 py-2 text-[10px] uppercase tracking-[0.14em] transition sm:min-w-[92px] sm:self-auto",
                    activeAuxPanel === "sound"
                      ? "border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-black/85 pokedex-accent-glow"
                      : "border-black/20 bg-white/65 text-black/70 hover:bg-white/85"
                  )}
                >
                  Audio
                </button>
              </>
            }
          />

          <button
            type="button"
            onClick={() => handleToggleAuxPanel("filters")}
            className={cn(
              "pixel-font self-end rounded-lg border px-2.5 py-2 text-[10px] uppercase tracking-[0.14em] transition sm:min-w-[92px] sm:self-auto",
              activeAuxPanel === "filters"
                ? "border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-black/85 pokedex-accent-glow"
                : "border-black/20 bg-white/65 text-black/70 hover:bg-white/85"
            )}
          >
            Filters
          </button>

          <button
            type="button"
            onClick={() => handleToggleAuxPanel("sound")}
            className={cn(
              "pixel-font self-end rounded-lg border px-2.5 py-2 text-[10px] uppercase tracking-[0.14em] transition sm:min-w-[92px] sm:self-auto",
              activeAuxPanel === "sound"
                ? "border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-black/85 pokedex-accent-glow"
                : "border-black/20 bg-white/65 text-black/70 hover:bg-white/85"
            )}
          >
            Audio
          </button>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div
            className="rounded-xl border px-3 py-2"
            style={{
              borderColor: activeSectionTheme.chip,
              background: `linear-gradient(140deg, ${activeSectionTheme.soft}, rgba(255,255,255,0.8))`
            }}
          >
            <p
              className="pixel-font text-[9px] uppercase tracking-[0.13em]"
              style={{ color: activeSectionTheme.accent }}
            >
              Item Counter
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-black/75">
              <span className="rounded-md border border-black/20 bg-white/75 px-2 py-1">
                Visible: {filteredItems.length}
              </span>
              <span className="rounded-md border border-black/20 bg-white/75 px-2 py-1">
                Total: {items.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playTone("toggle");
              setIsCompareModeEnabled((current) => !current);
            }}
            style={
              isCompareModeEnabled
                ? {
                  borderColor: activeSectionTheme.accent,
                  background: `linear-gradient(140deg, ${activeSectionTheme.chip}, rgba(255,255,255,0.8))`
                }
                : undefined
            }
            className={cn(
              "rounded-xl border px-3 py-2 text-left transition",
              isCompareModeEnabled
                ? "border-black/35 shadow-[0_6px_12px_rgba(0,0,0,0.08)]"
                : "border-black/20 bg-white/70 hover:bg-white"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="pixel-font text-[9px] uppercase tracking-[0.13em] text-black/75">
                Compare Mode
              </p>
              <span
                className="rounded-md border px-2 py-0.5 text-[10px]"
                style={
                  isCompareModeEnabled
                    ? {
                      borderColor: activeSectionTheme.accent,
                      backgroundColor: "rgba(255,255,255,0.72)",
                      color: activeSectionTheme.accent
                    }
                    : undefined
                }
              >
                {isCompareModeEnabled ? "ON" : "OFF"}
              </span>
            </div>
            <p className="mt-1 text-xs text-black/65">
              Selected for compare: {compareSelection.length}/2
            </p>
          </button>
        </div>

        <AnimatePresence initial={false}>
          {activeAuxPanel ? (
            <m.section
              key={activeAuxPanel}
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="mt-2 overflow-hidden"
            >
              <div className="rounded-xl border border-black/20 bg-white/62 p-3">
                {activeAuxPanel === "filters" ? (
                  <div className="grid gap-2">
                    <div className="space-y-1">
                      <span className="text-xs text-black/65">Trainer Kits</span>
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {ITEM_KITS.map((kit) => (
                          <button
                            key={kit.key}
                            type="button"
                            onClick={() => applyKit(kit)}
                            style={
                              activeKitKey === kit.key
                                ? {
                                  borderColor: activeSectionTheme.accent,
                                  backgroundColor: activeSectionTheme.chip
                                }
                                : undefined
                            }
                            className={cn(
                              "rounded-lg border px-2.5 py-2 text-left text-xs transition",
                              activeKitKey === kit.key
                                ? "text-black/85"
                                : "border-black/20 bg-white/70 text-black/70 hover:bg-white"
                            )}
                          >
                            <p className="pixel-font text-[8px] uppercase tracking-[0.12em]">
                              {kit.label}
                            </p>
                            <p className="mt-1 text-[11px] text-black/60">{kit.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-black/65">Sections</span>
                      <div className="flex flex-wrap gap-1.5">
                        {ITEM_SECTIONS.map((section) => (
                          <button
                            key={section.key}
                            type="button"
                            onClick={() => {
                              setActiveKitKey(null);
                              playTone("filter");
                              setActiveSection(section.key);
                            }}
                            style={
                              activeSection === section.key
                                ? {
                                  borderColor: activeSectionTheme.accent,
                                  backgroundColor: activeSectionTheme.chip
                                }
                                : undefined
                            }
                            className={cn(
                              "rounded-lg border px-2.5 py-1.5 text-xs transition",
                              activeSection === section.key
                                ? "text-black/85"
                                : "border-black/20 bg-white/70 text-black/70 hover:bg-white"
                            )}
                          >
                            {section.label} ({sectionCounts.get(section.key) ?? 0})
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-black/55">{activeSectionMeta.description}</p>
                    </div>

                    <label className="space-y-1">
                      <span className="text-xs text-black/65">Category</span>
                      <select
                        value={categoryFilter}
                        onChange={(event) => {
                          setActiveKitKey(null);
                          playTone("filter");
                          setCategoryFilter(event.target.value);
                        }}
                        className="w-full rounded-lg border border-black/20 bg-white/80 px-3 py-2 text-sm text-black/80"
                      >
                        <option value="all">All categories</option>
                        {categoryOptions.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={clearFilters}
                      className="rounded-lg border border-black/20 bg-white/75 px-3 py-2 text-xs text-black/70 transition hover:bg-white"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : null}

                {activeAuxPanel === "sound" ? (
                  <div className="mx-auto w-full max-w-[460px]">
                    <p className="mb-2 text-center text-xs text-black/65">
                      Sound: {soundEnabled ? `ON (${soundVolumePercent}%)` : "OFF"}
                    </p>
                    <SoundControlPanel
                      className="border border-black/20 bg-white/60 shadow-none"
                      defaultExpanded
                    />
                  </div>
                ) : null}
              </div>
            </m.section>
          ) : null}
        </AnimatePresence>
      </div>

      <section className="flex min-h-[420px] flex-1 flex-col rounded-2xl border border-black/20 bg-white/55 p-3 sm:min-h-[620px] lg:min-h-[760px]">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          {activeSectionMeta.label}
        </p>
        <p className="mt-1 text-xs text-black/60">
          Larger cards optimized for readable names and categories.
        </p>

        {indexQuery.isLoading ? (
          <div className={ITEM_GRID_SCROLL_VIEWPORT_CLASSNAME}>
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(auto-fill,minmax(${ITEM_CARD_MIN_WIDTH}px,1fr))`
              }}
            >
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={`item-skeleton-${index}`}
                  className="animate-pulse rounded-xl bg-black/10"
                  style={{ minHeight: `${ITEM_CARD_MIN_HEIGHT}px` }}
                />
              ))}
            </div>
          </div>
        ) : null}

        {!indexQuery.isLoading && pagedItems.length === 0 ? (
          <div className={ITEM_GRID_SCROLL_VIEWPORT_CLASSNAME}>
            <ExplorerEmptyState message="No items match this filter." />
          </div>
        ) : null}

        {pagedItems.length > 0 ? (
          <VirtualizedGrid
            key={`items-grid-${activeSection}-${categoryFilter}-${debouncedSearch}-${safePage}`}
            items={pagedItems}
            itemKey={(item) => item.id}
            minColumnWidth={ITEM_CARD_MIN_WIDTH}
            itemHeight={ITEM_CARD_MIN_HEIGHT}
            gap={8}
            overscanRows={3}
            className={ITEM_GRID_SCROLL_VIEWPORT_CLASSNAME}
            renderItem={(item) => {
              const isCompared = compareSelection.includes(item.id);
              const isSelected = selectedItemId === item.id;
              const itemCardStyle: CSSProperties = {
                height: "100%",
                ...(isSelected
                  ? {
                    "--item-selection-accent": activeSectionTheme.accent,
                    borderColor: activeSectionTheme.accent,
                    boxShadow: `0 0 0 1px ${activeSectionTheme.accent}, 0 10px 16px rgba(0,0,0,0.12)`
                  }
                  : {})
              };

              return (
                <div
                  style={itemCardStyle}
                  className={cn(
                    "item-grid-card group relative overflow-hidden rounded-2xl border bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.46),transparent_34%),linear-gradient(164deg,rgba(248,252,245,0.98),rgba(226,238,226,0.92))] p-2.5 text-left shadow-[0_8px_16px_rgba(0,0,0,0.09)] transition",
                    isSelected
                      ? "item-grid-card-selected text-black/86"
                      : "border-black/15 hover:border-black/25 hover:shadow-[0_12px_18px_rgba(0,0,0,0.12)]"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      playTone("select");
                      setSelectedItemId(item.id);
                    }}
                    className="no-gbc-btn relative z-[2] flex h-full w-full flex-col rounded-xl border border-black/12 bg-[linear-gradient(155deg,rgba(255,255,255,0.74),rgba(243,248,242,0.58))] px-2.5 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] transition group-hover:border-black/20 group-hover:bg-[linear-gradient(155deg,rgba(255,255,255,0.8),rgba(238,246,236,0.66))]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="pixel-font text-[8px] uppercase tracking-[0.12em] text-black/52">
                        #{item.id.toString().padStart(4, "0")}
                      </p>
                      <span className="rounded-md border border-black/16 bg-white/72 px-1.5 py-0.5 text-[9px] text-black/55">
                        {item.pocket}
                      </span>
                    </div>

                    <div className="relative mx-auto mt-2 h-[98px] w-[98px]">
                      {!brokenHdSpriteIds.has(item.id) ? (
                        <Image
                          src={item.spriteHdUrl}
                          alt={item.displayName}
                          fill
                          sizes="98px"
                          unoptimized={shouldBypassImageOptimization(item.spriteHdUrl)}
                          className="object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.24)]"
                          onError={() => markHdSpriteAsBroken(item.id)}
                        />
                      ) : !brokenDefaultSpriteIds.has(item.id) ? (
                        <Image
                          src={item.spriteUrl}
                          alt={item.displayName}
                          fill
                          sizes="98px"
                          unoptimized={shouldBypassImageOptimization(item.spriteUrl)}
                          className="object-contain [image-rendering:pixelated] drop-shadow-[0_8px_10px_rgba(0,0,0,0.24)]"
                          onError={() => markDefaultSpriteAsBroken(item.id)}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-xl border border-black/20 bg-white/65 text-lg font-semibold text-black/40">
                          {item.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <p className="pixel-font mt-2 line-clamp-2 min-h-[2.45em] text-[11px] uppercase tracking-[0.12em] text-black/86">
                      {item.displayName}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] text-black/62">{item.category}</p>

                    <div className="mt-auto pt-2">
                      <span
                        className="inline-flex rounded-md border px-2 py-1 text-[10px] leading-none"
                        style={{
                          borderColor: activeSectionTheme.chip,
                          background: activeSectionTheme.soft,
                          color: activeSectionTheme.accent
                        }}
                      >
                        {resolveSectionLabel(item)}
                      </span>
                    </div>
                  </button>

                  {isCompareModeEnabled ? (
                    <button
                      type="button"
                      onClick={() => toggleCompareSelection(item.id)}
                      style={
                        isCompared
                          ? {
                            borderColor: activeSectionTheme.accent,
                            backgroundColor: activeSectionTheme.chip
                          }
                          : undefined
                      }
                      className={cn(
                        "no-gbc-btn absolute right-2 top-2 z-[3] rounded-md border px-1.5 py-0.5 text-[9px] shadow-[0_2px_6px_rgba(0,0,0,0.12)]",
                        isCompared
                          ? "border-black/35 text-black/85"
                          : "border-black/20 bg-white/80 text-black/60"
                      )}
                    >
                      {isCompared ? "Selected" : "Compare"}
                    </button>
                  ) : null}
                </div>
              );
            }}
          />
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              playTone("select");
              setPage((current) => Math.max(1, current - 1));
            }}
            disabled={safePage <= 1}
            className="rounded-lg border border-black/20 bg-white/75 px-2.5 py-1 text-xs text-black/70 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-black/65">
            Page {safePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => {
              playTone("select");
              setPage((current) => Math.min(totalPages, current + 1));
            }}
            disabled={safePage >= totalPages}
            className="rounded-lg border border-black/20 bg-white/75 px-2.5 py-1 text-xs text-black/70 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </section>
    </section>
  );

  const rightPanel = (
    <section className="space-y-4">
      {isCompareModeEnabled ? (
        <div
          className="rounded-2xl border p-4 min-h-[220px]"
          style={{
            borderColor: activeSectionTheme.chip,
            background: `linear-gradient(165deg, ${activeSectionTheme.soft}, rgba(255,255,255,0.74))`
          }}
        >
          <p
            className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70"
            style={{ color: activeSectionTheme.accent }}
          >
            Compare Arena
          </p>
          <p className="mt-1 text-xs text-black/60">
            Pick up to 2 items from the grid to compare role, value, and availability.
          </p>

          {compareSelection.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-sm text-black/65">
              Compare mode is active. Select cards with the Compare button.
            </p>
          ) : null}

          {compareSelection.length > 0 ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {compareSelection.map((itemId) => {
                const comparedItem = comparedItemsById.get(itemId);
                const comparedTier = comparedItem ? buildItemTier(comparedItem) : null;
                return (
                  <div key={`compare-${itemId}`} className="rounded-xl border border-black/20 bg-white/72 p-3">
                    {!comparedItem ? (
                      <div className="space-y-2">
                        <div className="h-4 w-2/3 animate-pulse rounded bg-black/10" />
                        <div className="h-16 animate-pulse rounded bg-black/10" />
                        <p className="text-xs text-black/55">
                          {compareIsLoading ? "Loading comparison data..." : "No data available."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/75">
                          #{comparedItem.id.toString().padStart(4, "0")} {comparedItem.displayName}
                        </p>
                        <div className="flex flex-wrap gap-1 text-[11px]">
                          {comparedTier ? (
                            <span
                              className="rounded-md border px-2 py-1"
                              style={{
                                borderColor: comparedTier.color,
                                backgroundColor: comparedTier.bg,
                                color: comparedTier.color
                              }}
                            >
                              Tier {comparedTier.tier}
                            </span>
                          ) : null}
                          <span className="rounded-md border border-black/20 bg-white/70 px-2 py-1">
                            Cost {formatCost(comparedItem.cost)}
                          </span>
                          <span className="rounded-md border border-black/20 bg-white/70 px-2 py-1">
                            {resolveSectionLabel(comparedItem)}
                          </span>
                        </div>
                        <p className="text-sm text-black/75">
                          {comparedItem.shortEffect ?? comparedItem.effect ?? "No effect summary."}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className="rounded-2xl border p-4 min-h-[420px] sm:min-h-[620px] lg:min-h-[760px]"
        style={{
          borderColor: selectedItemTheme.chip,
          background: `linear-gradient(165deg, ${selectedItemTheme.soft}, rgba(255,255,255,0.72))`
        }}
      >
        <p
          className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70"
          style={{ color: selectedItemTheme.accent }}
        >
          Item Details
        </p>

        {detailQuery.isLoading ? (
          <div className="mt-3 min-h-[340px] space-y-3 sm:min-h-[520px] lg:min-h-[600px]">
            <div className="h-5 w-2/3 animate-pulse rounded bg-black/10" />
            <div className="h-40 animate-pulse rounded-2xl bg-black/10" />
            <div className="h-28 animate-pulse rounded-xl bg-black/10" />
            <div className="h-28 animate-pulse rounded-xl bg-black/10" />
            <div className="h-24 animate-pulse rounded-xl bg-black/10" />
          </div>
        ) : null}

        {!detailQuery.isLoading && !selectedItem ? (
          <p className="mt-3 rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-4 text-sm text-black/65">
            Select an item from the list to see what it does and where it is used.
          </p>
        ) : null}

        {selectedItem ? (
          <div className="mt-3 space-y-4">
            <div
              className="relative overflow-hidden rounded-2xl border p-4"
              style={{
                borderColor: selectedItemTheme.chip,
                background: `linear-gradient(140deg, ${selectedItemTheme.from}, ${selectedItemTheme.to})`
              }}
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl"
                style={{ backgroundColor: selectedItemTheme.soft }}
              />
              <div className="relative z-10 grid gap-3 sm:grid-cols-[120px_1fr] sm:items-center">
                <div className="relative mx-auto h-28 w-28 rounded-2xl border border-black/20 bg-white/75">
                  {!detailHdBroken ? (
                    <Image
                      src={selectedItem.spriteHdUrl}
                      alt={selectedItem.displayName}
                      fill
                      sizes="112px"
                      unoptimized={shouldBypassImageOptimization(selectedItem.spriteHdUrl)}
                      className="object-contain p-2"
                      onError={() => setDetailHdBroken(true)}
                    />
                  ) : !detailDefaultBroken && selectedItem.spriteUrl ? (
                    <Image
                      src={selectedItem.spriteUrl}
                      alt={selectedItem.displayName}
                      fill
                      sizes="112px"
                      unoptimized={shouldBypassImageOptimization(selectedItem.spriteUrl)}
                      className="object-contain p-2 [image-rendering:pixelated]"
                      onError={() => setDetailDefaultBroken(true)}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl font-semibold text-black/35">
                      {selectedItem.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div>
                  <p className="pixel-font text-[10px] uppercase tracking-[0.15em] text-black/60">
                    #{selectedItem.id.toString().padStart(4, "0")}
                  </p>
                  <h1 className="pixel-font mt-1 text-[14px] uppercase tracking-wide text-black/85">
                    {selectedItem.displayName}
                  </h1>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    <RouteTransitionLink
                      href={`/items/${selectedItem.id}`}
                      className="gbc-nav-link rounded-md border border-black/20 bg-white/80 px-2 py-1 text-[11px] text-black/75"
                    >
                      Open entry
                    </RouteTransitionLink>
                    <FavoriteStarButton
                      favorite={{
                        entityType: "item",
                        entityId: String(selectedItem.id),
                        title: selectedItem.displayName,
                        href: `/items/${selectedItem.id}`,
                        imageUrl: selectedItem.spriteUrl ?? selectedItem.spriteHdUrl ?? null,
                        subtitle: selectedItem.category,
                        tags: [
                          "item",
                          selectedItem.pocket.toLowerCase(),
                          selectedItem.category.toLowerCase().replace(/\s+/g, "-")
                        ]
                      }}
                    />
                    {selectedItemTier ? (
                      <span
                        className="rounded-md border px-2 py-1"
                        style={{
                          borderColor: selectedItemTier.color,
                          backgroundColor: selectedItemTier.bg,
                          color: selectedItemTier.color
                        }}
                      >
                        Tier: {selectedItemTier.tier}
                      </span>
                    ) : null}
                    <span className="rounded-md border border-black/20 bg-white/70 px-2 py-1">
                      Section: {selectedItemSectionLabel}
                    </span>
                    <span className="rounded-md border border-black/20 bg-white/70 px-2 py-1">
                      Pocket: {selectedItem.pocket}
                    </span>
                    <span className="rounded-md border border-black/20 bg-white/70 px-2 py-1">
                      Category: {selectedItem.category}
                    </span>
                    <span className="rounded-md border border-black/20 bg-white/70 px-2 py-1">
                      Cost: {formatCost(selectedItem.cost)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DetailSection
              title="Usage Overview"
              subtitle="Practical trainer guidance based on item family."
              tone={selectedItemTheme}
            >
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <div className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-black/55">Role</p>
                  <p className="mt-1 text-black/80">
                    {selectedItemGuide?.role ?? "General utility"}
                  </p>
                </div>
                <div className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-black/55">Best Use</p>
                  <p className="mt-1 text-black/80">
                    {selectedItemGuide?.bestUse ?? "Use based on encounter needs."}
                  </p>
                </div>
                <div className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-black/55">Trainer Tip</p>
                  <p className="mt-1 text-black/80">
                    {selectedItemGuide?.trainerTip ?? "Pair with your team strategy."}
                  </p>
                </div>
              </div>
            </DetailSection>

            {selectedItemTier ? (
              <DetailSection
                title="Tier Analysis"
                subtitle="Power tier and strategic impact estimate."
                tone={selectedItemTheme}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-md border px-2 py-1 text-xs"
                    style={{
                      borderColor: selectedItemTier.color,
                      backgroundColor: selectedItemTier.bg,
                      color: selectedItemTier.color
                    }}
                  >
                    Tier {selectedItemTier.tier}
                  </span>
                  <p className="text-sm text-black/80">{selectedItemTier.reason}</p>
                </div>
              </DetailSection>
            ) : null}

            <DetailSection
              title="Availability & Access"
              subtitle="Where this item appears and how trainers usually obtain it."
              tone={selectedItemTheme}
            >
              <p className="text-sm text-black/80">
                {selectedItemAvailabilitySummary ?? "No availability summary."}
              </p>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                  <p className="text-xs text-black/60">Generations</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedItem.availabilityGenerations.length > 0 ? (
                      selectedItem.availabilityGenerations.slice(0, 8).map((generation) => (
                        <span
                          key={`generation-${generation}`}
                          className="rounded-md border border-black/20 bg-white/80 px-1.5 py-0.5 text-[11px] text-black/75"
                        >
                          {generation}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-black/55">N/A</span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                  <p className="text-xs text-black/60">Version Hints</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedItem.availabilityVersions.length > 0 ? (
                      selectedItem.availabilityVersions.slice(0, 8).map((version) => (
                        <span
                          key={`version-${version}`}
                          className="rounded-md border border-black/20 bg-white/80 px-1.5 py-0.5 text-[11px] text-black/75"
                        >
                          {version}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-black/55">N/A</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                <p className="text-xs text-black/60">Where To Get It</p>
                <ul className="mt-1 space-y-1 text-sm text-black/80">
                  {selectedItemAcquisitionHints.map((hint) => (
                    <li key={hint} className="rounded-md bg-white/70 px-2 py-1">
                      {hint}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedItem.heldByPokemon.length > 0 ? (
                <div className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                  <p className="text-xs text-black/60">Wild Hold Sources</p>
                  <div className="mt-1 grid gap-1 sm:grid-cols-2">
                    {selectedItem.heldByPokemon.slice(0, 6).map((entry) => (
                      <p
                        key={`held-source-${entry.name}`}
                        className="rounded-md bg-white/75 px-2 py-1 text-xs text-black/80"
                      >
                        {entry.name}
                        {entry.rarity ? ` (${entry.rarity}% max)` : ""}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
            </DetailSection>

            <DetailSection
              title="Effect Description"
              subtitle="Official behavior and short practical summary."
              tone={selectedItemTheme}
            >
              <p className="text-sm leading-relaxed text-black/80">
                {selectedItem.shortEffect ??
                  selectedItem.effect ??
                  selectedItem.flavorText ??
                  "No usage description available for this item yet."}
              </p>
              {selectedItem.effect && selectedItem.effect !== selectedItem.shortEffect ? (
                <p className="mt-2 text-sm leading-relaxed text-black/70">
                  {selectedItem.effect}
                </p>
              ) : null}
            </DetailSection>

            <DetailSection
              title="Technical Data"
              subtitle="Battle metadata and item mechanics."
              tone={selectedItemTheme}
            >
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                  Fling Power: {selectedItem.flingPower ?? "N/A"}
                </p>
                <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                  Fling Effect: {selectedItem.flingEffect ?? "N/A"}
                </p>
              </div>
              <div className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                <p className="text-xs text-black/65">Attributes</p>
                <p className="mt-1 text-sm text-black/80">
                  {selectedItem.attributes.length > 0
                    ? selectedItem.attributes.join(", ")
                    : "N/A"}
                </p>
              </div>
              <div className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                <p className="text-xs text-black/65">Machine Version Groups</p>
                <p className="mt-1 text-sm text-black/80">
                  {selectedItem.machineVersionGroups.length > 0
                    ? selectedItem.machineVersionGroups.join(", ")
                    : "N/A"}
                </p>
              </div>
            </DetailSection>

            <DetailSection
              title="Recommended Combos"
              subtitle="Team-ready ideas to pair this item with battle plans."
              tone={selectedItemTheme}
            >
              <div className="grid gap-2 text-sm">
                {selectedItemComboTips.map((tip) => (
                  <p key={tip} className="rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-black/80">
                    {tip}
                  </p>
                ))}
              </div>
            </DetailSection>

            {selectedItem.flavorText ? (
              <DetailSection
                title="Flavor Archive"
                subtitle="In-game flavor text for lore and context."
                tone={selectedItemTheme}
              >
                <p className="text-sm leading-relaxed text-black/75">{selectedItem.flavorText}</p>
              </DetailSection>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );

  return (
    <PokedexFrame
      title="Pokemon Items Encyclopedia"
      status={frameStatus}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      rightPanelSticky
    />
  );
}


