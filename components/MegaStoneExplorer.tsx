"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { type CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FavoriteStarButton } from "@/components/FavoriteStarButton";
import { PokedexChassis } from "@/components/PokedexChassis";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { useUiTone } from "@/hooks/useUiTone";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { MEGA_EVOLUTION_INDEX } from "@/lib/mega-evolutions-encyclopedia";
import {
  MEGA_STONE_ARCHIVE
} from "@/lib/mega-stones-encyclopedia";
import { buildPokedexThemeVariables } from "@/lib/pokedex-theme";
import { prewarmRouteModules } from "@/lib/route-prewarm";
import { cn } from "@/lib/utils";

const MEGA_BY_SLUG = new Map(MEGA_EVOLUTION_INDEX.map((entry) => [entry.slug, entry]));
const MEGA_STONE_BY_NAME = new Map(MEGA_STONE_ARCHIVE.map((entry) => [entry.itemName, entry]));

const MegaStoneArchive = dynamic(
  () =>
    import("@/components/mega/MegaStoneArchive").then(
      (module) => module.MegaStoneArchive
    ),
  {
    ssr: false,
    loading: () => (
      <section className="rounded-2xl border border-black/25 bg-black/[0.06] p-3">
        <div className="grid gap-3 sm:gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,236px),1fr))]">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={`mega-stone-archive-skeleton-${index}`}
              className="h-[252px] animate-pulse rounded-2xl border border-black/20 bg-black/[0.08]"
            />
          ))}
        </div>
      </section>
    )
  }
);

export function MegaStoneExplorer() {
  const router = useRouter();
  const playUiTone = useUiTone();
  const favorites = useUserFavorites();
  const detailAnchorRef = useRef<HTMLDivElement | null>(null);
  const [selectedStone, setSelectedStone] = useState<string | null>(
    MEGA_STONE_ARCHIVE[0]?.itemName ?? null
  );
  const [isSelectionJoltActive, setIsSelectionJoltActive] = useState(false);

  useEffect(() => {
    if (!isSelectionJoltActive || typeof window === "undefined") {
      return;
    }
    const timeout = window.setTimeout(() => setIsSelectionJoltActive(false), 230);
    return () => window.clearTimeout(timeout);
  }, [isSelectionJoltActive]);

  const selectedStoneEntry = useMemo(
    () => MEGA_STONE_ARCHIVE.find((entry) => entry.itemName === selectedStone) ?? null,
    [selectedStone]
  );

  const favoriteStoneNames = useMemo(
    () =>
      favorites.items
        .filter((entry) => entry.entityType === "mega_stone")
        .map((entry) => entry.entityId),
    [favorites.items]
  );

  const highlightedType = useMemo(() => {
    const megaSlug = selectedStoneEntry?.linkedMegaSlugs[0];
    if (!megaSlug) {
      return null;
    }
    return MEGA_BY_SLUG.get(megaSlug)?.types[0] ?? null;
  }, [selectedStoneEntry]);

  const themeStyle = useMemo(
    () => buildPokedexThemeVariables("gen6", highlightedType) as CSSProperties,
    [highlightedType]
  );

  const handleSelectStone = useCallback(
    (itemName: string) => {
      setSelectedStone(itemName);
      setIsSelectionJoltActive(true);
      playUiTone("select");

      if (typeof window !== "undefined" && window.innerWidth < 1280) {
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

  const handleToggleStoneFavorite = useCallback(
    (itemName: string) => {
      if (!favorites.isAuthenticated) {
        return;
      }

      const stone = MEGA_STONE_BY_NAME.get(itemName);
      if (!stone) {
        return;
      }

      const isNowFavorite = favorites.toggleFavorite({
        entityType: "mega_stone",
        entityId: itemName,
        title: stone.itemName,
        href: "/mega-evolutions/stones",
        imageUrl: stone.imageSrc,
        subtitle: `Category: ${stone.category.replace(/-/g, " ")}`,
        tags: ["mega_stone", ...stone.linkedSpecies.map((species) => species.toLowerCase())]
      });
      playUiTone(isNowFavorite ? "select" : "switch");
    },
    [favorites, playUiTone]
  );

  const warmMegaFormsRoute = useCallback(() => {
    router.prefetch("/mega-evolutions");
    void prewarmRouteModules("/mega-evolutions");
  }, [router]);

  const explorerScreen = (
    <div className="space-y-4">
      <section className="rounded-2xl border border-black/20 bg-black/[0.06] p-3">
        <p className="pixel-font text-[10px] uppercase tracking-[0.18em] text-black/65">
          Screen A: Explorer
        </p>
        <h1 className="pixel-font mt-2 text-[14px] uppercase tracking-[0.12em] text-black/86">
          Mega Stone Registry
        </h1>
        <p className="mt-2 text-sm text-black/76">
          Browse every Mega Stone with artwork, trigger notes, and acquisition routes.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <RouteTransitionLink
            href="/mega-evolutions"
            onMouseEnter={warmMegaFormsRoute}
            onFocus={warmMegaFormsRoute}
            onTouchStart={warmMegaFormsRoute}
            className="explorer-nav-btn pixel-font rounded-lg border border-black/20 bg-white/72 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-black/78 transition hover:bg-white/86"
          >
            Back to Mega Forms
          </RouteTransitionLink>
        </div>
      </section>

      <MegaStoneArchive
        selectedStone={selectedStone}
        highlightedStone={selectedStone}
        favoriteStoneNames={favoriteStoneNames}
        canToggleFavorite={favorites.isAuthenticated}
        onSelectStone={handleSelectStone}
        onToggleFavorite={handleToggleStoneFavorite}
      />
    </div>
  );

  const detailScreen = (
    <div
      ref={detailAnchorRef}
      className={cn("flex h-full min-h-0 flex-col gap-3", isSelectionJoltActive && "pokedex-jolt")}
    >
      {selectedStoneEntry ? (
        <aside className="flex h-full min-h-0 flex-col rounded-2xl border border-black/25 bg-white/70 p-4 shadow-[0_12px_24px_var(--theme-accent-soft)] backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/65">
              Detail Screen
            </p>
            <div className="flex items-center gap-1.5">
              <span className="rounded-lg border border-black/20 bg-white/75 px-2 py-1 text-xs text-black/66">
                {selectedStoneEntry.isStone ? "Stone" : "Protocol"}
              </span>
              <FavoriteStarButton
                favorite={{
                  entityType: "mega_stone",
                  entityId: selectedStoneEntry.itemName,
                  title: selectedStoneEntry.itemName,
                  href: "/mega-evolutions/stones",
                  imageUrl: selectedStoneEntry.imageSrc,
                  subtitle: `Category: ${selectedStoneEntry.category.replace(/-/g, " ")}`,
                  tags: [
                    "mega_stone",
                    ...selectedStoneEntry.linkedSpecies.map((species) => species.toLowerCase())
                  ]
                }}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-4">
              <div className="rounded-2xl border border-black/20 bg-white/55 p-3">
                <h2 className="pixel-font text-[12px] uppercase tracking-wide text-black/88">
                  {selectedStoneEntry.itemName}
                </h2>
                <p className="mt-1 text-xs text-black/62">
                  Category: {selectedStoneEntry.category.replace(/-/g, " ")}
                </p>

                <div className="mx-auto mt-3 flex h-[86px] w-[86px] items-center justify-center">
                  <Image
                    src={selectedStoneEntry.imageSrc}
                    alt={selectedStoneEntry.imageAlt}
                    width={80}
                    height={80}
                    loading="lazy"
                    sizes="80px"
                    unoptimized
                    className="h-20 w-20 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.32)] [image-rendering:-webkit-optimize-contrast]"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-black/20 bg-white/55 p-3">
                <p className="text-sm text-black/75">{selectedStoneEntry.description}</p>
                <div className="mt-2 grid gap-2 text-sm text-black/74">
                  <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                    Targets: {selectedStoneEntry.linkedSpecies.join(", ")}
                  </p>
                  <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                    Forms: {selectedStoneEntry.linkedMegaForms.join(", ")}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-black/20 bg-white/55 p-3">
                <p className="pixel-font mb-2 text-[10px] uppercase tracking-[0.14em] text-black/65">
                  How to obtain
                </p>
                <div className="space-y-2">
                  {selectedStoneEntry.acquisition.map((step) => (
                    <p
                      key={`${selectedStoneEntry.itemName}-${step}`}
                      className="rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/74"
                    >
                      {step}
                    </p>
                  ))}
                  {selectedStoneEntry.availabilityNote ? (
                    <p className="rounded-lg border border-black/20 bg-black/[0.05] px-3 py-2 text-xs text-black/66">
                      {selectedStoneEntry.availabilityNote}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-black/20 bg-white/55 p-3">
                <p className="pixel-font mb-2 text-[10px] uppercase tracking-[0.14em] text-black/65">
                  Linked Mega Forms
                </p>
                <div className="grid gap-2">
                  {selectedStoneEntry.linkedMegaSlugs.map((slug) => {
                    const linkedMega = MEGA_BY_SLUG.get(slug);
                    return (
                      <RouteTransitionLink
                        key={`${selectedStoneEntry.itemName}-${slug}`}
                        href={`/mega-evolutions/${slug}`}
                        className="rounded-lg border border-black/20 bg-white/72 px-3 py-2 text-sm text-black/76 transition hover:border-[var(--theme-accent)] hover:bg-[var(--theme-accent-soft)]"
                      >
                        {linkedMega?.megaName ?? slug}
                      </RouteTransitionLink>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </aside>
      ) : (
        <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-black/30 bg-white/35 p-4">
          <p className="pixel-font text-center text-[10px] uppercase tracking-[0.16em] text-black/60">
            Select a stone to open screen B
          </p>
        </div>
      )}
    </div>
  );

  return (
    <PokedexChassis
      title="Pokemon Mega Stone Deck"
      status="success"
      explorerScreen={explorerScreen}
      detailScreen={detailScreen}
      themeStyle={themeStyle}
    />
  );
}
