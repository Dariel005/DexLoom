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
  type ChangeEvent,
  type ReactNode
} from "react";
import { EncyclopediaDataTable } from "@/components/EncyclopediaDataTable";
import { FavoriteStarButton } from "@/components/FavoriteStarButton";
import { PokedexFrame } from "@/components/PokedexFrame";
import { VirtualizedStack } from "@/components/VirtualizedStack";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUiTone } from "@/hooks/useUiTone";
import { mapsEncyclopediaQueryOptions } from "@/lib/encyclopedia-query-options";
import { resolveBulbagardenImageSrc } from "@/lib/remote-image";
import { cn } from "@/lib/utils";
import {
  type PokemonRegionMapDetail,
  type PokemonRegionMapKey,
  type PokemonRegionMapPoint
} from "@/types/map";

type MapSortMode = "id-asc" | "name-asc";
type MapEraFilter = "all" | "core" | "expansion" | "historic" | "open-world";
type MapCatalogDensity = "compact" | "detail";

interface RegionTheme {
  accent: string;
  soft: string;
  glow: string;
  shellFrom: string;
  shellMid: string;
  shellTo: string;
  screenFrom: string;
  screenTo: string;
  metalFrom: string;
  metalTo: string;
}

const REGION_THEME_BY_KEY: Record<PokemonRegionMapKey, RegionTheme> = {
  kanto: {
    accent: "#5ca65b",
    soft: "rgba(92, 166, 91, 0.24)",
    glow: "rgba(92, 166, 91, 0.5)",
    shellFrom: "#f17062",
    shellMid: "#d84e45",
    shellTo: "#99623f",
    screenFrom: "#c7efb9",
    screenTo: "#7cb67a",
    metalFrom: "#d2e2d0",
    metalTo: "#abbfab"
  },
  johto: {
    accent: "#b38b4f",
    soft: "rgba(179, 139, 79, 0.24)",
    glow: "rgba(179, 139, 79, 0.48)",
    shellFrom: "#ee7a66",
    shellMid: "#d16946",
    shellTo: "#8b5f39",
    screenFrom: "#e8dfc2",
    screenTo: "#b8aa7c",
    metalFrom: "#dbd5c4",
    metalTo: "#b6ae99"
  },
  hoenn: {
    accent: "#2d9b6a",
    soft: "rgba(45, 155, 106, 0.24)",
    glow: "rgba(45, 155, 106, 0.48)",
    shellFrom: "#f06d61",
    shellMid: "#c45f4f",
    shellTo: "#2d7d69",
    screenFrom: "#bde9d5",
    screenTo: "#5ca88d",
    metalFrom: "#cde3db",
    metalTo: "#97b8ac"
  },
  sinnoh: {
    accent: "#6f66b9",
    soft: "rgba(111, 102, 185, 0.24)",
    glow: "rgba(111, 102, 185, 0.5)",
    shellFrom: "#e8757b",
    shellMid: "#c05674",
    shellTo: "#5f4d8c",
    screenFrom: "#d5d0f0",
    screenTo: "#9689ca",
    metalFrom: "#d6d5e6",
    metalTo: "#aaa7c4"
  },
  unova: {
    accent: "#596874",
    soft: "rgba(89, 104, 116, 0.24)",
    glow: "rgba(89, 104, 116, 0.42)",
    shellFrom: "#e87772",
    shellMid: "#af5a57",
    shellTo: "#4b5b66",
    screenFrom: "#d2dbe2",
    screenTo: "#8d9daa",
    metalFrom: "#d8dde2",
    metalTo: "#a4afb9"
  },
  kalos: {
    accent: "#3e79c6",
    soft: "rgba(62, 121, 198, 0.24)",
    glow: "rgba(62, 121, 198, 0.48)",
    shellFrom: "#ef7671",
    shellMid: "#c7586b",
    shellTo: "#3a68a2",
    screenFrom: "#c8dbf9",
    screenTo: "#7ea4d7",
    metalFrom: "#d3deec",
    metalTo: "#9fb3cb"
  },
  alola: {
    accent: "#c87f46",
    soft: "rgba(200, 127, 70, 0.24)",
    glow: "rgba(200, 127, 70, 0.48)",
    shellFrom: "#f0806a",
    shellMid: "#cf5f4e",
    shellTo: "#9f7245",
    screenFrom: "#f3dfc3",
    screenTo: "#ce9f68",
    metalFrom: "#e4d6c1",
    metalTo: "#c4a988"
  },
  galar: {
    accent: "#2b8ea6",
    soft: "rgba(43, 142, 166, 0.24)",
    glow: "rgba(43, 142, 166, 0.48)",
    shellFrom: "#ef7568",
    shellMid: "#b2555a",
    shellTo: "#2b6f86",
    screenFrom: "#c4e6ef",
    screenTo: "#75b7c9",
    metalFrom: "#d1e0e5",
    metalTo: "#9cb9c3"
  },
  hisui: {
    accent: "#7a8d58",
    soft: "rgba(122, 141, 88, 0.24)",
    glow: "rgba(122, 141, 88, 0.46)",
    shellFrom: "#ee7b6b",
    shellMid: "#b66553",
    shellTo: "#6c6d46",
    screenFrom: "#dbe3c1",
    screenTo: "#9faf75",
    metalFrom: "#dbe1d0",
    metalTo: "#afb997"
  },
  paldea: {
    accent: "#9a5b91",
    soft: "rgba(154, 91, 145, 0.24)",
    glow: "rgba(154, 91, 145, 0.5)",
    shellFrom: "#ef7a74",
    shellMid: "#c84e67",
    shellTo: "#774b7f",
    screenFrom: "#e6d2e8",
    screenTo: "#b07bb5",
    metalFrom: "#ddd1df",
    metalTo: "#b39ab6"
  }
};

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function sanitizeSort(value: string): MapSortMode {
  if (value === "name-asc") {
    return value;
  }
  return "id-asc";
}

function sanitizeEra(value: string): MapEraFilter {
  if (value === "core" || value === "expansion" || value === "historic" || value === "open-world") {
    return value;
  }
  return "all";
}

function isEraMatch(eraLabel: string, eraFilter: MapEraFilter) {
  if (eraFilter === "all") {
    return true;
  }

  const era = normalize(eraLabel);
  if (eraFilter === "core") {
    return era.includes("core region");
  }
  if (eraFilter === "expansion") {
    return era.includes("expansion") || era.includes("dlc");
  }
  if (eraFilter === "historic") {
    return era.includes("historic") || era.includes("legends");
  }
  return era.includes("open-world") || era.includes("open world");
}

function buildRegionSearchIndex(regions: PokemonRegionMapDetail[]) {
  return regions.map((region) => ({
    region,
    haystack: [
      region.name,
      region.generationLabel,
      region.eraLabel,
      region.professor,
      region.leagueHQ,
      region.champion,
      ...region.debutGames,
      ...region.revisitGames,
      ...region.villainTeams,
      ...region.starterPokemon,
      ...region.environmentTags,
      ...region.keyCities.map((city) => city.name),
      ...region.landmarks.map((landmark) => landmark.name),
      ...region.searchTags
    ]
      .map(normalize)
      .join(" ")
  }));
}

function searchRegionMaps(
  regions: PokemonRegionMapDetail[],
  searchIndex: Array<{ region: PokemonRegionMapDetail; haystack: string }>,
  query: string
) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return regions;
  }

  return searchIndex
    .filter((entry) => entry.haystack.includes(normalizedQuery))
    .map((entry) => entry.region);
}

function getRegionInteractivePoints(
  interactivePoints: Record<PokemonRegionMapKey, PokemonRegionMapPoint[]> | undefined,
  regionKey: PokemonRegionMapKey | null
) {
  if (!interactivePoints || !regionKey) {
    return [] as PokemonRegionMapPoint[];
  }
  return interactivePoints[regionKey] ?? [];
}

function scoreRegion(region: PokemonRegionMapDetail) {
  const logistics = region.routeCount * 0.8 + region.travelNetwork.length * 4;
  const structure = region.keyCities.length * 3 + region.landmarks.length * 2;
  const progression = region.gymCount * 2 + region.trialCount * 2;
  const narrative = region.villainTeams.length * 3 + region.loreHighlights.length * 2;
  return Math.round(logistics + structure + progression + narrative);
}

function InfoChip({
  value,
  tone = "neutral"
}: {
  value: string;
  tone?: "neutral" | "green" | "amber" | "sky" | "rose";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-300 bg-emerald-100/70 text-emerald-800"
      : tone === "amber"
        ? "border-amber-300 bg-amber-100/75 text-amber-900"
        : tone === "sky"
          ? "border-sky-300 bg-sky-100/75 text-sky-900"
          : tone === "rose"
            ? "border-rose-300 bg-rose-100/75 text-rose-900"
            : "border-black/20 text-black/70";

  const neutralStyle: CSSProperties | undefined =
    tone === "neutral"
      ? {
          borderColor: "color-mix(in srgb, var(--map-accent) 28%, rgba(0,0,0,0.2))",
          background:
            "color-mix(in srgb, var(--map-accent-soft) 66%, rgba(255,255,255,0.74))"
        }
      : undefined;

  return (
    <span style={neutralStyle} className={cn("rounded-md border px-2 py-1 text-xs", toneClass)}>
      {value}
    </span>
  );
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
    <section className="rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.76),rgba(239,245,238,0.7))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_8px_16px_rgba(0,0,0,0.08)]">
      <div className="mb-3 flex items-start gap-2">
        <span className="mt-1 h-2 w-2 rounded-full border border-black/35 bg-[var(--theme-accent)] shadow-[0_0_10px_var(--theme-accent-soft)]" />
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

function StatCard({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-black/20 bg-[linear-gradient(155deg,rgba(255,255,255,0.85),rgba(238,244,237,0.78))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-black/58">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-black/78">{value}</p>
    </div>
  );
}

export function MapsExplorer() {
  const playUiTone = useUiTone();
  const mapsQuery = useQuery(mapsEncyclopediaQueryOptions());
  const regionMaps = useMemo(() => mapsQuery.data?.regions ?? [], [mapsQuery.data]);
  const interactivePoints = mapsQuery.data?.interactivePoints;
  const [searchInput, setSearchInput] = useState("");
  const [sortMode, setSortMode] = useState<MapSortMode>("id-asc");
  const [eraFilter, setEraFilter] = useState<MapEraFilter>("all");
  const [catalogDensity, setCatalogDensity] = useState<MapCatalogDensity>("detail");
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 220);
  const didMountSearchRef = useRef(false);
  const regionSearchIndex = useMemo(() => buildRegionSearchIndex(regionMaps), [regionMaps]);

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  }, []);

  const handleSearchClear = useCallback(() => {
    playUiTone("switch");
    setSearchInput("");
  }, [playUiTone]);

  const handleEraChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      playUiTone("switch");
      setEraFilter(sanitizeEra(normalize(event.target.value)));
    },
    [playUiTone]
  );

  const handleSortChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      playUiTone("switch");
      setSortMode(sanitizeSort(normalize(event.target.value)));
    },
    [playUiTone]
  );

  const handleCatalogDensityChange = useCallback(
    (nextDensity: MapCatalogDensity) => {
      setCatalogDensity((current) => {
        if (current !== nextDensity) {
          playUiTone("switch");
        }
        return nextDensity;
      });
    },
    [playUiTone]
  );

  const handleSelectRegion = useCallback(
    (regionId: number) => {
      setSelectedRegionId((current) => {
        playUiTone(current === regionId ? "switch" : "select");
        return regionId;
      });
    },
    [playUiTone]
  );

  const handleSelectPoint = useCallback(
    (pointId: string) => {
      setSelectedPointId((current) => {
        playUiTone(current === pointId ? "switch" : "select");
        return pointId;
      });
    },
    [playUiTone]
  );

  const filteredMaps = useMemo(() => {
    const base = searchRegionMaps(regionMaps, regionSearchIndex, debouncedSearch).filter((region) =>
      isEraMatch(region.eraLabel, eraFilter)
    );
    if (sortMode === "name-asc") {
      return base.slice().sort((a, b) => a.name.localeCompare(b.name));
    }
    return base.slice().sort((a, b) => a.id - b.id);
  }, [debouncedSearch, eraFilter, regionMaps, regionSearchIndex, sortMode]);

  useEffect(() => {
    if (filteredMaps.length === 0) {
      setSelectedRegionId(null);
      return;
    }
    if (selectedRegionId && filteredMaps.some((region) => region.id === selectedRegionId)) {
      return;
    }
    setSelectedRegionId(filteredMaps[0].id);
  }, [filteredMaps, selectedRegionId]);

  const selectedRegion = useMemo(
    () => filteredMaps.find((region) => region.id === selectedRegionId) ?? null,
    [filteredMaps, selectedRegionId]
  );
  const selectedRegionMapImageSrc = useMemo(
    () => resolveBulbagardenImageSrc(selectedRegion?.mapImageUrl) ?? selectedRegion?.mapImageUrl ?? null,
    [selectedRegion?.mapImageUrl]
  );

  const selectedRegionPoints = useMemo(
    () => getRegionInteractivePoints(interactivePoints, selectedRegion?.key ?? null),
    [interactivePoints, selectedRegion?.key]
  );

  useEffect(() => {
    if (selectedRegionPoints.length === 0) {
      setSelectedPointId(null);
      return;
    }
    if (selectedPointId && selectedRegionPoints.some((point) => point.id === selectedPointId)) {
      return;
    }
    setSelectedPointId(selectedRegionPoints[0].id);
  }, [selectedPointId, selectedRegionPoints]);

  useEffect(() => {
    if (!didMountSearchRef.current) {
      didMountSearchRef.current = true;
      return;
    }

    if (debouncedSearch.trim().length > 0) {
      playUiTone("scroll");
    }
  }, [debouncedSearch, playUiTone]);

  const selectedPoint = useMemo(
    () => selectedRegionPoints.find((point) => point.id === selectedPointId) ?? null,
    [selectedPointId, selectedRegionPoints]
  );

  const globalIntel = useMemo(() => {
    if (regionMaps.length === 0) {
      return {
        totalGyms: 0,
        totalTrials: 0,
        totalRoutes: 0,
        totalDex: 0,
        topDexRegion: null as PokemonRegionMapDetail | null,
        densestRouteRegion: null as PokemonRegionMapDetail | null,
        uniqueVillainGroups: 0,
        averageScore: 0
      };
    }

    const totalGyms = regionMaps.reduce((sum, region) => sum + region.gymCount, 0);
    const totalTrials = regionMaps.reduce((sum, region) => sum + region.trialCount, 0);
    const totalRoutes = regionMaps.reduce((sum, region) => sum + region.routeCount, 0);
    const totalDex = regionMaps.reduce((sum, region) => sum + region.pokedexSize, 0);

    const topDexRegion = regionMaps.reduce((best, region) =>
      region.pokedexSize > best.pokedexSize ? region : best
    );
    const densestRouteRegion = regionMaps.reduce((best, region) =>
      region.routeCount > best.routeCount ? region : best
    );

    const uniqueVillainGroups = new Set(
      regionMaps.flatMap((region) => region.villainTeams)
    ).size;

    const scoreList = regionMaps.map((region) => scoreRegion(region));
    const averageScore = Math.round(
      scoreList.reduce((sum, score) => sum + score, 0) / scoreList.length
    );

    return {
      totalGyms,
      totalTrials,
      totalRoutes,
      totalDex,
      topDexRegion,
      densestRouteRegion,
      uniqueVillainGroups,
      averageScore
    };
  }, [regionMaps]);

  const selectedRegionScore = useMemo(
    () => (selectedRegion ? scoreRegion(selectedRegion) : null),
    [selectedRegion]
  );

  const selectedRegionScoreDelta = useMemo(() => {
    if (selectedRegionScore === null) {
      return null;
    }
    return selectedRegionScore - globalIntel.averageScore;
  }, [globalIntel.averageScore, selectedRegionScore]);

  const selectedRegionRank = useMemo(() => {
    if (!selectedRegion) {
      return null;
    }
    const sorted = regionMaps.slice().sort((a, b) => scoreRegion(b) - scoreRegion(a));
    const rankIndex = sorted.findIndex((entry) => entry.id === selectedRegion.id);
    return rankIndex === -1 ? null : rankIndex + 1;
  }, [regionMaps, selectedRegion]);

  const activeTheme = useMemo<RegionTheme>(() => {
    const key = selectedRegion?.key ?? "kanto";
    return REGION_THEME_BY_KEY[key];
  }, [selectedRegion?.key]);

  const mapThemeStyle = useMemo(
    () =>
      ({
        "--theme-accent": activeTheme.accent,
        "--theme-accent-soft": activeTheme.soft,
        "--theme-accent-glow": activeTheme.glow,
        "--map-accent": activeTheme.accent,
        "--map-accent-soft": activeTheme.soft,
        "--map-shell-from": activeTheme.shellFrom,
        "--map-shell-mid": activeTheme.shellMid,
        "--map-shell-to": activeTheme.shellTo,
        "--map-screen-from": activeTheme.screenFrom,
        "--map-screen-to": activeTheme.screenTo,
        "--map-metal-from": activeTheme.metalFrom,
        "--map-metal-to": activeTheme.metalTo
      }) as CSSProperties,
    [activeTheme]
  );

  const frameStatus = useMemo(() => {
    if (mapsQuery.isError) {
      return "error" as const;
    }
    if (mapsQuery.isLoading) {
      return "loading" as const;
    }
    if (filteredMaps.length === 0) {
      return "idle" as const;
    }
    return "success" as const;
  }, [filteredMaps.length, mapsQuery.isError, mapsQuery.isLoading]);

  const isCompactDensity = catalogDensity === "compact";
  const catalogItemHeight = isCompactDensity ? 92 : 118;
  const catalogItemGap = isCompactDensity ? 6 : 8;

  const leftPanel = (
    <section className="dex-reading-copy space-y-4">
      <div className="rounded-2xl border border-black/20 bg-[linear-gradient(155deg,rgba(255,255,255,0.66),rgba(228,239,225,0.58))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_8px_16px_rgba(0,0,0,0.08)]">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Map Explorer
        </p>

        <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label htmlFor="maps-search" className="search-deck-field search-deck-field-live w-full sm:flex-1">
            <span className="search-deck-led" aria-hidden />
            <span className="search-deck-ball" aria-hidden />
            <input
              id="maps-search"
              value={searchInput}
              onChange={handleSearchChange}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-gramm="false"
              placeholder="Search region, city, landmark..."
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

          <select
            value={eraFilter}
            onChange={handleEraChange}
            className="rounded-lg border border-black/20 bg-white/80 px-2.5 py-2 text-xs text-black/70"
          >
            <option value="all">All eras</option>
            <option value="core">Core regions</option>
            <option value="expansion">Expansion eras</option>
            <option value="historic">Historic eras</option>
            <option value="open-world">Open-world eras</option>
          </select>

          <select
            value={sortMode}
            onChange={handleSortChange}
            className="rounded-lg border border-black/20 bg-white/80 px-2.5 py-2 text-xs text-black/70"
          >
            <option value="id-asc">Dex order</option>
            <option value="name-asc">Name A-Z</option>
          </select>
        </div>

        <div className="mt-2 flex items-center justify-end">
          <div className="inline-flex items-center gap-1 rounded-lg border border-black/20 bg-white/70 p-1">
            <button
              type="button"
              onClick={() => handleCatalogDensityChange("compact")}
              className={cn(
                "pixel-font rounded-md px-2 py-1 text-[8px] uppercase tracking-[0.12em] transition",
                isCompactDensity
                  ? "border border-black/30 bg-[var(--theme-accent)] text-white"
                  : "border border-transparent text-black/70 hover:bg-white"
              )}
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => handleCatalogDensityChange("detail")}
              className={cn(
                "pixel-font rounded-md px-2 py-1 text-[8px] uppercase tracking-[0.12em] transition",
                !isCompactDensity
                  ? "border border-black/30 bg-[var(--theme-accent)] text-white"
                  : "border border-transparent text-black/70 hover:bg-white"
              )}
            >
              Detail
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <InfoChip value={`Visible ${filteredMaps.length}`} />
          <InfoChip value={`Total ${regionMaps.length}`} />
          <InfoChip value={`Route nodes ${globalIntel.totalRoutes}`} tone="amber" />
          <InfoChip value={`Gym badges ${globalIntel.totalGyms}`} tone="green" />
          <InfoChip value={`Trial gates ${globalIntel.totalTrials}`} tone="rose" />
          <InfoChip value={`Villain groups ${globalIntel.uniqueVillainGroups}`} tone="sky" />
          {selectedRegion ? <InfoChip value={`Active ${selectedRegion.name}`} tone="sky" /> : null}
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Combined Pokedex" value={String(globalIntel.totalDex)} />
          <StatCard label="Route Density Leader" value={globalIntel.densestRouteRegion?.name ?? "N/A"} />
          <StatCard label="Largest Dex Region" value={globalIntel.topDexRegion?.name ?? "N/A"} />
          <StatCard label="Avg Region Score" value={String(globalIntel.averageScore)} />
        </div>
      </div>

      <section className="rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.6),rgba(230,241,227,0.55))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Region Catalog
        </p>

        {filteredMaps.length === 0 ? (
          <div className="pokemon-scrollbar mt-3 h-[58vh] min-h-[360px] max-h-[86vh] sm:h-[64vh] sm:min-h-[520px] sm:max-h-[88vh] lg:h-[72vh] lg:min-h-[760px] lg:max-h-[900px] overflow-y-scroll pr-1">
            <p className="rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-4 text-sm text-black/65">
              No maps found with this filter.
            </p>
          </div>
        ) : (
          <VirtualizedStack
            items={filteredMaps}
            itemKey={(region) => region.id}
            itemHeight={catalogItemHeight}
            gap={catalogItemGap}
            overscan={6}
            className="pokemon-scrollbar mt-3 h-[58vh] min-h-[360px] max-h-[86vh] sm:h-[64vh] sm:min-h-[520px] sm:max-h-[88vh] lg:h-[72vh] lg:min-h-[760px] lg:max-h-[900px] overflow-y-scroll pr-1"
            renderItem={(region) => {
              const isSelected = region.id === selectedRegionId;

              return (
                <button
                  type="button"
                  onClick={() => handleSelectRegion(region.id)}
                  className={cn(
                    "relative h-full w-full overflow-hidden rounded-lg border text-left transition",
                    isCompactDensity ? "px-2.5 py-1.5" : "px-3 py-2",
                    isSelected
                      ? "border-[var(--theme-accent)] bg-[linear-gradient(145deg,var(--theme-accent-soft),rgba(255,255,255,0.5))] text-black/85 pokedex-accent-glow before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[var(--theme-accent)]"
                      : "border-black/20 bg-white/75 text-black/75 hover:bg-white"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "pixel-font uppercase tracking-[0.13em]",
                        isCompactDensity ? "text-[8px]" : "text-[9px]"
                      )}
                    >
                      #{region.id.toString().padStart(3, "0")}
                    </p>
                    <span
                      className={cn(
                        "text-black/55",
                        isCompactDensity ? "text-[10px]" : "text-[11px]"
                      )}
                    >
                      {region.generationLabel}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "pixel-font mt-1 uppercase tracking-[0.12em]",
                      isCompactDensity ? "line-clamp-1 text-[9px]" : "text-[10px]"
                    )}
                  >
                    {region.name}
                  </p>
                  {!isCompactDensity ? (
                    <p className="mt-1 line-clamp-1 text-[11px] text-black/58">
                      {region.eraLabel}
                    </p>
                  ) : null}
                  <div className={cn("mt-1.5 flex flex-wrap items-center gap-1", isCompactDensity && "mt-1")}>
                    {isCompactDensity ? null : (
                      <span className="rounded-md border border-black/20 bg-white/70 px-1.5 py-0.5 text-[10px] text-black/65">
                        Routes {region.routeCount}
                      </span>
                    )}
                    <span className="rounded-md border border-black/20 bg-white/70 px-1.5 py-0.5 text-[10px] text-black/65">
                      Gyms {region.gymCount}
                    </span>
                    {!isCompactDensity && region.trialCount > 0 ? (
                      <span className="rounded-md border border-black/20 bg-white/70 px-1.5 py-0.5 text-[10px] text-black/65">
                        Trials {region.trialCount}
                      </span>
                    ) : null}
                    <span className="rounded-md border border-black/20 bg-white/70 px-1.5 py-0.5 text-[10px] text-black/65">
                      Score {scoreRegion(region)}
                    </span>
                  </div>
                </button>
              );
            }}
          />
        )}
      </section>
    </section>
  );

  const rightPanel = (
    <section className="dex-reading-copy space-y-4">
      <div className="rounded-2xl border border-black/20 bg-[linear-gradient(165deg,rgba(255,255,255,0.6),rgba(228,239,227,0.52))] p-4 min-h-[420px] sm:min-h-[560px] lg:min-h-[760px] shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_10px_18px_rgba(0,0,0,0.07)]">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Region Map Details
        </p>

        {!selectedRegion ? (
          <p className="mt-3 rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-4 text-sm text-black/65">
            Select a region to open map intelligence.
          </p>
        ) : (
          <div className="pokemon-scrollbar mt-3 max-h-[70vh] sm:max-h-[75vh] lg:max-h-[79vh] overflow-y-auto pr-1">
            <div className="space-y-4">
              <div className="rounded-2xl border border-black/20 bg-[radial-gradient(circle_at_16%_10%,rgba(255,255,255,0.48),transparent_34%),linear-gradient(150deg,rgba(248,251,248,0.95),rgba(229,238,226,0.87))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.76),0_10px_18px_rgba(0,0,0,0.08)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/60">
                      Region #{selectedRegion.id.toString().padStart(3, "0")}
                    </p>
                    <h1 className="pixel-font mt-1 text-[14px] uppercase tracking-wide text-black/85">
                      {selectedRegion.name}
                    </h1>
                    <p className="mt-1 text-sm text-black/65">
                      {selectedRegion.generationLabel} | {selectedRegion.eraLabel}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <FavoriteStarButton
                      favorite={{
                        entityType: "map_region",
                        entityId: selectedRegion.key,
                        title: selectedRegion.name,
                        href: "/maps",
                        imageUrl: selectedRegionMapImageSrc ?? selectedRegion.mapImageUrl,
                        subtitle: selectedRegion.generationLabel,
                        tags: ["map_region", selectedRegion.key]
                      }}
                    />
                    <InfoChip value={`${selectedRegion.gymCount} gyms`} tone="green" />
                    <InfoChip value={`${selectedRegion.trialCount} trials`} tone="amber" />
                    <InfoChip value={`Dex ${selectedRegion.pokedexSize}`} tone="sky" />
                    {selectedRegionScore !== null ? <InfoChip value={`Score ${selectedRegionScore}`} tone="rose" /> : null}
                  </div>
                </div>

                <div className="relative mt-4 h-[280px] overflow-hidden rounded-xl border border-black/20 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.45),transparent_36%),linear-gradient(165deg,rgba(244,248,243,0.92),rgba(223,233,221,0.88))] sm:h-[340px]">
                  <Image
                    src={selectedRegionMapImageSrc ?? selectedRegion.mapImageUrl}
                    alt={selectedRegion.mapImageAlt}
                    fill
                    priority={selectedRegion.id === regionMaps[0]?.id}
                    sizes="(max-width: 1024px) 95vw, 50vw"
                    className="object-contain p-2"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.2),transparent_34%,rgba(0,0,0,0.08)_100%)]" />
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-black/60">
                  <span className="flex flex-wrap items-center gap-2">
                    <span>Map Source: {selectedRegion.mapImageCredit}</span>
                    <a
                      href={selectedRegion.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-black/20 bg-white/70 px-2 py-1 text-black/70 hover:bg-white"
                    >
                      Open source
                    </a>
                  </span>
                  <span className="rounded-md border border-black/20 bg-white/70 px-2 py-1">
                    Atlas mode
                  </span>
                </div>
              </div>

              <DetailSection title="Map Snapshot" subtitle="Core structure and region-wide systems.">
                <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <StatCard label="Professor" value={selectedRegion.professor} />
                  <StatCard label="League HQ" value={selectedRegion.leagueHQ} />
                  <StatCard label="Champion" value={selectedRegion.champion} />
                  <StatCard label="Route Count" value={String(selectedRegion.routeCount)} />
                  <StatCard label="Debut" value={selectedRegion.debutGames.join(", ")} />
                  <StatCard label="Revisits" value={selectedRegion.revisitGames.join(", ")} />
                </div>
              </DetailSection>

              <DetailSection title="Regional Benchmark" subtitle="How this map scores against the full atlas set.">
                <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Region Score" value={String(selectedRegionScore ?? 0)} />
                  <StatCard label="Atlas Average" value={String(globalIntel.averageScore)} />
                  <StatCard
                    label="Delta"
                    value={
                      selectedRegionScoreDelta === null
                        ? "N/A"
                        : `${selectedRegionScoreDelta > 0 ? "+" : ""}${selectedRegionScoreDelta}`
                    }
                  />
                  <StatCard
                    label="Rank"
                    value={selectedRegionRank ? `#${selectedRegionRank} / ${regionMaps.length}` : "N/A"}
                  />
                </div>
                <p className="mt-2 rounded-lg border border-black/15 bg-white/65 px-3 py-2 text-sm text-black/78">
                  Benchmark is derived from route density, mobility systems, progression gates,
                  strategic landmarks, and narrative pressure nodes.
                </p>
              </DetailSection>

              <DetailSection title="World Design" subtitle="How the map feels to play and navigate.">
                <div className="space-y-2 text-sm text-black/80">
                  <p className="rounded-lg border border-black/15 bg-white/65 px-3 py-2">
                    <span className="font-semibold">World style:</span> {selectedRegion.worldStyle}
                  </p>
                  <p className="rounded-lg border border-black/15 bg-white/65 px-3 py-2">
                    <span className="font-semibold">Progression:</span> {selectedRegion.progressionStyle}
                  </p>
                  <p className="rounded-lg border border-black/15 bg-white/65 px-3 py-2">
                    <span className="font-semibold">Narrative role:</span> {selectedRegion.narrativeRole}
                  </p>
                  <p className="rounded-lg border border-black/15 bg-white/65 px-3 py-2">
                    <span className="font-semibold">Anime focus:</span> {selectedRegion.animeFocus}
                  </p>
                </div>
              </DetailSection>

              <DetailSection title="Tactical Overlay" subtitle="Interactive map points for routing and story pressure.">
                <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-black/20 bg-[radial-gradient(circle_at_16%_8%,rgba(255,255,255,0.45),transparent_34%),linear-gradient(165deg,rgba(243,248,243,0.92),rgba(219,232,219,0.86))]">
                    <Image
                      src={selectedRegionMapImageSrc ?? selectedRegion.mapImageUrl}
                      alt={`${selectedRegion.name} tactical overlay map`}
                      fill
                      sizes="(max-width: 1280px) 92vw, 42vw"
                      className="object-contain p-1.5"
                    />
                    <div className="absolute inset-0 z-[2]">
                      {selectedRegionPoints.map((point) => {
                        const isActive = point.id === selectedPointId;
                        return (
                          <button
                            key={point.id}
                            type="button"
                            onClick={() => handleSelectPoint(point.id)}
                            aria-label={`Focus map point ${point.label}`}
                            className={cn(
                              "no-gbc-btn absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/60 bg-white/90 shadow-[0_0_0_2px_rgba(255,255,255,0.58),0_4px_10px_rgba(0,0,0,0.25)] transition",
                              isActive
                                ? "scale-125 bg-[var(--map-accent)] ring-2 ring-white/80"
                                : "hover:scale-110"
                            )}
                            style={{ left: `${point.x}%`, top: `${point.y}%` }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <InfoChip value={`Points ${selectedRegionPoints.length}`} tone="amber" />
                      <InfoChip value="city / landmark / story / league" tone="sky" />
                    </div>
                    {selectedPoint ? (
                      <div className="rounded-xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.88),rgba(230,242,232,0.78))] p-3">
                        <p className="pixel-font text-[9px] uppercase tracking-[0.14em] text-black/65">
                          Active Point
                        </p>
                        <p className="pixel-font mt-1 text-[11px] uppercase tracking-[0.12em] text-black/82">
                          {selectedPoint.label}
                        </p>
                        <p className="mt-1 text-xs text-black/62">{selectedPoint.kind}</p>
                        <p className="mt-2 text-sm text-black/78">{selectedPoint.summary}</p>
                      </div>
                    ) : (
                      <p className="rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-2 text-sm text-black/65">
                        No tactical points available for this region.
                      </p>
                    )}
                    <div className="pokemon-scrollbar max-h-[168px] space-y-1 overflow-y-auto pr-1">
                      {selectedRegionPoints.map((point) => (
                        <button
                          key={`point-list-${point.id}`}
                          type="button"
                          onClick={() => handleSelectPoint(point.id)}
                          className={cn(
                            "no-gbc-btn flex w-full items-start justify-between rounded-lg border px-2.5 py-2 text-left text-xs transition",
                            point.id === selectedPointId
                              ? "border-[var(--map-accent)] bg-[var(--map-accent-soft)] text-black/82"
                              : "border-black/20 bg-white/72 text-black/68 hover:bg-white"
                          )}
                        >
                          <span>{point.label}</span>
                          <span className="rounded-md border border-black/20 bg-white/72 px-1.5 py-0.5 text-[10px] uppercase">
                            {point.kind}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </DetailSection>

              <DetailSection title="Strategic Layers" subtitle="Starters, threats, and environmental profile.">
                <div className="space-y-3">
                  <div>
                    <p className="pixel-font text-[9px] uppercase tracking-[0.13em] text-black/65">
                      Starter Pokemon
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedRegion.starterPokemon.map((starter) => (
                        <InfoChip key={`starter-${selectedRegion.id}-${starter}`} value={starter} tone="green" />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="pixel-font text-[9px] uppercase tracking-[0.13em] text-black/65">
                      Villain Teams / Threat Arcs
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedRegion.villainTeams.map((team) => (
                        <InfoChip key={`team-${selectedRegion.id}-${team}`} value={team} tone="rose" />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="pixel-font text-[9px] uppercase tracking-[0.13em] text-black/65">
                      Environment Tags
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedRegion.environmentTags.map((tag) => (
                        <InfoChip key={`env-${selectedRegion.id}-${tag}`} value={tag} tone="sky" />
                      ))}
                    </div>
                  </div>
                </div>
              </DetailSection>

              <DetailSection title="Key Cities" subtitle="Important nodes in each regional journey.">
                <EncyclopediaDataTable
                  className="border-black/25 bg-[linear-gradient(150deg,rgba(255,255,255,0.82),rgba(236,244,235,0.76))]"
                  rows={selectedRegion.keyCities}
                  rowKey={(city, index) => `${city.name}-${index}`}
                  columns={[
                    {
                      key: "city",
                      header: "City",
                      headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                      render: (city) => city.name
                    },
                    {
                      key: "role",
                      header: "Role",
                      headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                      render: (city) => city.role
                    },
                    {
                      key: "highlight",
                      header: "Highlight",
                      headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                      render: (city) => city.highlight
                    }
                  ]}
                />
              </DetailSection>

              <DetailSection title="Major Landmarks" subtitle="Dungeons, facilities, and lore hotspots.">
                <EncyclopediaDataTable
                  className="border-black/25 bg-[linear-gradient(150deg,rgba(255,255,255,0.82),rgba(236,244,235,0.76))]"
                  rows={selectedRegion.landmarks}
                  rowKey={(landmark, index) => `${landmark.name}-${index}`}
                  columns={[
                    {
                      key: "landmark",
                      header: "Landmark",
                      headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                      render: (landmark) => landmark.name
                    },
                    {
                      key: "category",
                      header: "Category",
                      headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                      render: (landmark) => landmark.category
                    },
                    {
                      key: "summary",
                      header: "Summary",
                      headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                      render: (landmark) => landmark.summary
                    }
                  ]}
                />
              </DetailSection>

              <DetailSection title="Travel Network" subtitle="How movement systems shape map control.">
                <EncyclopediaDataTable
                  className="border-black/25 bg-[linear-gradient(150deg,rgba(255,255,255,0.82),rgba(236,244,235,0.76))]"
                  rows={selectedRegion.travelNetwork}
                  rowKey={(node, index) => `${node.method}-${index}`}
                  columns={[
                    {
                      key: "method",
                      header: "Method",
                      headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                      render: (node) => node.method
                    },
                    {
                      key: "coverage",
                      header: "Coverage",
                      headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                      render: (node) => node.coverage
                    },
                    {
                      key: "note",
                      header: "Note",
                      headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                      render: (node) => node.note
                    }
                  ]}
                />
              </DetailSection>

              <DetailSection title="Explorer Intel" subtitle="Practical tips and lore context for each map.">
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-black/20 bg-[linear-gradient(165deg,rgba(255,255,255,0.84),rgba(233,245,232,0.74))] p-3">
                    <p className="pixel-font text-[9px] uppercase tracking-[0.14em] text-black/65">
                      Explorer Tips
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-black/80">
                      {selectedRegion.explorerTips.map((tip) => (
                        <li
                          key={`tip-${selectedRegion.id}-${tip}`}
                          className="rounded-md border border-emerald-200/80 bg-emerald-50/55 px-2 py-1"
                        >
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-black/20 bg-[linear-gradient(165deg,rgba(255,255,255,0.84),rgba(244,236,232,0.72))] p-3">
                    <p className="pixel-font text-[9px] uppercase tracking-[0.14em] text-black/65">
                      Lore Highlights
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-black/80">
                      {selectedRegion.loreHighlights.map((entry) => (
                        <li
                          key={`lore-${selectedRegion.id}-${entry}`}
                          className="rounded-md border border-amber-200/80 bg-amber-50/55 px-2 py-1"
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
    <div style={mapThemeStyle}>
      <PokedexFrame
        title="Pokemon Region Maps Encyclopedia"
        status={frameStatus}
        className="maps-region-frame"
        leftPanel={leftPanel}
        rightPanel={rightPanel}
      />
    </div>
  );
}

