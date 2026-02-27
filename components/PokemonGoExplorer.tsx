"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from "react";
import { EncyclopediaDataTable } from "@/components/EncyclopediaDataTable";
import { FavoriteStarButton } from "@/components/FavoriteStarButton";
import { PokedexFrame } from "@/components/PokedexFrame";
import { VirtualizedGrid } from "@/components/VirtualizedGrid";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  pokemonGoItemsQueryOptions,
  pokemonGoModulesQueryOptions
} from "@/lib/encyclopedia-query-options";
import { getPokemonGoItemIconPath } from "@/lib/pokemon-go-item-icons";
import { cn } from "@/lib/utils";
import { useSoundStore } from "@/store/sound-store";
import {
  type PokemonGoActivity,
  type PokemonGoActivityCategory,
  type PokemonGoItemAvailability,
  type PokemonGoItem,
  type PokemonGoItemCategory,
  type PokemonGoItemRarity,
  type PokemonGoPriority
} from "@/types/pokemon-go";

type CategoryFilter = "all" | PokemonGoActivityCategory;
type ItemCategoryFilter = "all" | PokemonGoItemCategory;
type CatalogMode = "modules" | "items";
type GoSortMode = "id-asc" | "name-asc" | "intensity-desc";
type GoToneKey = "select" | "filter" | "scan";

interface CategoryTheme {
  accent: string;
  soft: string;
  glow: string;
}

const CATEGORY_THEME: Record<PokemonGoActivityCategory, CategoryTheme> = {
  raids: { accent: "#cf4a3b", soft: "rgba(207,74,59,0.24)", glow: "rgba(207,74,59,0.48)" },
  battle: { accent: "#2b74c7", soft: "rgba(43,116,199,0.24)", glow: "rgba(43,116,199,0.46)" },
  rocket: { accent: "#49505a", soft: "rgba(73,80,90,0.26)", glow: "rgba(73,80,90,0.46)" },
  research: { accent: "#2f8f73", soft: "rgba(47,143,115,0.24)", glow: "rgba(47,143,115,0.45)" },
  events: { accent: "#b55c35", soft: "rgba(181,92,53,0.24)", glow: "rgba(181,92,53,0.46)" },
  exploration: { accent: "#5f7b38", soft: "rgba(95,123,56,0.25)", glow: "rgba(95,123,56,0.45)" },
  economy: { accent: "#8b6a2d", soft: "rgba(139,106,45,0.25)", glow: "rgba(139,106,45,0.44)" },
  social: { accent: "#8d4ca8", soft: "rgba(141,76,168,0.24)", glow: "rgba(141,76,168,0.46)" }
};

const GO_TONE_CONFIG: Record<
  GoToneKey,
  {
    frequency: number;
    endFrequency?: number;
    duration: number;
    gain: number;
    type: OscillatorType;
  }
> = {
  select: {
    frequency: 820,
    endFrequency: 1050,
    duration: 0.09,
    gain: 0.055,
    type: "triangle"
  },
  filter: {
    frequency: 640,
    endFrequency: 770,
    duration: 0.08,
    gain: 0.05,
    type: "square"
  },
  scan: {
    frequency: 520,
    endFrequency: 680,
    duration: 0.07,
    gain: 0.045,
    type: "sine"
  }
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function sanitizeCategory(value: string): CategoryFilter {
  if (
    value === "raids" ||
    value === "battle" ||
    value === "rocket" ||
    value === "research" ||
    value === "events" ||
    value === "exploration" ||
    value === "economy" ||
    value === "social"
  ) {
    return value;
  }
  return "all";
}

function sanitizeItemCategory(value: string): ItemCategoryFilter {
  if (
    value === "balls" ||
    value === "berries" ||
    value === "healing" ||
    value === "battle" ||
    value === "evolution" ||
    value === "raid" ||
    value === "spawn" ||
    value === "boost" ||
    value === "incubator" ||
    value === "utility" ||
    value === "special"
  ) {
    return value;
  }
  return "all";
}

function sanitizeSort(value: string): GoSortMode {
  if (value === "name-asc" || value === "intensity-desc") {
    return value;
  }
  return "id-asc";
}

function toArtworkUrl(dexId: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexId}.png`;
}

function buildPokemonGoActivitySearchIndex(activities: PokemonGoActivity[]) {
  return activities.map((activity) => ({
    activity,
    haystack: [
      activity.title,
      activity.categoryLabel,
      activity.description,
      activity.cadence,
      ...activity.idealFor,
      ...activity.prepChecklist,
      ...activity.actionLoop,
      ...activity.proTips,
      ...activity.commonMistakes,
      ...activity.rewards.map((entry) => `${entry.reward} ${entry.source} ${entry.note}`),
      ...activity.featuredPokemon.map((entry) => `${entry.name} ${entry.role}`),
      ...activity.searchTags
    ]
      .map(normalize)
      .join(" ")
  }));
}

function searchPokemonGoActivities(
  activities: PokemonGoActivity[],
  searchIndex: Array<{ activity: PokemonGoActivity; haystack: string }>,
  query: string
) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return activities;
  }

  return searchIndex
    .filter((entry) => entry.haystack.includes(normalizedQuery))
    .map((entry) => entry.activity);
}

function buildPokemonGoItemSearchIndex(items: PokemonGoItem[]) {
  return items.map((item) => ({
    item,
    haystack: [
      item.name,
      item.categoryLabel,
      item.description,
      item.inGameEffect,
      item.stackCap,
      item.pvpRelevance,
      item.raidRelevance,
      ...item.acquisition,
      ...item.bestUseCases,
      ...item.relatedSystems,
      ...item.notes,
      ...item.searchTags
    ]
      .map(normalize)
      .join(" ")
  }));
}

function searchPokemonGoItems(
  items: PokemonGoItem[],
  searchIndex: Array<{ item: PokemonGoItem; haystack: string }>,
  query: string
) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return items;
  }

  return searchIndex
    .filter((entry) => entry.haystack.includes(normalizedQuery))
    .map((entry) => entry.item);
}

function priorityTone(priority: PokemonGoPriority) {
  if (priority === "High") {
    return "border-emerald-300 bg-emerald-100/75 text-emerald-900";
  }
  if (priority === "Medium") {
    return "border-sky-300 bg-sky-100/75 text-sky-900";
  }
  return "border-amber-300 bg-amber-100/75 text-amber-900";
}

function itemRarityTone(rarity: PokemonGoItemRarity) {
  if (rarity === "Epic") {
    return "border-violet-300 bg-violet-100/75 text-violet-900";
  }
  if (rarity === "Rare") {
    return "border-sky-300 bg-sky-100/75 text-sky-900";
  }
  if (rarity === "Uncommon") {
    return "border-emerald-300 bg-emerald-100/75 text-emerald-900";
  }
  return "border-black/20 bg-white/70 text-black/75";
}

function itemAvailabilityTone(availability: PokemonGoItemAvailability) {
  if (availability === "Premium") {
    return "border-amber-300 bg-amber-100/75 text-amber-900";
  }
  if (availability === "Free") {
    return "border-emerald-300 bg-emerald-100/75 text-emerald-900";
  }
  if (availability === "Event") {
    return "border-rose-300 bg-rose-100/75 text-rose-900";
  }
  return "border-sky-300 bg-sky-100/75 text-sky-900";
}

function InfoChip({
  value,
  tone = "neutral"
}: {
  value: string;
  tone?: "neutral" | "sky" | "amber" | "rose" | "green";
}) {
  const className =
    tone === "sky"
      ? "border-sky-300 bg-sky-100/75 text-sky-900"
      : tone === "amber"
        ? "border-amber-300 bg-amber-100/75 text-amber-900"
        : tone === "rose"
          ? "border-rose-300 bg-rose-100/75 text-rose-900"
          : tone === "green"
            ? "border-emerald-300 bg-emerald-100/75 text-emerald-900"
            : "border-black/20 bg-white/70 text-black/75";

  return <span className={cn("rounded-md border px-2 py-1 text-xs", className)}>{value}</span>;
}

function DetailSection({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/20 bg-[radial-gradient(circle_at_14%_8%,rgba(255,255,255,0.35),transparent_34%),linear-gradient(160deg,rgba(255,255,255,0.9),rgba(227,238,248,0.76))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_16px_rgba(0,0,0,0.07)]">
      <div className="mb-3 flex items-start gap-2">
        <span className="mt-1 h-2 w-2 rounded-full border border-black/30 bg-[var(--theme-accent)] shadow-[0_0_10px_var(--theme-accent-soft)]" />
        <div>
          <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/78">
            {title}
          </h2>
          {subtitle ? <p className="mt-1 text-sm text-black/62">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function FeaturedPokemonCard({
  pokemon
}: {
  pokemon: PokemonGoActivity["featuredPokemon"][number];
}) {
  return (
    <article className="go-featured-card rounded-xl border border-black/18 bg-[linear-gradient(155deg,rgba(255,255,255,0.9),rgba(231,241,248,0.78))] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
      <div className="flex items-center gap-2">
        <div className="go-featured-art relative h-[74px] w-[74px] flex-shrink-0 overflow-hidden rounded-lg border border-black/20 bg-white/72">
          <Image
            src={toArtworkUrl(pokemon.dexId)}
            alt={`${pokemon.name} Pokemon GO artwork`}
            fill
            sizes="74px"
            className="object-contain p-1.5"
          />
        </div>

        <div className="min-w-0">
          <p className="pixel-font truncate text-[10px] uppercase tracking-[0.12em] text-black/82">
            {pokemon.name}
          </p>
          <p className="mt-0.5 text-xs text-black/62">{pokemon.role}</p>
        </div>
      </div>

      <div className="mt-2 grid gap-1 text-[11px] text-black/72">
        <p className="rounded-md border border-black/15 bg-white/68 px-2 py-1">
          Fast: {pokemon.fastMove}
        </p>
        <p className="rounded-md border border-black/15 bg-white/68 px-2 py-1">
          Charged: {pokemon.chargedMove}
        </p>
      </div>
    </article>
  );
}

export function PokemonGoExplorer() {
  const [catalogMode, setCatalogMode] = useState<CatalogMode>("modules");
  const modulesQuery = useQuery(pokemonGoModulesQueryOptions());
  const itemsQuery = useQuery({
    ...pokemonGoItemsQueryOptions(),
    enabled: catalogMode === "items"
  });
  const activities = useMemo(() => modulesQuery.data?.activities ?? [], [modulesQuery.data]);
  const goItems = useMemo(() => itemsQuery.data?.items ?? [], [itemsQuery.data]);
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortMode, setSortMode] = useState<GoSortMode>("id-asc");
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 220);
  const [itemSearchInput, setItemSearchInput] = useState("");
  const [itemCategoryFilter, setItemCategoryFilter] = useState<ItemCategoryFilter>("all");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const debouncedItemSearch = useDebouncedValue(itemSearchInput, 220);
  const soundEnabled = useSoundStore((state) => state.enabled);
  const soundVolume = useSoundStore((state) => state.volume);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activitySearchIndex = useMemo(
    () => buildPokemonGoActivitySearchIndex(activities),
    [activities]
  );
  const goItemSearchIndex = useMemo(() => buildPokemonGoItemSearchIndex(goItems), [goItems]);

  const playTone = useCallback(
    (tone: GoToneKey) => {
      if (
        !soundEnabled ||
        soundVolume <= 0 ||
        typeof window === "undefined" ||
        typeof window.AudioContext === "undefined"
      ) {
        return;
      }

      const config = GO_TONE_CONFIG[tone];
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
      oscillator.stop(now + config.duration + 0.012);
    },
    [soundEnabled, soundVolume]
  );

  const categoryOptions = useMemo(
    () =>
      (modulesQuery.data?.activityCategories ?? [])
        .slice()
        .sort((a, b) => a.label.localeCompare(b.label)),
    [modulesQuery.data?.activityCategories]
  );

  const itemCategoryOptions = useMemo(
    () =>
      (itemsQuery.data?.itemCategories ?? [])
        .slice()
        .sort((a, b) => a.label.localeCompare(b.label)),
    [itemsQuery.data?.itemCategories]
  );

  const filteredActivities = useMemo(() => {
    const searched = searchPokemonGoActivities(activities, activitySearchIndex, debouncedSearch);
    const categoryMatch =
      categoryFilter === "all"
        ? searched
        : searched.filter((entry) => entry.category === categoryFilter);

    if (sortMode === "name-asc") {
      return categoryMatch.slice().sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sortMode === "intensity-desc") {
      return categoryMatch
        .slice()
        .sort((a, b) => b.intensity - a.intensity || a.id - b.id);
    }

    return categoryMatch.slice().sort((a, b) => a.id - b.id);
  }, [activities, activitySearchIndex, categoryFilter, debouncedSearch, sortMode]);

  const filteredGoItems = useMemo(() => {
    const searchedItems = searchPokemonGoItems(goItems, goItemSearchIndex, debouncedItemSearch);
    const categoryMatch =
      itemCategoryFilter === "all"
        ? searchedItems
        : searchedItems.filter((item) => item.category === itemCategoryFilter);

    return categoryMatch.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [debouncedItemSearch, goItemSearchIndex, goItems, itemCategoryFilter]);

  useEffect(() => {
    if (filteredActivities.length === 0) {
      setSelectedActivityId(null);
      return;
    }

    if (selectedActivityId && filteredActivities.some((entry) => entry.id === selectedActivityId)) {
      return;
    }

    setSelectedActivityId(filteredActivities[0].id);
  }, [filteredActivities, selectedActivityId]);

  useEffect(() => {
    if (filteredGoItems.length === 0) {
      setSelectedItemId(null);
      return;
    }

    if (selectedItemId && filteredGoItems.some((item) => item.id === selectedItemId)) {
      return;
    }

    setSelectedItemId(filteredGoItems[0].id);
  }, [filteredGoItems, selectedItemId]);

  useEffect(
    () => () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    },
    []
  );

  const handleSelectActivity = useCallback(
    (nextId: number) => {
      setSelectedActivityId(nextId);
      playTone("select");
    },
    [playTone]
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      setCategoryFilter(sanitizeCategory(normalize(value)));
      playTone("filter");
    },
    [playTone]
  );

  const handleSortChange = useCallback(
    (value: string) => {
      setSortMode(sanitizeSort(value));
      playTone("filter");
    },
    [playTone]
  );

  const handleSearchInput = useCallback(
    (value: string) => {
      setSearchInput(value);
    },
    []
  );

  const handleSelectItem = useCallback(
    (nextId: number) => {
      setSelectedItemId(nextId);
      playTone("select");
    },
    [playTone]
  );

  const handleItemCategoryChange = useCallback(
    (value: string) => {
      setItemCategoryFilter(sanitizeItemCategory(normalize(value)));
      playTone("filter");
    },
    [playTone]
  );

  const handleItemSearchInput = useCallback((value: string) => {
    setItemSearchInput(value);
  }, []);

  const handleCatalogModeChange = useCallback((mode: CatalogMode) => {
    setCatalogMode(mode);
    playTone("filter");
  }, [playTone]);

  useEffect(() => {
    if (catalogMode === "modules" && debouncedSearch.length > 0) {
      playTone("scan");
    }
  }, [catalogMode, debouncedSearch, playTone]);

  useEffect(() => {
    if (catalogMode === "items" && debouncedItemSearch.length > 0) {
      playTone("scan");
    }
  }, [catalogMode, debouncedItemSearch, playTone]);

  const selectedActivity = useMemo(
    () => filteredActivities.find((entry) => entry.id === selectedActivityId) ?? null,
    [filteredActivities, selectedActivityId]
  );

  const selectedGoItem = useMemo(
    () => filteredGoItems.find((item) => item.id === selectedItemId) ?? null,
    [filteredGoItems, selectedItemId]
  );

  const activeTheme = useMemo(() => {
    const category = selectedActivity?.category ?? "raids";
    return CATEGORY_THEME[category];
  }, [selectedActivity?.category]);

  const themeStyle = useMemo(
    () =>
      ({
        "--theme-accent": activeTheme.accent,
        "--theme-accent-soft": activeTheme.soft,
        "--theme-accent-glow": activeTheme.glow
      }) as CSSProperties,
    [activeTheme]
  );

  const frameStatus = useMemo(() => {
    const activeQueryError = catalogMode === "modules" ? modulesQuery.isError : itemsQuery.isError;
    if (activeQueryError) {
      return "error" as const;
    }
    const activeQueryLoading =
      catalogMode === "modules" ? modulesQuery.isLoading : itemsQuery.isLoading;
    if (activeQueryLoading) {
      return "loading" as const;
    }
    const hasEntries =
      catalogMode === "modules" ? filteredActivities.length > 0 : filteredGoItems.length > 0;
    if (!hasEntries) {
      return "idle" as const;
    }
    return "success" as const;
  }, [
    catalogMode,
    filteredActivities.length,
    filteredGoItems.length,
    itemsQuery.isError,
    itemsQuery.isLoading,
    modulesQuery.isError,
    modulesQuery.isLoading
  ]);

  const leftPanel = (
    <section className="space-y-4">
      <div className="rounded-2xl border border-black/20 bg-[linear-gradient(155deg,rgba(255,255,255,0.66),rgba(228,240,247,0.58))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Pokemon GO Explorer
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleCatalogModeChange("modules")}
            className={cn(
              "go-control-field pixel-font rounded-lg border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] transition",
              catalogMode === "modules"
                ? "border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-black/85"
                : "border-black/20 bg-white/75 text-black/70 hover:bg-white"
            )}
          >
            Modules
          </button>
          <button
            type="button"
            onClick={() => handleCatalogModeChange("items")}
            className={cn(
              "go-control-field pixel-font rounded-lg border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] transition",
              catalogMode === "items"
                ? "border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-black/85"
                : "border-black/20 bg-white/75 text-black/70 hover:bg-white"
            )}
          >
            Items
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label
            htmlFor="go-search"
            className="search-deck-field search-deck-field-live go-search-deck w-full sm:flex-1"
          >
            <span className="search-deck-led" aria-hidden />
            <span className="search-deck-ball" aria-hidden />
            <input
              id="go-search"
              value={catalogMode === "modules" ? searchInput : itemSearchInput}
              onChange={(event) => {
                if (catalogMode === "modules") {
                  handleSearchInput(event.target.value);
                } else {
                  handleItemSearchInput(event.target.value);
                }
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-gramm="false"
              placeholder={
                catalogMode === "modules"
                  ? "Search loops, rewards, or systems..."
                  : "Search item, effect, source, use case..."
              }
              className="search-deck-input"
            />
            {(catalogMode === "modules" ? searchInput : itemSearchInput).trim().length > 0 ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (catalogMode === "modules") {
                    setSearchInput("");
                  } else {
                    setItemSearchInput("");
                  }
                  playTone("filter");
                }}
                className="search-deck-clear-btn"
                aria-label="Clear search"
              >
                x
              </button>
            ) : null}
            <span className="search-deck-gloss" aria-hidden />
          </label>

          {catalogMode === "modules" ? (
            <select
              value={sortMode}
              onChange={(event) => handleSortChange(event.target.value)}
              className="go-control-field rounded-lg border border-black/20 bg-white/80 px-2.5 py-2 text-xs text-black/70"
            >
              <option value="id-asc">Module order</option>
              <option value="name-asc">Name A-Z</option>
              <option value="intensity-desc">Highest intensity</option>
            </select>
          ) : null}
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {catalogMode === "modules" ? (
            <select
              value={categoryFilter}
              onChange={(event) => handleCategoryChange(event.target.value)}
              className="go-control-field rounded-lg border border-black/20 bg-white/80 px-2.5 py-2 text-xs text-black/70"
            >
              <option value="all">All categories</option>
              {categoryOptions.map((entry) => (
                <option key={`go-category-${entry.value}`} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={itemCategoryFilter}
              onChange={(event) => handleItemCategoryChange(event.target.value)}
              className="go-control-field rounded-lg border border-black/20 bg-white/80 px-2.5 py-2 text-xs text-black/70"
            >
              <option value="all">All item categories</option>
              {itemCategoryOptions.map((entry) => (
                <option key={`go-item-category-${entry.value}`} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            {catalogMode === "modules" ? (
              <>
                <InfoChip value={`Visible ${filteredActivities.length}`} />
                <InfoChip value={`Total ${activities.length}`} />
              </>
            ) : (
              <>
                <InfoChip value={`Visible ${filteredGoItems.length}`} />
                <InfoChip value={`Total ${goItems.length}`} />
              </>
            )}
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.62),rgba(226,238,247,0.58))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.74)]">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          {catalogMode === "modules" ? "GO Modules" : "GO Items"}
        </p>

        {catalogMode === "modules" && filteredActivities.length === 0 ? (
          <div className="pokemon-scrollbar mt-3 h-[58vh] min-h-[360px] max-h-[86vh] sm:h-[64vh] sm:min-h-[520px] sm:max-h-[88vh] lg:h-[72vh] lg:min-h-[760px] lg:max-h-[900px] overflow-y-scroll pr-1">
            <p className="rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-4 text-sm text-black/65">
              No Pokemon GO modules match this filter.
            </p>
          </div>
        ) : null}

        {catalogMode === "modules" ? (
          <VirtualizedGrid
            items={filteredActivities}
            itemKey={(entry) => entry.id}
            minColumnWidth={246}
            itemHeight={292}
            gap={12}
            overscanRows={3}
            className="pokemon-scrollbar mt-3 h-[58vh] min-h-[360px] max-h-[86vh] sm:h-[64vh] sm:min-h-[520px] sm:max-h-[88vh] lg:h-[72vh] lg:min-h-[760px] lg:max-h-[900px] overflow-y-scroll pr-1"
            renderItem={(entry) => {
              const isSelected = entry.id === selectedActivityId;

              return (
                  <button
                    type="button"
                    onClick={() => handleSelectActivity(entry.id)}
                    data-selected={isSelected ? "true" : "false"}
                    className={cn(
                      "pokemon-card-shell go-module-card h-full w-full overflow-hidden rounded-xl border p-3 text-left transition",
                      isSelected ? "pokemon-card-selected pokedex-accent-glow" : "pokemon-card-idle hover:bg-white"
                    )}
                  >
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <p className="pixel-font text-[10px] uppercase tracking-[0.13em] text-black/65">
                        #{entry.id.toString().padStart(3, "0")}
                      </p>
                      <span className="text-[12px] text-black/58">{entry.categoryLabel}</span>
                    </div>

                    <p className="pixel-font mt-1 line-clamp-2 text-[12px] uppercase tracking-[0.12em] text-black/84">
                      {entry.title}
                    </p>
                    <p className="mt-1 line-clamp-3 text-[12px] text-black/64">{entry.description}</p>

                    <div className="mt-2.5 flex items-center gap-2">
                      {entry.featuredPokemon.slice(0, 2).map((pokemon) => (
                        <div
                          key={`${entry.id}-${pokemon.dexId}`}
                          className="relative h-[70px] w-[70px] overflow-hidden rounded-lg border border-black/20 bg-white/75"
                        >
                          <Image
                            src={toArtworkUrl(pokemon.dexId)}
                            alt={`${pokemon.name} preview`}
                            fill
                            sizes="70px"
                            className="object-contain p-1.5"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2.5">
                      <span className="rounded-md border border-black/20 bg-white/75 px-2 py-1 text-[11px] text-black/64">
                        {entry.cadence}
                      </span>
                      <span className="go-intensity-chip rounded-md border border-amber-300/85 bg-amber-100/70 px-2 py-1 text-[11px] text-amber-900">
                        Intensity {entry.intensity}/5
                      </span>
                    </div>
                  </div>
                </button>
              );
            }}
          />
        ) : null}

        {catalogMode === "items" && filteredGoItems.length === 0 ? (
          <div className="pokemon-scrollbar mt-3 h-[58vh] min-h-[360px] max-h-[86vh] sm:h-[64vh] sm:min-h-[520px] sm:max-h-[88vh] lg:h-[72vh] lg:min-h-[760px] lg:max-h-[900px] overflow-y-scroll pr-1">
            <p className="rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-4 text-sm text-black/65">
              No Pokemon GO items match this filter.
            </p>
          </div>
        ) : null}

        {catalogMode === "items" ? (
          <VirtualizedGrid
            items={filteredGoItems}
            itemKey={(item) => item.id}
            minColumnWidth={252}
            itemHeight={224}
            gap={8}
            overscanRows={3}
            className="pokemon-scrollbar mt-3 h-[58vh] min-h-[360px] max-h-[86vh] sm:h-[64vh] sm:min-h-[520px] sm:max-h-[88vh] lg:h-[72vh] lg:min-h-[760px] lg:max-h-[900px] overflow-y-scroll pr-1"
            renderItem={(item) => {
              const isSelected = item.id === selectedItemId;
              const itemCardStyle: CSSProperties = {
                height: "100%",
                ...(isSelected
                  ? {
                      "--item-selection-accent": activeTheme.accent,
                      borderColor: activeTheme.accent,
                      boxShadow: `0 0 0 1px ${activeTheme.accent}, 0 10px 16px rgba(0,0,0,0.12)`
                    }
                  : {})
              };

              return (
                <button
                  type="button"
                  onClick={() => handleSelectItem(item.id)}
                  data-selected={isSelected ? "true" : "false"}
                  style={itemCardStyle}
                  className={cn(
                    "item-grid-card go-module-card group relative h-full w-full overflow-hidden rounded-xl border bg-[linear-gradient(165deg,rgba(249,251,248,0.95),rgba(235,241,236,0.92))] p-3 text-left shadow-[0_6px_12px_rgba(0,0,0,0.08)] transition",
                    isSelected
                      ? "item-grid-card-selected text-black/85"
                      : "border-black/15 hover:border-black/25 hover:shadow-[0_10px_16px_rgba(0,0,0,0.12)]"
                  )}
                >
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <p className="pixel-font text-[8px] uppercase tracking-[0.12em] text-black/55">
                        #{item.id.toString().padStart(4, "0")}
                      </p>
                      <span className="text-[11px] text-black/60">{item.categoryLabel}</span>
                    </div>

                    <div className="relative mx-auto mt-2 h-[72px] w-[72px]">
                      <Image
                        src={getPokemonGoItemIconPath(item)}
                        alt={`${item.name} icon`}
                        fill
                        sizes="72px"
                        className="object-contain p-1.5 [image-rendering:pixelated] drop-shadow-[0_6px_8px_rgba(0,0,0,0.2)]"
                      />
                    </div>

                    <p className="pixel-font mt-2 line-clamp-2 min-h-[2.45em] text-[10px] uppercase tracking-[0.12em] text-black/85">
                      {item.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] text-black/60">{item.categoryLabel}</p>

                    <p className="mt-1 line-clamp-2 text-[11px] text-black/68">{item.description}</p>

                    <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                      <span
                        className={cn("rounded-md border px-1.5 py-0.5 text-[10px]", itemRarityTone(item.rarity))}
                      >
                        {item.rarity}
                      </span>
                      <span
                        className={cn(
                          "rounded-md border px-1.5 py-0.5 text-[10px]",
                          itemAvailabilityTone(item.availability)
                        )}
                      >
                        {item.availability}
                      </span>
                    </div>
                  </div>
                </button>
              );
            }}
          />
        ) : null}
      </section>
    </section>
  );

  const rightPanel = (
    <section className="space-y-4">
      <div className="go-detail-shell rounded-2xl border border-black/20 bg-[linear-gradient(165deg,rgba(255,255,255,0.62),rgba(226,237,247,0.58))] p-4 min-h-[420px] sm:min-h-[560px] lg:min-h-[760px] shadow-[inset_0_1px_0_rgba(255,255,255,0.74),0_10px_18px_rgba(0,0,0,0.07)]">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Pokemon GO Details
        </p>

        {catalogMode === "items" ? (
          !selectedGoItem ? (
            <p className="mt-3 rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-4 text-sm text-black/65">
              Select an item to open full Pokemon GO item intelligence.
            </p>
          ) : (
            <div className="pokemon-scrollbar mt-3 max-h-[70vh] sm:max-h-[75vh] lg:max-h-[79vh] overflow-y-auto pr-1">
              <section className="rounded-2xl border border-black/20 bg-[linear-gradient(150deg,rgba(255,255,255,0.9),rgba(235,244,249,0.82))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_8px_16px_rgba(0,0,0,0.07)]">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-black/62">
                      Item #{selectedGoItem.id.toString().padStart(3, "0")}
                    </p>
                    <h3 className="pixel-font mt-1 text-[13px] uppercase tracking-[0.12em] text-black/85">
                      {selectedGoItem.name}
                    </h3>
                    <p className="mt-1 text-sm text-black/70">{selectedGoItem.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <FavoriteStarButton
                      favorite={{
                        entityType: "pokemon_go_item",
                        entityId: String(selectedGoItem.id),
                        title: selectedGoItem.name,
                        href: "/pokemon-go",
                        imageUrl: getPokemonGoItemIconPath(selectedGoItem),
                        subtitle: selectedGoItem.categoryLabel,
                        tags: ["pokemon-go", "item", selectedGoItem.category]
                      }}
                    />
                    <InfoChip value={selectedGoItem.categoryLabel} />
                    <span className={cn("rounded-md border px-2 py-1 text-xs", itemRarityTone(selectedGoItem.rarity))}>
                      {selectedGoItem.rarity}
                    </span>
                    <span
                      className={cn(
                        "rounded-md border px-2 py-1 text-xs",
                        itemAvailabilityTone(selectedGoItem.availability)
                      )}
                    >
                      {selectedGoItem.availability}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[170px_1fr]">
                  <div className="relative h-[170px] overflow-hidden rounded-xl border border-black/18 bg-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                    <Image
                      src={getPokemonGoItemIconPath(selectedGoItem)}
                      alt={`${selectedGoItem.name} icon`}
                      fill
                      sizes="170px"
                      className="object-contain p-4 [image-rendering:pixelated]"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="rounded-md border border-black/15 bg-white/70 px-2.5 py-2 text-sm text-black/78">
                      <span className="font-semibold">In-game effect:</span> {selectedGoItem.inGameEffect}
                    </p>
                    <p className="rounded-md border border-black/15 bg-white/70 px-2.5 py-2 text-sm text-black/78">
                      <span className="font-semibold">Notes:</span> {selectedGoItem.notes.join(" ")}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <p className="rounded-lg border border-black/20 bg-white/72 px-3 py-2 text-sm text-black/78">
                    Stack cap: {selectedGoItem.stackCap}
                  </p>
                  <p className="rounded-lg border border-black/20 bg-white/72 px-3 py-2 text-sm text-black/78">
                    Consumable: {selectedGoItem.consumable ? "Yes" : "No"}
                  </p>
                  <p className="rounded-lg border border-black/20 bg-white/72 px-3 py-2 text-sm text-black/78">
                    Systems: {selectedGoItem.relatedSystems.join(", ")}
                  </p>
                </div>

                <div className="mt-3 grid gap-2 lg:grid-cols-2">
                  <p className="rounded-lg border border-sky-300/65 bg-sky-50/70 px-3 py-2 text-sm text-sky-900">
                    <span className="font-semibold">PvP relevance:</span> {selectedGoItem.pvpRelevance}
                  </p>
                  <p className="rounded-lg border border-emerald-300/65 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-900">
                    <span className="font-semibold">Raid relevance:</span> {selectedGoItem.raidRelevance}
                  </p>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-lg border border-black/18 bg-white/72 p-3">
                    <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65">
                      Acquisition
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-black/80">
                      {selectedGoItem.acquisition.map((entry) => (
                        <li
                          key={`${selectedGoItem.id}-acquisition-inline-${entry}`}
                          className="rounded-md border border-black/15 bg-white/75 px-2 py-1.5"
                        >
                          {entry}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-black/18 bg-white/72 p-3">
                    <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65">
                      Best Use Cases
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-black/80">
                      {selectedGoItem.bestUseCases.map((entry) => (
                        <li
                          key={`${selectedGoItem.id}-use-inline-${entry}`}
                          className="rounded-md border border-black/15 bg-white/75 px-2 py-1.5"
                        >
                          {entry}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          )
        ) : !selectedActivity ? (
          <p className="mt-3 rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-4 text-sm text-black/65">
            Select a module to open Pokemon GO strategy details.
          </p>
        ) : (
          <div className="pokemon-scrollbar mt-3 max-h-[70vh] sm:max-h-[75vh] lg:max-h-[79vh] overflow-y-auto pr-1">
            <div className="space-y-4">
              <section className="go-hero-surface rounded-2xl border border-black/20 bg-[radial-gradient(circle_at_16%_9%,rgba(255,255,255,0.45),transparent_34%),linear-gradient(150deg,rgba(248,251,248,0.94),rgba(226,237,247,0.84))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_10px_18px_rgba(0,0,0,0.08)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/62">
                      Module #{selectedActivity.id.toString().padStart(3, "0")}
                    </p>
                    <h1 className="pixel-font mt-1 text-[14px] uppercase tracking-[0.12em] text-black/86">
                      {selectedActivity.title}
                    </h1>
                    <p className="mt-1 text-sm text-black/64">{selectedActivity.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <FavoriteStarButton
                      favorite={{
                        entityType: "pokemon_go_activity",
                        entityId: String(selectedActivity.id),
                        title: selectedActivity.title,
                        href: "/pokemon-go",
                        subtitle: selectedActivity.categoryLabel,
                        tags: ["pokemon-go", "activity", selectedActivity.category]
                      }}
                    />
                    <InfoChip value={selectedActivity.categoryLabel} />
                    <InfoChip value={selectedActivity.cadence} tone="sky" />
                    <InfoChip value={`Intensity ${selectedActivity.intensity}/5`} tone="amber" />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedActivity.idealFor.map((entry) => (
                    <InfoChip key={`${selectedActivity.id}-ideal-${entry}`} value={entry} tone="green" />
                  ))}
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  {selectedActivity.featuredPokemon.map((pokemon) => (
                    <FeaturedPokemonCard key={`${selectedActivity.id}-${pokemon.dexId}`} pokemon={pokemon} />
                  ))}
                </div>
              </section>

              <DetailSection
                title="Action Loop"
                subtitle="Practical sequence for high-efficiency sessions."
              >
                <ol className="space-y-1.5 text-sm text-black/80">
                  {selectedActivity.actionLoop.map((entry, index) => (
                    <li
                      key={`${selectedActivity.id}-loop-${entry}`}
                      className="rounded-lg border border-black/18 bg-white/72 px-3 py-2"
                    >
                      {index + 1}. {entry}
                    </li>
                  ))}
                </ol>
              </DetailSection>

              <DetailSection
                title="Preparation Checklist"
                subtitle="What to set up before starting each cycle."
              >
                <ul className="space-y-1.5 text-sm text-black/80">
                  {selectedActivity.prepChecklist.map((entry) => (
                    <li
                      key={`${selectedActivity.id}-prep-${entry}`}
                      className="rounded-lg border border-black/18 bg-white/72 px-3 py-2"
                    >
                      {entry}
                    </li>
                  ))}
                </ul>
              </DetailSection>

              <DetailSection
                title="Rewards Matrix"
                subtitle="Core value streams and why they matter."
              >
                <EncyclopediaDataTable
                  className="border-black/22 bg-[linear-gradient(150deg,rgba(255,255,255,0.88),rgba(232,241,248,0.76))] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]"
                  rows={selectedActivity.rewards}
                  rowKey={(entry, index) => `${entry.reward}-${index}`}
                  columns={[
                    {
                      key: "reward",
                      header: "Reward",
                      headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                      render: (entry) => entry.reward
                    },
                    {
                      key: "source",
                      header: "Source",
                      headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                      render: (entry) => entry.source
                    },
                    {
                      key: "priority",
                      header: "Priority",
                      headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                      render: (entry) => (
                        <span
                          className={cn(
                            "rounded-md border px-2 py-1 text-xs",
                            priorityTone(entry.priority)
                          )}
                        >
                          {entry.priority}
                        </span>
                      )
                    },
                    {
                      key: "note",
                      header: "Why It Matters",
                      headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                      render: (entry) => entry.note
                    }
                  ]}
                />
              </DetailSection>

              <DetailSection title="Pro Insights" subtitle="High-impact decisions for long-term growth.">
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-emerald-300/70 bg-[linear-gradient(155deg,rgba(245,255,250,0.88),rgba(226,247,236,0.74))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                    <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-emerald-900/82">
                      Pro Tips
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-black/80">
                      {selectedActivity.proTips.map((entry) => (
                        <li
                          key={`${selectedActivity.id}-tip-${entry}`}
                          className="rounded-md border border-emerald-200/85 bg-white/72 px-2.5 py-1.5"
                        >
                          {entry}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-rose-300/70 bg-[linear-gradient(155deg,rgba(255,248,249,0.9),rgba(252,232,236,0.74))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                    <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-rose-900/82">
                      Common Mistakes
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-black/80">
                      {selectedActivity.commonMistakes.map((entry) => (
                        <li
                          key={`${selectedActivity.id}-mistake-${entry}`}
                          className="rounded-md border border-rose-200/85 bg-white/72 px-2.5 py-1.5"
                        >
                          {entry}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </DetailSection>

            </div>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div style={themeStyle}>
      <PokedexFrame
        title="Pokemon GO Encyclopedia"
        status={frameStatus}
        leftPanel={leftPanel}
        rightPanel={rightPanel}
      />
    </div>
  );
}

