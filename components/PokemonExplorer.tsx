"use client";

import { AnimatePresence, m } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { PokemonSearchFilters } from "@/components/PokemonSearchFilters";
import {
  DetailModuleSkeleton,
  PokemonGridSkeleton,
  ProToolsPanelSkeleton,
  RegionDeckSkeleton
} from "@/components/PokedexSkeletons";
import { PokedexChassis } from "@/components/PokedexChassis";
import { PokemonGrid } from "@/components/PokemonGrid";
import { useFavoritePokemon } from "@/hooks/useFavoritePokemon";
import { useGenerationPokemon } from "@/hooks/useGenerationPokemon";
import { usePokemonDetailQuery } from "@/hooks/usePokemonDetailQuery";
import { useGlobalPokemonSearch } from "@/hooks/useGlobalPokemonSearch";
import { DEFAULT_GENERATION_KEY, GENERATIONS } from "@/lib/generations";
import { buildPokedexThemeVariables } from "@/lib/pokedex-theme";
import { prewarmRouteModules } from "@/lib/route-prewarm";
import { cn } from "@/lib/utils";
import { usePokedexStore } from "@/store/pokedex-store";
import { useSoundStore } from "@/store/sound-store";
import { type GenerationKey, type PokemonGenerationFilter } from "@/types/pokemon";
import { useShallow } from "zustand/react/shallow";
import { MegaEvolutionNavLabel } from "@/components/MegaEvolutionNavLabel";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";

const RegionFilterBar = dynamic(
  () => import("@/components/RegionFilterBar").then((module) => module.RegionFilterBar),
  {
    loading: () => <RegionDeckSkeleton />
  }
);

const PokedexProTools = dynamic(
  () => import("@/components/PokedexProTools").then((module) => module.PokedexProTools),
  {
    loading: () => <ProToolsPanelSkeleton />
  }
);

const SoundControlPanel = dynamic(
  () => import("@/components/SoundControlPanel").then((module) => module.SoundControlPanel),
  {
    loading: () => (
      <div className="rounded-2xl border border-black/20 bg-white/70 p-3 text-sm text-black/65">
        Loading audio controls...
      </div>
    )
  }
);

const PokemonDrawer = dynamic(
  () => import("@/components/PokemonDrawer").then((module) => module.PokemonDrawer),
  {
    loading: () => <DetailModuleSkeleton />
  }
);

type ToneKey = "select" | "switch" | "favorite" | "load";
type AuxPanel = "tools" | "sound" | null;
type ModuleNavTone =
  | "tools"
  | "audio"
  | "items"
  | "moves"
  | "abilities"
  | "types"
  | "cards"
  | "maps"
  | "games"
  | "romhacks"
  | "go"
  | "mechanics"
  | "characters"
  | "favorites"
  | "social"
  | "profile"
  | "sources";

const MODULE_NAV_BASE_CLASS =
  "explorer-nav-btn module-nav-btn pixel-font rounded-lg border px-2.5 py-2 text-[10px] uppercase tracking-[0.14em] transition";

const MODULE_NAV_THEME_CLASS: Record<ModuleNavTone, string> = {
  tools: "module-nav-tools",
  audio: "module-nav-audio",
  items: "module-nav-items",
  moves: "module-nav-moves",
  abilities: "module-nav-abilities",
  types: "module-nav-types",
  cards: "module-nav-cards",
  maps: "module-nav-maps",
  games: "module-nav-games",
  romhacks: "module-nav-rom-hacks",
  go: "module-nav-go",
  mechanics: "module-nav-mechanics",
  characters: "module-nav-characters",
  favorites: "module-nav-favorites",
  social: "module-nav-social",
  profile: "module-nav-profile",
  sources: "module-nav-sources"
};

const MODULE_NAV_GLYPH: Record<ModuleNavTone, string> = {
  tools: "TL",
  audio: "AU",
  items: "IT",
  moves: "MV",
  abilities: "AB",
  types: "TP",
  cards: "CD",
  maps: "MP",
  games: "GM",
  romhacks: "RH",
  go: "GO",
  mechanics: "MC",
  characters: "CH",
  favorites: "FV",
  social: "SC",
  profile: "ID",
  sources: "SR"
};

const TONE_CONFIG: Record<
  ToneKey,
  {
    frequency: number;
    endFrequency?: number;
    duration: number;
    gain: number;
    type: OscillatorType;
  }
> = {
  select: { frequency: 760, duration: 0.08, gain: 0.07, type: "square" },
  switch: {
    frequency: 540,
    endFrequency: 820,
    duration: 0.11,
    gain: 0.08,
    type: "triangle"
  },
  favorite: {
    frequency: 900,
    endFrequency: 1100,
    duration: 0.07,
    gain: 0.06,
    type: "sine"
  },
  load: {
    frequency: 620,
    endFrequency: 760,
    duration: 0.09,
    gain: 0.05,
    type: "square"
  }
};

function ModuleNavContent({ tone, label }: { tone: ModuleNavTone; label: string }) {
  return (
    <>
      <span className="module-nav-glyph" aria-hidden>
        {MODULE_NAV_GLYPH[tone]}
      </span>
      <span className="module-nav-label">{label}</span>
    </>
  );
}

function isGenerationKey(value: PokemonGenerationFilter): value is GenerationKey {
  return value !== "all";
}

interface NavigatorConnectionLike {
  effectiveType?: string;
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NavigatorConnectionLike;
  deviceMemory?: number;
}

function canPrewarmRoutes() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const nav = navigator as NavigatorWithConnection;
  const connection = nav.connection;
  const effectiveType = (connection?.effectiveType ?? "").toLowerCase();
  const saveDataEnabled = Boolean(connection?.saveData);
  const hardwareThreads = nav.hardwareConcurrency ?? 8;
  const deviceMemory = nav.deviceMemory ?? 8;

  if (saveDataEnabled) {
    return false;
  }

  if (
    effectiveType.includes("slow-2g") ||
    effectiveType.includes("2g") ||
    effectiveType.includes("3g")
  ) {
    return false;
  }

  return hardwareThreads >= 6 && deviceMemory >= 4;
}

function isDocumentVisible() {
  if (typeof document === "undefined") {
    return true;
  }
  return document.visibilityState === "visible";
}

export function PokemonExplorer() {
  const router = useRouter();
  const [activeGeneration, setActiveGeneration] =
    useState<GenerationKey>(DEFAULT_GENERATION_KEY);
  const [activeAuxPanel, setActiveAuxPanel] = useState<AuxPanel>(null);
  const [isSelectionJoltActive, setIsSelectionJoltActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const detailAnchorRef = useRef<HTMLDivElement | null>(null);
  const {
    selectedPokemonId,
    setSelectedPokemon,
    filters,
    setFilter
  } = usePokedexStore(
    useShallow((state) => ({
      selectedPokemonId: state.selectedPokemonId,
      setSelectedPokemon: state.setSelectedPokemon,
      filters: state.filters,
      setFilter: state.setFilter
    }))
  );
  const prewarmMegaRoute = useCallback(() => {
    router.prefetch("/mega-evolutions");
    void prewarmRouteModules("/mega-evolutions");
  }, [router]);
  const prewarmCharacterRoute = useCallback(() => {
    router.prefetch("/characters");
    void prewarmRouteModules("/characters");
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!canPrewarmRoutes()) {
      return;
    }

    const warmPrimarySecondaryRoutes = () => {
      if (!isDocumentVisible()) {
        return;
      }
      prewarmMegaRoute();
      prewarmCharacterRoute();
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(() => warmPrimarySecondaryRoutes(), {
        timeout: 1400
      });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(warmPrimarySecondaryRoutes, 540);
    return () => window.clearTimeout(timeoutId);
  }, [prewarmCharacterRoute, prewarmMegaRoute]);
  const soundEnabled = useSoundStore((state) => state.enabled);
  const soundVolume = useSoundStore((state) => state.volume);
  const { data: session } = useSession();
  const [incomingFriendRequestCount, setIncomingFriendRequestCount] = useState(0);
  const [socialUnreadAlertCount, setSocialUnreadAlertCount] = useState(0);

  useEffect(() => {
    const sessionUserId = session?.user?.id;
    if (!sessionUserId) {
      setIncomingFriendRequestCount(0);
      setSocialUnreadAlertCount(0);
      return;
    }

    let active = true;
    let requestController: AbortController | null = null;

    const loadIncomingFriendRequests = async () => {
      if (!isDocumentVisible()) {
        return;
      }

      if (requestController) {
        requestController.abort();
      }
      requestController = new AbortController();

      try {
        const response = await fetch("/api/friends", {
          method: "GET",
          cache: "no-store",
          signal: requestController.signal
        });

        if (!response.ok) {
          if (active) {
            setIncomingFriendRequestCount(0);
          }
          return;
        }

        const payload = (await response.json()) as { incoming?: unknown[] };
        if (!active) {
          return;
        }
        setIncomingFriendRequestCount(Array.isArray(payload.incoming) ? payload.incoming.length : 0);

        const notificationsResponse = await fetch("/api/social/notifications?limit=1&unreadOnly=1", {
          method: "GET",
          cache: "no-store",
          signal: requestController.signal
        });
        if (!notificationsResponse.ok) {
          if (active) {
            setSocialUnreadAlertCount(0);
          }
          return;
        }
        const notificationsPayload = (await notificationsResponse.json()) as { unreadCount?: number };
        if (active) {
          setSocialUnreadAlertCount(
            typeof notificationsPayload.unreadCount === "number" && notificationsPayload.unreadCount > 0
              ? Math.floor(notificationsPayload.unreadCount)
              : 0
          );
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        if (active) {
          setIncomingFriendRequestCount(0);
          setSocialUnreadAlertCount(0);
        }
      }
    };

    void loadIncomingFriendRequests();
    const intervalId = window.setInterval(() => {
      void loadIncomingFriendRequests();
    }, 45_000);
    const handleVisibility = () => {
      if (!isDocumentVisible()) {
        return;
      }
      void loadIncomingFriendRequests();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      if (requestController) {
        requestController.abort();
      }
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(intervalId);
    };
  }, [session?.user?.id]);

  const socialBadgeCount = Math.max(incomingFriendRequestCount, socialUnreadAlertCount);

  const {
    pokemon,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isPending,
    isError,
    isFetching
  } = useGenerationPokemon(activeGeneration);

  const globalSearchQuery = useMemo(
    () => filters.id.trim() || filters.query.trim(),
    [filters.id, filters.query]
  );

  const {
    isSearchActive,
    isLoading: isGlobalSearchLoading,
    isError: isGlobalSearchError,
    results: globalSearchResults,
    isResultLimited
  } = useGlobalPokemonSearch(globalSearchQuery);

  const { favoriteIds, toggleFavorite, isAuthenticated: canToggleFavorites } = useFavoritePokemon();
  const selectedPokemonDetailQuery = usePokemonDetailQuery(selectedPokemonId);

  const sourcePokemon = useMemo(
    () => (isSearchActive ? globalSearchResults : pokemon),
    [globalSearchResults, isSearchActive, pokemon]
  );

  const visiblePokemon = useMemo(() => {
    const normalizedType =
      filters.type === "all" ? "all" : filters.type.trim().toLowerCase();
    const idFilter = filters.id.trim();
    const minAttack = typeof filters.minAttack === "number" ? filters.minAttack : null;

    return sourcePokemon.filter((entry) => {
      if (idFilter && !String(entry.id).startsWith(idFilter)) {
        return false;
      }

      if (
        normalizedType !== "all" &&
        !entry.types.some((type) => type.toLowerCase() === normalizedType)
      ) {
        return false;
      }

      if (isGenerationKey(filters.generation) && entry.generationKey !== filters.generation) {
        return false;
      }

      if (minAttack !== null && entry.attack < minAttack) {
        return false;
      }

      return true;
    });
  }, [
    filters.generation,
    filters.id,
    filters.minAttack,
    filters.type,
    sourcePokemon
  ]);

  const availableTypeOptions = useMemo(() => {
    const map = new Map<string, string>();

    sourcePokemon.forEach((entry) => {
      entry.types.forEach((type) => {
        const value = type.toLowerCase();
        if (!map.has(value)) {
          map.set(value, type);
        }
      });
    });

    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [sourcePokemon]);

  const availableGenerationOptions = useMemo(
    () =>
      GENERATIONS.map((generation) => ({
        value: generation.key,
        label: `${generation.label} (${generation.region})`
      })),
    []
  );

  const selectedPokemonSummary = useMemo(
    () => visiblePokemon.find((entry) => entry.id === selectedPokemonId) ?? null,
    [selectedPokemonId, visiblePokemon]
  );

  const resolvedGenerationKey = useMemo(() => {
    if (!isSearchActive) {
      return activeGeneration;
    }
    return (
      selectedPokemonDetailQuery.data?.generationKey ??
      selectedPokemonSummary?.generationKey ??
      activeGeneration
    );
  }, [
    activeGeneration,
    isSearchActive,
    selectedPokemonDetailQuery.data?.generationKey,
    selectedPokemonSummary?.generationKey
  ]);

  const resolvedPrimaryType = useMemo(
    () => selectedPokemonDetailQuery.data?.types[0] ?? selectedPokemonSummary?.types[0] ?? null,
    [selectedPokemonDetailQuery.data?.types, selectedPokemonSummary?.types]
  );

  const pokedexThemeStyle = useMemo(
    () =>
      buildPokedexThemeVariables(resolvedGenerationKey, resolvedPrimaryType) as CSSProperties,
    [resolvedGenerationKey, resolvedPrimaryType]
  );

  const playTone = useCallback(
    (tone: ToneKey) => {
      if (
        !soundEnabled ||
        soundVolume <= 0 ||
        typeof window === "undefined" ||
        typeof window.AudioContext === "undefined"
      ) {
        return;
      }

      const config = TONE_CONFIG[tone];
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

  useEffect(() => {
    if (visiblePokemon.length === 0) {
      if (selectedPokemonId !== null) {
        setSelectedPokemon(null);
      }
      return;
    }

    const stillExists = visiblePokemon.some((entry) => entry.id === selectedPokemonId);
    if (!stillExists) {
      setSelectedPokemon(visiblePokemon[0].id);
    }
  }, [selectedPokemonId, setSelectedPokemon, visiblePokemon]);

  useEffect(() => {
    if (isGenerationKey(filters.generation) && filters.generation !== activeGeneration) {
      setActiveGeneration(filters.generation);
    }
  }, [activeGeneration, filters.generation]);

  const status = useMemo(() => {
    if (isError || isGlobalSearchError) {
      return "error" as const;
    }
    if (isPending || isFetching || (isSearchActive && isGlobalSearchLoading)) {
      return "loading" as const;
    }
    return "success" as const;
  }, [
    isError,
    isFetching,
    isGlobalSearchError,
    isGlobalSearchLoading,
    isPending,
    isSearchActive
  ]);

  const showInitialGridSkeleton =
    status === "loading" && visiblePokemon.length === 0 && !isError && !isGlobalSearchError;

  useEffect(
    () => () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    if (!isSelectionJoltActive || typeof window === "undefined") {
      return;
    }
    const timeout = window.setTimeout(() => setIsSelectionJoltActive(false), 230);
    return () => window.clearTimeout(timeout);
  }, [isSelectionJoltActive]);

  const handleGenerationChange = useCallback(
    (generation: GenerationKey) => {
      setActiveGeneration(generation);
      if (isGenerationKey(filters.generation)) {
        setFilter("generation", generation);
      }
      playTone("switch");
    },
    [filters.generation, playTone, setFilter]
  );

  const handleSelectPokemon = useCallback(
    (pokemonId: number) => {
      setSelectedPokemon(pokemonId);
      setIsSelectionJoltActive(true);
      playTone("select");

      if (typeof window !== "undefined" && window.innerWidth < 1280) {
        window.requestAnimationFrame(() => {
          detailAnchorRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        });
      }
    },
    [playTone, setSelectedPokemon]
  );

  const handleToggleFavorite = useCallback(
    (pokemonId: number) => {
      if (!canToggleFavorites) {
        return;
      }
      toggleFavorite(pokemonId);
      playTone("favorite");
    },
    [canToggleFavorites, playTone, toggleFavorite]
  );

  const handleLoadMore = useCallback(() => {
    void fetchNextPage();
    playTone("load");
  }, [fetchNextPage, playTone]);

  const handleCloseDrawer = useCallback(() => {
    setSelectedPokemon(null);
  }, [setSelectedPokemon]);

  const handleToggleAuxPanel = useCallback(
    (panel: Exclude<AuxPanel, null>) => {
      setActiveAuxPanel((current) => (current === panel ? null : panel));
      playTone("switch");
    },
    [playTone]
  );

  const explorerScreen = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/20 bg-black/[0.06] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="pixel-font text-[10px] uppercase tracking-[0.18em] text-black/65">
            Screen A: Explorer
          </p>
        </div>

        <div className="mt-3 space-y-2.5">
          <label
            htmlFor="pokemon-global-search"
            className="search-deck-field search-deck-field-live search-deck-legendary w-full"
          >
            <span className="search-deck-led" aria-hidden />
            <span className="search-deck-ball" aria-hidden />
            <input
              id="pokemon-global-search"
              value={filters.query}
              onChange={(event) => {
                setFilter("query", event.target.value);
                if (filters.id) {
                  setFilter("id", "");
                }
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-gramm="false"
              placeholder="Search any Pokemon..."
              className="search-deck-input"
            />
            {filters.query.trim().length > 0 ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setFilter("query", "");
                }}
                className="search-deck-clear-btn"
                aria-label="Clear search"
              >
                x
              </button>
            ) : null}
            <span className="search-deck-gloss" aria-hidden />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <RouteTransitionLink
              href="/tools"
              style={{ "--pulse-delay": "0s" } as CSSProperties}
              className={cn(
                MODULE_NAV_BASE_CLASS,
                MODULE_NAV_THEME_CLASS.tools,
                "sm:min-w-[88px]",
                "border-black/20 bg-white/65 text-black/70"
              )}
            >
              <ModuleNavContent tone="tools" label="Tools" />
            </RouteTransitionLink>

            <button
              type="button"
              onClick={() => handleToggleAuxPanel("sound")}
              style={{ "--pulse-delay": "0.25s" } as CSSProperties}
              className={cn(
                MODULE_NAV_BASE_CLASS,
                MODULE_NAV_THEME_CLASS.audio,
                "sm:min-w-[88px]",
                activeAuxPanel === "sound"
                  ? "explorer-nav-btn-active"
                  : "border-black/20 bg-white/65 text-black/70"
              )}
            >
              <ModuleNavContent tone="audio" label="Audio" />
            </button>

            <RouteTransitionLink
              href="/items"
              style={{ "--pulse-delay": "0.5s" } as CSSProperties}
              className={cn(
                MODULE_NAV_BASE_CLASS,
                MODULE_NAV_THEME_CLASS.items,
                "border-black/20 bg-white/65 text-black/70 sm:min-w-[88px]"
              )}
            >
              <ModuleNavContent tone="items" label="Items" />
            </RouteTransitionLink>

            <RouteTransitionLink
              href="/moves"
              style={{ "--pulse-delay": "0.75s" } as CSSProperties}
              className={cn(
                MODULE_NAV_BASE_CLASS,
                MODULE_NAV_THEME_CLASS.moves,
                "border-black/20 bg-white/65 text-black/70 sm:min-w-[88px]"
              )}
            >
              <ModuleNavContent tone="moves" label="Moves" />
            </RouteTransitionLink>

            <RouteTransitionLink
              href="/abilities"
              style={{ "--pulse-delay": "1s" } as CSSProperties}
              className={cn(
                MODULE_NAV_BASE_CLASS,
                MODULE_NAV_THEME_CLASS.abilities,
                "border-black/20 bg-white/65 text-black/70 sm:min-w-[88px]"
              )}
            >
              <ModuleNavContent tone="abilities" label="Abilities" />
            </RouteTransitionLink>

            <RouteTransitionLink
              href="/types"
              style={{ "--pulse-delay": "1.25s" } as CSSProperties}
              className={cn(
                MODULE_NAV_BASE_CLASS,
                MODULE_NAV_THEME_CLASS.types,
                "border-black/20 bg-white/65 text-black/70 sm:min-w-[88px]"
              )}
            >
              <ModuleNavContent tone="types" label="Types" />
            </RouteTransitionLink>

            <RouteTransitionLink
              href="/cards"
              style={{ "--pulse-delay": "1.5s" } as CSSProperties}
              className={cn(
                MODULE_NAV_BASE_CLASS,
                MODULE_NAV_THEME_CLASS.cards,
                "border-black/20 bg-white/65 text-black/70 sm:min-w-[88px]"
              )}
            >
              <ModuleNavContent tone="cards" label="Cards" />
            </RouteTransitionLink>

            <RouteTransitionLink
              href="/maps"
              style={{ "--pulse-delay": "1.75s" } as CSSProperties}
              className={cn(
                MODULE_NAV_BASE_CLASS,
                MODULE_NAV_THEME_CLASS.maps,
                "border-black/20 bg-white/65 text-black/70 sm:min-w-[88px]"
              )}
            >
              <ModuleNavContent tone="maps" label="Maps" />
            </RouteTransitionLink>

            <RouteTransitionLink
              href="/games"
              style={{ "--pulse-delay": "1.9s" } as CSSProperties}
              className={cn(
                MODULE_NAV_BASE_CLASS,
                MODULE_NAV_THEME_CLASS.games,
                "border-black/20 bg-white/65 text-black/70 sm:min-w-[92px]"
              )}
            >
              <ModuleNavContent tone="games" label="Games" />
            </RouteTransitionLink>

            <RouteTransitionLink
              href="/rom-hacks"
              style={{ "--pulse-delay": "2.02s" } as CSSProperties}
              className={cn(
                MODULE_NAV_BASE_CLASS,
                MODULE_NAV_THEME_CLASS.romhacks,
                "rom-hacks-nav-btn rom-hacks-nav-btn-highlight border-black/20 bg-white/65 text-black/70 sm:min-w-[122px]"
              )}
            >
              <span className="rom-hacks-nav-core" aria-hidden />
              <ModuleNavContent tone="romhacks" label="ROM Hacks" />
            </RouteTransitionLink>

            <RouteTransitionLink
              href="/pokemon-go"
              style={{ "--pulse-delay": "2.04s" } as CSSProperties}
              className={cn(
                MODULE_NAV_BASE_CLASS,
                MODULE_NAV_THEME_CLASS.go,
                "border-black/20 bg-white/65 text-black/70 sm:min-w-[104px]"
              )}
            >
              <ModuleNavContent tone="go" label="Pokemon GO" />
            </RouteTransitionLink>

            <RouteTransitionLink
              href="/mechanics"
              style={{ "--pulse-delay": "2.45s" } as CSSProperties}
              className={cn(
                MODULE_NAV_BASE_CLASS,
                MODULE_NAV_THEME_CLASS.mechanics,
                "border-black/20 bg-white/65 text-black/70 sm:min-w-[102px]"
              )}
            >
              <ModuleNavContent tone="mechanics" label="Mechanics" />
            </RouteTransitionLink>

            <RouteTransitionLink
              href="/mega-evolutions"
              onMouseEnter={prewarmMegaRoute}
              onFocus={prewarmMegaRoute}
              onTouchStart={prewarmMegaRoute}
              style={{ "--pulse-delay": "2.52s" } as CSSProperties}
              className="explorer-nav-btn mega-nav-btn pixel-font rounded-lg border border-black/20 bg-white/65 px-2.5 py-2 text-[10px] uppercase tracking-[0.14em] text-black/70 transition hover:bg-white/85 sm:min-w-[146px]"
            >
              <MegaEvolutionNavLabel />
            </RouteTransitionLink>

            <RouteTransitionLink
              href="/characters"
              onMouseEnter={prewarmCharacterRoute}
              onFocus={prewarmCharacterRoute}
              onTouchStart={prewarmCharacterRoute}
              style={{ "--pulse-delay": "2.65s" } as CSSProperties}
              className={cn(
                MODULE_NAV_BASE_CLASS,
                MODULE_NAV_THEME_CLASS.characters,
                "border-black/20 bg-white/65 text-black/70 sm:min-w-[104px]"
              )}
            >
              <ModuleNavContent tone="characters" label="Characters" />
            </RouteTransitionLink>

            <RouteTransitionLink
              href="/favorites"
              style={{ "--pulse-delay": "2.7s" } as CSSProperties}
              className={cn(
                MODULE_NAV_BASE_CLASS,
                MODULE_NAV_THEME_CLASS.favorites,
                "border-black/20 bg-white/65 text-black/70 sm:min-w-[102px]"
              )}
            >
              <ModuleNavContent tone="favorites" label="Favorites" />
            </RouteTransitionLink>

            <RouteTransitionLink
              href="/social"
              style={{ "--pulse-delay": "2.78s" } as CSSProperties}
              className={cn(
                MODULE_NAV_BASE_CLASS,
                MODULE_NAV_THEME_CLASS.social,
                "module-nav-with-notification border-black/20 bg-white/65 text-black/70 sm:min-w-[90px]"
              )}
              aria-label={
                socialBadgeCount > 0
                  ? `Social (${incomingFriendRequestCount} pending requests, ${socialUnreadAlertCount} unread alerts)`
                  : "Social"
              }
            >
              <ModuleNavContent tone="social" label="Social" />
              {socialBadgeCount > 0 ? (
                <>
                  <span className="module-nav-notification-badge" aria-hidden>
                    {socialBadgeCount > 99 ? "99+" : socialBadgeCount}
                  </span>
                  <span className="sr-only">
                    {incomingFriendRequestCount} pending friend requests and {socialUnreadAlertCount} unread social alerts
                  </span>
                </>
              ) : null}
            </RouteTransitionLink>

            <RouteTransitionLink
              href="/profile/me"
              style={{ "--pulse-delay": "2.83s" } as CSSProperties}
              className={cn(
                MODULE_NAV_BASE_CLASS,
                MODULE_NAV_THEME_CLASS.profile,
                "border-black/20 bg-white/65 text-black/70 sm:min-w-[94px]"
              )}
            >
              <ModuleNavContent tone="profile" label="Profile" />
            </RouteTransitionLink>

            <RouteTransitionLink
              href="/sources"
              style={{ "--pulse-delay": "2.9s" } as CSSProperties}
              className={cn(
                MODULE_NAV_BASE_CLASS,
                MODULE_NAV_THEME_CLASS.sources,
                "border-black/20 bg-white/65 text-black/70 sm:min-w-[88px]"
              )}
            >
              <ModuleNavContent tone="sources" label="Sources" />
            </RouteTransitionLink>
          </div>
        </div>

        {isSearchActive && isResultLimited ? (
          <p className="mt-2 text-xs text-black/60">
            Showing top {visiblePokemon.length} results. Refine search to narrow it down.
          </p>
        ) : null}
      </div>

      <RegionFilterBar
        activeGeneration={activeGeneration}
        onChange={handleGenerationChange}
      />

      <AnimatePresence initial={false}>
        {activeAuxPanel ? (
          <m.section
            key={activeAuxPanel}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-black/20 bg-black/[0.06] p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="pixel-font text-[10px] uppercase tracking-[0.18em] text-black/70">
                  {activeAuxPanel === "sound" ? "Audio Deck" : "Pro Tools Deck"}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveAuxPanel(null)}
                  className="rounded-md border border-black/20 bg-white/70 px-2 py-1 text-xs text-black/70 transition hover:bg-white"
                >
                  Close
                </button>
              </div>

              {activeAuxPanel === "tools" ? (
                <div className="space-y-3">
                  <PokemonSearchFilters
                    availableTypes={availableTypeOptions}
                    availableGenerations={availableGenerationOptions}
                  />
                  <PokedexProTools
                    candidatePokemon={visiblePokemon}
                    selectedPokemonId={selectedPokemonId}
                    onSelectPokemon={handleSelectPokemon}
                  />
                </div>
              ) : null}

              {activeAuxPanel === "sound" ? (
                <div className="mx-auto w-full max-w-[440px]">
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

      {isError || isGlobalSearchError ? (
        <div className="rounded-2xl border border-red-300/40 bg-red-50 p-4 text-sm text-red-700">
          {(error as Error)?.message ??
            "Failed to load Pokemon data for this search."}
        </div>
      ) : null}

      {isSearchActive && isGlobalSearchLoading ? (
        <p className="text-center text-xs text-black/60">Searching across all generations...</p>
      ) : null}

      {showInitialGridSkeleton ? (
        <PokemonGridSkeleton />
      ) : (
        <PokemonGrid
          pokemon={visiblePokemon}
          selectedPokemonId={selectedPokemonId}
          favoriteIds={favoriteIds}
          canToggleFavorite={canToggleFavorites}
          onSelectPokemon={handleSelectPokemon}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {showInitialGridSkeleton ? null : isSearchActive ? null : hasNextPage ? (
        <div className="flex justify-center">
          <m.button
            type="button"
            whileHover={{ y: -1.5, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
            className="pixel-font rounded-xl border border-black/30 bg-[var(--theme-accent)] px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-white shadow-[0_8px_16px_var(--theme-accent-soft)] transition hover:brightness-110 disabled:opacity-60"
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </m.button>
        </div>
      ) : (
        <p className="text-center text-xs text-black/55">Generation fully loaded.</p>
      )}
    </div>
  );

  const detailScreen = (
      <div
        ref={detailAnchorRef}
        className={cn("flex h-full min-h-0 flex-col gap-3", isSelectionJoltActive && "pokedex-jolt")}
      >
        <div className="min-h-0 flex-1">
          <PokemonDrawer
            selectedPokemonId={selectedPokemonId}
            onClose={handleCloseDrawer}
          />
        </div>
      </div>
  );

  return (
    <PokedexChassis
      className="home-main-chassis"
      title="DexLoom"
      status={status}
      explorerScreen={explorerScreen}
      detailScreen={detailScreen}
      themeStyle={pokedexThemeStyle}
    />
  );
}

