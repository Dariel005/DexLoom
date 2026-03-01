"use client";

import { useSession } from "next-auth/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { CreatorName } from "@/components/CreatorName";
import { MobileDexBottomNav } from "@/components/MobileDexBottomNav";
import { PokedexFrame } from "@/components/PokedexFrame";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import {
  formatFavoriteEntityLabel,
  getFavoriteEntityInsights,
  getFavoriteTagInsights,
  getRecentFavorites,
  sortFavoritesByCreatedAt
} from "@/lib/profile-insights";
import { type FavoriteEntityType, type FavoriteRecord } from "@/lib/profile-types";
import { resolveBulbagardenImageSrc } from "@/lib/remote-image";
import { cn } from "@/lib/utils";

type FavoriteSortMode = "newest" | "oldest" | "title_asc" | "title_desc";

function buildPokemonFallbackImageUrl(entityId: string) {
  const numericId = Number(entityId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${numericId}.png`;
}

function normalizeFavoriteImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) {
    return null;
  }
  return resolveBulbagardenImageSrc(
    imageUrl.replace("/sprites/items/dream-world/", "/sprites/items/")
  );
}

function resolveFavoriteImageUrl(entry: FavoriteRecord) {
  const normalized = normalizeFavoriteImageUrl(entry.imageUrl);
  if (normalized) {
    return normalized;
  }
  if (entry.entityType === "pokemon") {
    return buildPokemonFallbackImageUrl(entry.entityId);
  }
  return null;
}

function getFavoriteFallbackCode(entityType: FavoriteEntityType) {
  switch (entityType) {
    case "game":
      return "GM";
    case "pokemon":
      return "PK";
    case "item":
      return "IT";
    case "move":
      return "MV";
    case "ability":
      return "AB";
    case "type":
      return "TP";
    case "card":
      return "CD";
    case "character":
      return "CH";
    case "mega":
      return "MG";
    case "mega_stone":
      return "MS";
    case "map_region":
    case "location":
      return "MP";
    case "pokemon_go_activity":
    case "pokemon_go_item":
      return "GO";
    case "mechanics_topic":
      return "ME";
    default:
      return "ID";
  }
}

function formatRelativeDate(value: string | null | undefined) {
  if (!value) {
    return "unknown";
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "unknown";
  }

  const deltaMs = Date.now() - parsed;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (deltaMs < minute) return "just now";
  if (deltaMs < hour) return `${Math.max(1, Math.floor(deltaMs / minute))}m ago`;
  if (deltaMs < day) return `${Math.max(1, Math.floor(deltaMs / hour))}h ago`;
  if (deltaMs < day * 7) return `${Math.max(1, Math.floor(deltaMs / day))}d ago`;

  return new Date(parsed).toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
}

function sortFavorites(rows: FavoriteRecord[], mode: FavoriteSortMode) {
  if (mode === "newest") return sortFavoritesByCreatedAt(rows, "desc");
  if (mode === "oldest") return sortFavoritesByCreatedAt(rows, "asc");

  const sorted = rows.slice();
  sorted.sort((a, b) => {
    const left = a.title.toLowerCase();
    const right = b.title.toLowerCase();
    if (left === right) {
      return 0;
    }
    return mode === "title_desc" ? (left < right ? 1 : -1) : (left < right ? -1 : 1);
  });

  return sorted;
}

export function FavoritesHubClient() {
  const { data: session, status } = useSession();
  const favorites = useUserFavorites();
  const filterPanelRef = useRef<HTMLElement | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [entityFilter, setEntityFilter] = useState<FavoriteEntityType | "all">("all");
  const [sortMode, setSortMode] = useState<FavoriteSortMode>("newest");
  const [onlyArtwork, setOnlyArtwork] = useState(false);

  const entityInsights = useMemo(() => getFavoriteEntityInsights(favorites.items), [favorites.items]);
  const tagInsights = useMemo(() => getFavoriteTagInsights(favorites.items, 12), [favorites.items]);
  const recentFavorites = useMemo(() => getRecentFavorites(favorites.items, 8), [favorites.items]);

  const filteredFavorites = useMemo(() => {
    const query = searchInput.trim().toLowerCase();

    const filtered = favorites.items.filter((entry) => {
      if (entityFilter !== "all" && entry.entityType !== entityFilter) {
        return false;
      }
      if (onlyArtwork && !resolveFavoriteImageUrl(entry)) {
        return false;
      }
      if (!query) {
        return true;
      }

      return (
        entry.title.toLowerCase().includes(query) ||
        (entry.subtitle ?? "").toLowerCase().includes(query) ||
        entry.entityId.toLowerCase().includes(query) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });

    return sortFavorites(filtered, sortMode);
  }, [entityFilter, favorites.items, onlyArtwork, searchInput, sortMode]);

  const scrollToFilters = useCallback(() => {
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        filterPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 40);
    }
  }, []);

  if (status === "loading") {
    return (
      <main className="pokemon-detail-page favorites-mobile-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <div className="rounded-2xl border border-black/20 bg-white/65 p-4 text-sm text-black/75">Checking session...</div>
      </main>
    );
  }

  if (!session?.user?.id) {
    return (
      <main className="pokemon-detail-page favorites-mobile-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <PokedexFrame
          title="My Favorites"
          status="idle"
          className="favorites-mobile-frame"
          leftPanel={
            <section className="favorites-mobile-left space-y-4">
              <section className="profile-surface p-4">
                <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Favorites Hub</p>
                <h1 className="pixel-font mt-2 text-[14px] uppercase tracking-[0.12em] text-black/84">Sign in required</h1>
                <p className="mt-2 text-sm text-black/72">Sign in to manage your favorites across all modules.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <RouteTransitionLink href="/login" className="rounded-md border border-black/25 bg-white/80 px-3 py-2 text-xs text-black/75">Go to login</RouteTransitionLink>
                  <RouteTransitionLink href="/register" className="rounded-md border border-black/25 bg-white/80 px-3 py-2 text-xs text-black/75">Create account</RouteTransitionLink>
                </div>
              </section>
            </section>
          }
          rightPanel={
            <section className="favorites-mobile-right space-y-4">
              <section className="profile-surface p-4">
                <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Navigation</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <RouteTransitionLink href="/" className="rounded-md border border-black/25 bg-white/80 px-2.5 py-1 text-xs text-black/75">Back to Pokedex</RouteTransitionLink>
                </div>
              </section>
            </section>
          }
        />
      </main>
    );
  }

  const leftPanel = (
    <section className="favorites-mobile-left space-y-4">
      <section className="profile-surface profile-surface-hero favorites-hub-hero favorites-mobile-hero p-4">
        <p className="favorites-hub-title pixel-font text-[12px] uppercase tracking-[0.16em] text-black/70">Favorites Hub</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="favorites-hub-identity text-base text-black/74">
            Logged in as{" "}
            <CreatorName
              name={session.user.name ?? session.user.email ?? "Trainer"}
              isCreator={session.user.isCreator === true}
              role={session.user.role}
              compact
            />
          </p>
          <div className="favorites-hub-kpi-row flex flex-wrap items-center gap-2">
            <span className="favorites-hub-kpi favorites-hub-kpi-strong px-2.5 py-1 text-sm">
              {favorites.items.length} saved
            </span>
            <span className="favorites-hub-kpi px-2.5 py-1 text-sm">
              Queue: {favorites.queueSize}
            </span>
            <button
              type="button"
              onClick={() => {
                void favorites.flushQueue();
              }}
              disabled={favorites.queueSize === 0 || favorites.isSyncing}
              className={cn(
                "favorites-hub-sync-btn favorites-hub-sync-btn-primary px-3 py-1.5 text-sm transition",
                (favorites.queueSize === 0 || favorites.isSyncing) && "opacity-60"
              )}
            >
              {favorites.isSyncing ? "Syncing..." : "Sync now"}
            </button>
          </div>
        </div>

        {favorites.lastSyncError ? (
          <p className="mt-3 rounded-lg border border-rose-300 bg-rose-100/70 px-3 py-2 text-sm text-rose-900">
            {favorites.lastSyncError}
          </p>
        ) : null}
      </section>

      <section ref={filterPanelRef} className="profile-surface favorites-hub-list-panel favorites-mobile-list-panel p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <p className="pixel-font text-[12px] uppercase tracking-[0.16em] text-black/70">My Favorites</p>
          <p className="text-sm text-black/60">Showing {filteredFavorites.length} of {favorites.items.length}</p>
        </div>

        <div className="profile-control-grid mt-2">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search title, subtitle, id, or tag..."
            className="favorites-hub-control px-3 py-2 text-sm"
          />
          <select
            value={entityFilter}
            onChange={(event) => setEntityFilter((event.target.value as FavoriteEntityType | "all") ?? "all")}
            className="favorites-hub-control px-3 py-2 text-sm"
          >
            <option value="all">All modules</option>
            {Array.from(new Set(favorites.items.map((entry) => entry.entityType))).sort().map((entity) => (
              <option key={`favorites-filter-${entity}`} value={entity}>{formatFavoriteEntityLabel(entity)}</option>
            ))}
          </select>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as FavoriteSortMode)}
            className="favorites-hub-control px-3 py-2 text-sm"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title_asc">Title A-Z</option>
            <option value="title_desc">Title Z-A</option>
          </select>
          <label className="favorites-hub-toggle flex items-center gap-2 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={onlyArtwork}
              onChange={(event) => setOnlyArtwork(event.target.checked)}
              className="favorites-hub-toggle-input h-4 w-4"
            />
            Artwork only
          </label>
        </div>

        {filteredFavorites.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-4 text-sm text-black/64">
            No favorites match this filter.
          </p>
        ) : (
          <div className="pokemon-scrollbar favorites-hub-scroll mt-3 max-h-[68vh] space-y-2 overflow-y-auto pr-1">
            {filteredFavorites.map((entry) => {
              const resolvedImageUrl = resolveFavoriteImageUrl(entry);
              return (
                <article key={`favorites-entry-${entry.id}`} className="profile-favorite-card favorites-hub-entry">
                  <div className="profile-favorite-card-grid">
                    <RouteTransitionLink
                      href={entry.href}
                      className="profile-favorite-thumb favorites-hub-thumb block transition hover:brightness-105"
                      aria-label={`Open ${entry.title}`}
                    >
                      {resolvedImageUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={resolvedImageUrl} alt={`${entry.title} artwork`} loading="lazy" className="favorites-hub-thumb-image h-full w-full object-contain" />
                        </>
                      ) : (
                        <div className="profile-favorite-thumb-fallback favorites-hub-thumb-fallback">
                          <span className="pixel-font text-[9px] uppercase tracking-[0.12em] text-black/55">No art</span>
                        </div>
                      )}
                    </RouteTransitionLink>

                    <RouteTransitionLink
                      href={entry.href}
                      className="favorites-hub-entry-main min-w-0 rounded-md px-0.5 py-0.5 transition"
                      aria-label={`Open ${entry.title}`}
                    >
                      <p className="pixel-font truncate text-[12px] uppercase tracking-[0.12em] text-black/82">{entry.title}</p>
                      <p className="mt-1 text-sm text-black/62">
                        {formatFavoriteEntityLabel(entry.entityType)}
                        {entry.subtitle ? ` | ${entry.subtitle}` : ""}
                      </p>
                      <p className="mt-1 text-[13px] text-black/54">Captured {formatRelativeDate(entry.createdAt)}</p>
                    </RouteTransitionLink>

                    <div className="flex flex-col items-end gap-1.5">
                      <RouteTransitionLink href={entry.href} className="favorites-hub-open-btn px-2 py-1 text-sm">Open</RouteTransitionLink>
                      <button
                        type="button"
                        onClick={() => {
                          favorites.toggleFavorite({
                            entityType: entry.entityType,
                            entityId: entry.entityId,
                            title: entry.title,
                            href: entry.href,
                            imageUrl: resolvedImageUrl,
                            subtitle: entry.subtitle,
                            tags: entry.tags
                          });
                        }}
                        data-active="true"
                        aria-pressed="true"
                        className="favorite-star-btn inline-flex h-8 w-8 items-center justify-center text-sm transition-all duration-200 active:scale-[0.96]"
                        aria-label={`Remove ${entry.title} from favorites`}
                      >
                        <span className="favorite-star-icon">{"\u2605"}</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );

  const rightPanel = (
    <section className="favorites-mobile-right space-y-4">
      <section className="profile-surface profile-side-panel favorites-mobile-nav-panel p-4">
        <p className="pixel-font text-[11px] uppercase tracking-[0.16em] text-black/70">Navigation</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <RouteTransitionLink href="/" className="profile-side-nav-link px-2.5 py-1 text-sm">Back to Pokedex</RouteTransitionLink>
          <RouteTransitionLink href="/profile/me" className="profile-side-nav-link px-2.5 py-1 text-sm">My profile</RouteTransitionLink>
          <RouteTransitionLink href="/social" className="profile-side-nav-link px-2.5 py-1 text-sm">Social</RouteTransitionLink>
        </div>
      </section>

      <section className="profile-surface profile-side-panel favorites-mobile-radar-panel p-4">
        <p className="pixel-font text-[11px] uppercase tracking-[0.16em] text-black/70">Module Radar</p>
        <div className="mt-2 space-y-2">
          {entityInsights.length === 0 ? (
            <p className="rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-sm text-black/62">
              No module activity yet.
            </p>
          ) : (
            entityInsights.slice(0, 8).map((entry) => (
              <div key={`favorites-radar-${entry.entityType}`} className="profile-signal-row">
                <div className="flex items-center justify-between text-sm text-black/70"><span>{entry.label}</span><span>{entry.count}</span></div>
                <div className="profile-signal-track"><span className="profile-signal-fill" style={{ width: `${Math.max(10, Math.round(entry.ratio * 100))}%` }} /></div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="profile-surface profile-side-panel favorites-mobile-tags-panel p-4">
        <p className="pixel-font text-[11px] uppercase tracking-[0.16em] text-black/70">Top Tags</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tagInsights.length === 0 ? (
            <p className="rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-sm text-black/62">No tags indexed yet.</p>
          ) : (
            tagInsights.map((entry) => (
              <span key={`favorites-tag-${entry.tag}`} className="profile-tag-chip">{entry.tag} x{entry.count}</span>
            ))
          )}
        </div>
      </section>

      <section className="profile-surface profile-side-panel favorites-mobile-captures-panel p-4">
        <p className="pixel-font text-[11px] uppercase tracking-[0.16em] text-black/70">Recent Captures</p>
        <div className="profile-side-capture-list mt-2 space-y-2">
          {recentFavorites.length === 0 ? (
            <p className="rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-sm text-black/62">No captures yet.</p>
          ) : (
            recentFavorites.map((entry) => (
              <RouteTransitionLink
                key={`favorites-recent-${entry.id}`}
                href={entry.href}
                className="profile-side-capture-card"
                aria-label={`Open ${entry.title}`}
              >
                <div className="profile-side-capture-thumb">
                  {resolveFavoriteImageUrl(entry) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveFavoriteImageUrl(entry) ?? undefined}
                      alt={`${entry.title} preview`}
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="profile-side-capture-fallback" data-entity={entry.entityType}>
                      {getFavoriteFallbackCode(entry.entityType)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="pixel-font truncate text-[11px] uppercase tracking-[0.11em] text-black/82">{entry.title}</p>
                  <p className="mt-0.5 truncate text-[13px] text-black/62">{formatFavoriteEntityLabel(entry.entityType)} | {formatRelativeDate(entry.createdAt)}</p>
                </div>
              </RouteTransitionLink>
            ))
          )}
        </div>
      </section>
    </section>
  );

  return (
    <>
      <main className="pokemon-detail-page favorites-mobile-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <PokedexFrame
          title="My Favorites"
          status={favorites.isReady ? "success" : "loading"}
          leftPanel={leftPanel}
          rightPanel={rightPanel}
          className="favorites-mobile-frame"
        />
      </main>
      <MobileDexBottomNav
        activeKey="favorites"
        className="favorites-mobile-bottom-nav"
        onSettings={scrollToFilters}
      />
    </>
  );
}
