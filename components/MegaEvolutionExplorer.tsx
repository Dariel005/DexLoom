"use client";

import { AnimatePresence, m } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MobileDexBottomNav } from "@/components/MobileDexBottomNav";
import { PokedexChassis } from "@/components/PokedexChassis";
import { PokedexHeaderAccess } from "@/components/PokedexHeaderAccess";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUiTone } from "@/hooks/useUiTone";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { MEGA_EVOLUTION_INDEX } from "@/lib/mega-evolutions-encyclopedia";
import { buildPokedexThemeVariables } from "@/lib/pokedex-theme";
import { prewarmRouteModules } from "@/lib/route-prewarm";
import { cn } from "@/lib/utils";

const MEGA_SEARCH_INDEX = MEGA_EVOLUTION_INDEX.map((entry) => ({
  entry,
  haystack: entry.searchTokens
}));
const MEGA_BY_SLUG = new Map(MEGA_EVOLUTION_INDEX.map((entry) => [entry.slug, entry]));

const MegaEvolutionGrid = dynamic(
  () =>
    import("@/components/mega/MegaEvolutionGrid").then(
      (module) => module.MegaEvolutionGrid
    ),
  {
    ssr: false,
    loading: () => (
      <div className="relative mt-3 grid gap-3 sm:gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,236px),1fr))]">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={`mega-grid-skeleton-${index}`}
            className="h-[252px] animate-pulse rounded-2xl border border-black/20 bg-black/[0.08]"
          />
        ))}
      </div>
    )
  }
);

const MegaEvolutionDrawer = dynamic(
  () =>
    import("@/components/mega/MegaEvolutionDrawer").then(
      (module) => module.MegaEvolutionDrawer
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-black/25 bg-white/45 sm:min-h-[440px] lg:min-h-[540px]">
        <p className="pixel-font text-center text-[10px] uppercase tracking-[0.14em] text-black/60">
          Loading detail screen...
        </p>
      </div>
    )
  }
);

export function MegaEvolutionExplorer() {
  const router = useRouter();
  const playUiTone = useUiTone();
  const favorites = useUserFavorites();
  const detailAnchorRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 200);
  const [isMobileTerminalOpen, setIsMobileTerminalOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    MEGA_EVOLUTION_INDEX[0]?.slug ?? null
  );
  const [isSelectionJoltActive, setIsSelectionJoltActive] = useState(false);

  const favoriteSlugs = useMemo(
    () =>
      favorites.items
        .filter((entry) => entry.entityType === "mega")
        .map((entry) => entry.entityId),
    [favorites.items]
  );

  useEffect(() => {
    if (!isSelectionJoltActive || typeof window === "undefined") {
      return;
    }
    const timeout = window.setTimeout(() => setIsSelectionJoltActive(false), 230);
    return () => window.clearTimeout(timeout);
  }, [isSelectionJoltActive]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!isMobileTerminalOpen || !window.matchMedia("(max-width: 767px)").matches) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileTerminalOpen]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = debouncedSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return MEGA_EVOLUTION_INDEX;
    }
    return MEGA_SEARCH_INDEX.filter((candidate) =>
      candidate.haystack.includes(normalizedQuery)
    ).map((candidate) => candidate.entry);
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (filteredEntries.length === 0) {
      if (selectedSlug !== null) {
        setSelectedSlug(null);
      }
      return;
    }

    if (selectedSlug === null) {
      setSelectedSlug(filteredEntries[0].slug);
      return;
    }

    const stillVisible = filteredEntries.some((entry) => entry.slug === selectedSlug);
    if (!stillVisible) {
      setSelectedSlug(filteredEntries[0].slug);
    }
  }, [filteredEntries, selectedSlug]);

  const selectedEntry = useMemo(
    () => filteredEntries.find((entry) => entry.slug === selectedSlug) ?? null,
    [filteredEntries, selectedSlug]
  );

  const primaryType = selectedEntry?.types[0] ?? null;
  const themeStyle = useMemo(
    () => buildPokedexThemeVariables("gen6", primaryType) as CSSProperties,
    [primaryType]
  );

  const handleSelectEntry = useCallback(
    (slug: string) => {
      setSelectedSlug(slug);
      setIsSelectionJoltActive(true);
      playUiTone("select");

      if (typeof window !== "undefined" && window.innerWidth < 1280) {
        if (window.innerWidth < 768) {
          setIsMobileTerminalOpen(true);
          return;
        }
        window.requestAnimationFrame(() => {
          detailAnchorRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        });
      }
    },
    [playUiTone]
  );

  const handleCloseDrawer = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsMobileTerminalOpen(false);
      return;
    }
    setSelectedSlug(null);
    playUiTone("switch");
  }, [playUiTone]);

  const handleToggleFavorite = useCallback(
    (slug: string) => {
      if (!favorites.isAuthenticated) {
        return;
      }

      const entry = MEGA_BY_SLUG.get(slug);
      if (!entry) {
        return;
      }

      const isNowFavorite = favorites.toggleFavorite({
        entityType: "mega",
        entityId: slug,
        title: entry.megaName,
        href: `/mega-evolutions/${slug}`,
        imageUrl: entry.imageSrc,
        subtitle: `${entry.debutGeneration} (${entry.region})`,
        tags: ["mega", ...entry.types.map((type) => type.toLowerCase())]
      });
      playUiTone(isNowFavorite ? "select" : "switch");
    },
    [favorites, playUiTone]
  );

  const warmMegaStonesRoute = useCallback(() => {
    router.prefetch("/mega-evolutions/stones");
    void prewarmRouteModules("/mega-evolutions/stones");
  }, [router]);

  const explorerScreen = (
    <div className="home-explorer-stack mega-explorer-stack space-y-4">
      <section className="home-explorer-console mega-explorer-console rounded-2xl border border-black/20 bg-black/[0.06] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="pixel-font text-[10px] uppercase tracking-[0.18em] text-black/65">
            Screen A: Explorer
          </p>
        </div>

        <div className="mt-3 space-y-2.5">
          <label
            htmlFor="mega-evolution-search"
            className="search-deck-field search-deck-field-live search-deck-legendary w-full"
          >
            <span className="search-deck-led" aria-hidden />
            <span className="search-deck-ball" aria-hidden />
            <input
              id="mega-evolution-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-gramm="false"
              placeholder="Search Mega evolutions..."
              className="search-deck-input"
            />
            {searchQuery.trim().length > 0 ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setSearchQuery("");
                }}
                className="search-deck-clear-btn"
                aria-label="Clear search"
              >
                x
              </button>
            ) : null}
            <span className="search-deck-gloss" aria-hidden />
          </label>

          <h1 className="pixel-font mt-1 text-[14px] uppercase tracking-[0.12em] text-black/86">
            Mega Evolution Registry
          </h1>
          <p className="text-sm text-black/76">
            Browse every Mega form with role profile, stone requirement, and live stats.
          </p>

          <div className="mega-explorer-actions flex flex-wrap gap-2">
            <RouteTransitionLink
              href="/mega-evolutions/stones"
              onMouseEnter={warmMegaStonesRoute}
              onFocus={warmMegaStonesRoute}
              onTouchStart={warmMegaStonesRoute}
              className="explorer-nav-btn pixel-font rounded-lg border border-black/20 bg-white/72 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-black/78 transition hover:bg-white/86"
            >
              Open Mega Stones
            </RouteTransitionLink>
          </div>
        </div>
      </section>

      <MegaEvolutionGrid
        entries={filteredEntries}
        selectedSlug={selectedSlug}
        favoriteSlugs={favoriteSlugs}
        canToggleFavorite={favorites.isAuthenticated}
        onSelectEntry={handleSelectEntry}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );

  const detailScreen = (
    <div
      ref={detailAnchorRef}
      className={cn("flex h-full min-h-0 flex-col gap-3", isSelectionJoltActive && "pokedex-jolt")}
    >
      <div className="min-h-0 flex-1">
        <MegaEvolutionDrawer
          selectedEntry={selectedEntry}
          onClose={handleCloseDrawer}
        />
      </div>
    </div>
  );

  const mobileBottomNav = (
    <MobileDexBottomNav
      activeKey="explore"
      settingsHref="/mega-evolutions/stones"
      onExplore={() => {
        setIsMobileTerminalOpen(false);
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
    />
  );

  const mobileDetailTerminal = (
    <AnimatePresence>
      {selectedEntry && isMobileTerminalOpen ? (
        <m.div
          key={`mega-mobile-terminal-${selectedEntry.slug}`}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="home-mobile-terminal-overlay mega-mobile-terminal-overlay md:hidden"
        >
          <div className="home-mobile-terminal-frame mega-mobile-terminal-frame">
            <header className="home-mobile-terminal-topbar">
              <div className="home-mobile-terminal-leds" aria-hidden>
                <span className="pokedex-led pokedex-led-signal h-4 w-4 bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.64)]" />
                <span className="pokedex-led pokedex-led-signal h-2.5 w-2.5 bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.58)]" />
                <span className="pokedex-led pokedex-led-signal h-2.5 w-2.5 bg-red-300 shadow-[0_0_8px_rgba(252,165,165,0.58)]" />
              </div>
              <p className="pixel-font home-mobile-terminal-title">Data Terminal</p>
              <div className="home-mobile-terminal-avatar-slot">
                <PokedexHeaderAccess tone="dark" className="home-mobile-terminal-access" />
              </div>
            </header>

            <div className="home-mobile-terminal-screen mega-mobile-terminal-screen">
              <MegaEvolutionDrawer
                selectedEntry={selectedEntry}
                onClose={handleCloseDrawer}
              />
            </div>
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      <PokedexChassis
        className="home-main-chassis mega-main-chassis"
        title="Mega Evolutions"
        status="success"
        explorerScreen={explorerScreen}
        detailScreen={detailScreen}
        themeStyle={themeStyle}
      />
      {mobileDetailTerminal}
      {mobileBottomNav}
    </>
  );
}
