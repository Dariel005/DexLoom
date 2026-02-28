"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreatorName } from "@/components/CreatorName";
import { PokedexFrame } from "@/components/PokedexFrame";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { ProfileAvatarLightbox } from "@/components/profile/ProfileAvatarLightbox";
import {
  formatFavoriteEntityLabel,
  getFavoriteEntityInsights,
  getFavoriteTagInsights,
  getRecentFavorites,
  sortFavoritesByCreatedAt
} from "@/lib/profile-insights";
import {
  type FavoriteEntityType,
  type FavoriteListResult,
  type FavoriteRecord,
  type UserProfileRecord
} from "@/lib/profile-types";
import { resolveBulbagardenImageSrc } from "@/lib/remote-image";
import { type FriendshipRelationView } from "@/lib/social-types";
import { resolveAvatarSrc } from "@/lib/avatar-url";
import { cn } from "@/lib/utils";

interface ProfilePublicClientProps {
  profileId: string;
}

type FavoriteSortMode = "newest" | "oldest" | "title_asc" | "title_desc";

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
  if (mode === "newest") {
    return sortFavoritesByCreatedAt(rows, "desc");
  }
  if (mode === "oldest") {
    return sortFavoritesByCreatedAt(rows, "asc");
  }

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

function formatRelationLabel(status: FriendshipRelationView["relationStatus"]) {
  if (status === "friends") return "Friends";
  if (status === "incoming_pending") return "Incoming request";
  if (status === "outgoing_pending") return "Request sent";
  if (status === "blocked_by_you") return "Blocked by you";
  if (status === "blocked_you") return "Blocked you";
  if (status === "self") return "Your profile";
  return "No friendship yet";
}

export function ProfilePublicClient({ profileId }: ProfilePublicClientProps) {
  const { data: session } = useSession();
  const viewerId = session?.user?.id ?? null;
  const isSelfView = viewerId === profileId;
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [entityFilter, setEntityFilter] = useState<FavoriteEntityType | "all">("all");
  const [sortMode, setSortMode] = useState<FavoriteSortMode>("newest");
  const [onlyArtwork, setOnlyArtwork] = useState(false);
  const [friendRelation, setFriendRelation] = useState<FriendshipRelationView | null>(null);
  const [isLoadingFriendRelation, setIsLoadingFriendRelation] = useState(false);
  const [isFriendActionPending, setIsFriendActionPending] = useState(false);
  const [friendErrorMessage, setFriendErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [favoritesHiddenByBlock, setFavoritesHiddenByBlock] = useState(false);
  const [isAvatarLightboxOpen, setIsAvatarLightboxOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(
          `/api/profile/${encodeURIComponent(profileId)}?includeFavorites=1`
        );
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Profile is private or unavailable.");
          }
          throw new Error("Unable to load trainer profile.");
        }

        const payload = (await response.json()) as {
          profile: UserProfileRecord;
          favorites: FavoriteListResult;
          favoritesHiddenByBlock?: boolean;
        };
        if (cancelled) {
          return;
        }

        setProfile(payload.profile);
        setFavorites(payload.favorites?.items ?? []);
        setFavoritesHiddenByBlock(payload.favoritesHiddenByBlock === true);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load profile.");
          setProfile(null);
          setFavorites([]);
          setFavoritesHiddenByBlock(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const loadFriendRelation = useCallback(async () => {
    if (!viewerId || isSelfView) {
      setFriendRelation(null);
      setFriendErrorMessage(null);
      return;
    }

    setIsLoadingFriendRelation(true);
    setFriendErrorMessage(null);

    try {
      const response = await fetch(`/api/friends/status?userId=${encodeURIComponent(profileId)}`);
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message ?? "Unable to load friendship status.");
      }

      const relation = (await response.json()) as FriendshipRelationView;
      setFriendRelation(relation);
    } catch (error) {
      setFriendRelation(null);
      setFriendErrorMessage(error instanceof Error ? error.message : "Unable to load friendship status.");
    } finally {
      setIsLoadingFriendRelation(false);
    }
  }, [isSelfView, profileId, viewerId]);

  useEffect(() => {
    void loadFriendRelation();
  }, [loadFriendRelation]);

  const handleFriendAction = useCallback(
    async (payload: {
      action: "request" | "accept" | "reject" | "cancel" | "remove";
      relationId?: string | null;
      targetUserId?: string | null;
    }) => {
      if (!viewerId || isSelfView) {
        return;
      }

      setIsFriendActionPending(true);
      setFriendErrorMessage(null);

      try {
        const response = await fetch("/api/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(errorPayload.message ?? "Unable to process friendship action.");
        }

        const result = (await response.json()) as { relation?: FriendshipRelationView };
        if (result.relation) {
          setFriendRelation(result.relation);
        } else {
          await loadFriendRelation();
        }
      } catch (error) {
        setFriendErrorMessage(error instanceof Error ? error.message : "Unable to process friendship action.");
      } finally {
        setIsFriendActionPending(false);
      }
    },
    [isSelfView, loadFriendRelation, viewerId]
  );

  const openAvatarLightbox = useCallback(() => {
    setIsAvatarLightboxOpen(true);
  }, []);

  const closeAvatarLightbox = useCallback(() => {
    setIsAvatarLightboxOpen(false);
  }, []);

  const currentRelationStatus = friendRelation?.relationStatus ?? "none";
  const currentRelationId = friendRelation?.relationId ?? null;
  const hasBlockedSocialInteraction =
    favoritesHiddenByBlock ||
    currentRelationStatus === "blocked_by_you" ||
    currentRelationStatus === "blocked_you";
  const avatarPreviewSrc = resolveAvatarSrc(profile?.avatarUrl) ?? "/images/characters/red.svg";

  const entityInsights = useMemo(() => getFavoriteEntityInsights(favorites), [favorites]);
  const tagInsights = useMemo(() => getFavoriteTagInsights(favorites, 10), [favorites]);
  const recentFavorites = useMemo(() => getRecentFavorites(favorites, 6), [favorites]);

  const filteredFavorites = useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    const filtered = favorites.filter((entry) => {
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
  }, [entityFilter, favorites, onlyArtwork, searchInput, sortMode]);

  const leftPanel = (
    <section className="profile-theme-matrix space-y-4">
      {isLoading ? (
        <section className="profile-theme-banner rounded-2xl border border-black/20 bg-white/65 p-4 text-sm text-black/74">
          Loading trainer profile...
        </section>
      ) : null}

      {errorMessage ? (
        <section className="profile-theme-banner rounded-2xl border border-rose-300 bg-rose-100/70 p-4 text-sm text-rose-900">
          {errorMessage}
        </section>
      ) : null}

      {profile ? (
        <>
          <section className="profile-surface profile-surface-hero profile-trainer-profile-card p-4">
            <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
              Trainer Public Profile
            </p>
            <div className="profile-hero-grid profile-trainer-profile-grid mt-3">
              <div className="profile-avatar-column">
                <button
                  type="button"
                  className="profile-avatar-zoom-trigger"
                  onClick={openAvatarLightbox}
                  aria-label="Open profile avatar preview"
                >
                  <div className="profile-avatar-shell h-36 w-36">
                    <Image
                      src={avatarPreviewSrc}
                      alt={`${profile.displayName} avatar`}
                      fill
                      sizes="144px"
                      className="object-cover"
                    />
                  </div>
                </button>
              </div>

              <div className="profile-trainer-info-stack space-y-3">
                <CreatorName
                  name={profile.displayName}
                  isCreator={profile.isCreator === true}
                  role={profile.role}
                  className="pixel-font text-[15px] uppercase tracking-[0.12em] text-black/84"
                />
                <p className="profile-identity-bio profile-trainer-bio text-sm text-black/74">{profile.bio || "No bio available."}</p>
                <div className="profile-metric-grid">
                  <div className="profile-metric-tile">
                    <span className="profile-metric-label">Favorites</span>
                    <span className="profile-metric-value">{favorites.length}</span>
                  </div>
                  <div className="profile-metric-tile">
                    <span className="profile-metric-label">Modules</span>
                    <span className="profile-metric-value">{entityInsights.length}</span>
                  </div>
                  <div className="profile-metric-tile">
                    <span className="profile-metric-label">Visibility</span>
                    <span className="profile-metric-value text-[10px]">{profile.visibility}</span>
                  </div>
                  <div className="profile-metric-tile">
                    <span className="profile-metric-label">Favorites Public</span>
                    <span className="profile-metric-value text-[10px]">
                      {profile.showFavoritesOnPublic ? "enabled" : "disabled"}
                    </span>
                  </div>
                </div>

                {viewerId && !isSelfView ? (
                  <div className="profile-social-actions-card rounded-xl border border-black/20 bg-white/74 px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-black/72">
                        Friendship
                      </p>
                      <span className="profile-social-status rounded-md border border-black/20 bg-white/85 px-2 py-0.5 text-[10px] text-black/65">
                        {isLoadingFriendRelation ? "Checking..." : formatRelationLabel(currentRelationStatus)}
                      </span>
                    </div>

                    <div className="profile-trainer-action-grid mt-2">
                      {!hasBlockedSocialInteraction && currentRelationStatus === "none" ? (
                        <button
                          type="button"
                          onClick={() => {
                            void handleFriendAction({ action: "request", targetUserId: profileId });
                          }}
                          disabled={isFriendActionPending || isLoadingFriendRelation}
                          className={cn(
                            "profile-trainer-action-btn profile-trainer-action-green",
                            (isFriendActionPending || isLoadingFriendRelation) && "opacity-60"
                          )}
                        >
                          Add friend
                        </button>
                      ) : null}

                      {!hasBlockedSocialInteraction && currentRelationStatus === "incoming_pending" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              void handleFriendAction({ action: "accept", relationId: currentRelationId });
                            }}
                            disabled={!currentRelationId || isFriendActionPending || isLoadingFriendRelation}
                            className={cn(
                              "profile-trainer-action-btn profile-trainer-action-green",
                              (!currentRelationId || isFriendActionPending || isLoadingFriendRelation) && "opacity-60"
                            )}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void handleFriendAction({ action: "reject", relationId: currentRelationId });
                            }}
                            disabled={!currentRelationId || isFriendActionPending || isLoadingFriendRelation}
                            className={cn(
                              "profile-trainer-action-btn profile-trainer-action-red",
                              (!currentRelationId || isFriendActionPending || isLoadingFriendRelation) && "opacity-60"
                            )}
                          >
                            Reject
                          </button>
                        </>
                      ) : null}

                      {!hasBlockedSocialInteraction && currentRelationStatus === "outgoing_pending" ? (
                        <button
                          type="button"
                          onClick={() => {
                            void handleFriendAction({ action: "cancel", relationId: currentRelationId });
                          }}
                          disabled={!currentRelationId || isFriendActionPending || isLoadingFriendRelation}
                          className={cn(
                            "profile-trainer-action-btn profile-trainer-action-amber",
                            (!currentRelationId || isFriendActionPending || isLoadingFriendRelation) && "opacity-60"
                          )}
                        >
                          Cancel request
                        </button>
                      ) : null}

                      {!hasBlockedSocialInteraction && currentRelationStatus === "friends" ? (
                        <button
                          type="button"
                          onClick={() => {
                            void handleFriendAction({ action: "remove", relationId: currentRelationId });
                          }}
                          disabled={!currentRelationId || isFriendActionPending || isLoadingFriendRelation}
                          className={cn(
                            "profile-trainer-action-btn profile-trainer-action-red",
                            (!currentRelationId || isFriendActionPending || isLoadingFriendRelation) && "opacity-60"
                          )}
                        >
                          Remove friend
                        </button>
                      ) : null}
                    </div>

                    {hasBlockedSocialInteraction ? (
                      <p className="mt-2 rounded-md border border-amber-300 bg-amber-100/70 px-2.5 py-1.5 text-xs text-amber-900">
                        Social actions are unavailable because one account blocked the other.
                      </p>
                    ) : null}

                    {friendErrorMessage ? (
                      <p className="mt-2 rounded-md border border-rose-300 bg-rose-100/70 px-2.5 py-1.5 text-xs text-rose-900">
                        {friendErrorMessage}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="profile-surface p-4">
            <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
              Public Favorites
            </p>
            {favoritesHiddenByBlock ? (
              <p className="mt-3 rounded-lg border border-amber-300 bg-amber-100/70 px-3 py-4 text-sm text-amber-900">
                Favorites are hidden due to a social block between these accounts.
              </p>
            ) : !profile.showFavoritesOnPublic ? (
              <p className="mt-3 rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-4 text-sm text-black/64">
                This trainer keeps favorites private.
              </p>
            ) : favorites.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-4 text-sm text-black/64">
                No public favorites yet.
              </p>
            ) : (
              <div className="profile-control-grid mt-2">
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search public favorites..."
                  className="rounded-lg border border-black/20 bg-white/80 px-3 py-2 text-sm text-black/78"
                />
                <select
                  value={entityFilter}
                  onChange={(event) =>
                    setEntityFilter((event.target.value as FavoriteEntityType | "all") ?? "all")
                  }
                  className="rounded-lg border border-black/20 bg-white/80 px-3 py-2 text-sm text-black/78"
                >
                  <option value="all">All modules</option>
                  {Array.from(new Set(favorites.map((entry) => entry.entityType)))
                    .sort()
                    .map((entity) => (
                      <option key={`public-filter-${entity}`} value={entity}>
                        {formatFavoriteEntityLabel(entity)}
                      </option>
                    ))}
                </select>
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as FavoriteSortMode)}
                  className="rounded-lg border border-black/20 bg-white/80 px-3 py-2 text-sm text-black/78"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title_asc">Title A-Z</option>
                  <option value="title_desc">Title Z-A</option>
                </select>
                <label className="flex items-center gap-2 rounded-lg border border-black/20 bg-white/80 px-3 py-2 text-xs text-black/74">
                  <input
                    type="checkbox"
                    checked={onlyArtwork}
                    onChange={(event) => setOnlyArtwork(event.target.checked)}
                    className="h-4 w-4"
                  />
                  Artwork only
                </label>
              </div>
            )}

            {!favoritesHiddenByBlock && profile.showFavoritesOnPublic && filteredFavorites.length > 0 ? (
              <div className="pokemon-scrollbar mt-3 max-h-[62vh] sm:max-h-[68vh] lg:max-h-[72vh] space-y-2 overflow-y-auto pr-1">
                {filteredFavorites.map((entry) => {
                  const resolvedImageUrl = resolveFavoriteImageUrl(entry);
                  return (
                    <article key={`public-favorite-${entry.id}`} className="profile-favorite-card">
                      <div className="profile-favorite-card-grid">
                        <RouteTransitionLink
                          href={entry.href}
                          className="profile-favorite-thumb block transition hover:brightness-105"
                          aria-label={`Open ${entry.title}`}
                        >
                          {resolvedImageUrl ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={resolvedImageUrl}
                                alt={`${entry.title} artwork`}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            </>
                          ) : (
                            <div className="profile-favorite-thumb-fallback">
                              <span className="pixel-font text-[8px] uppercase tracking-[0.12em] text-black/55">
                                No art
                              </span>
                            </div>
                          )}
                        </RouteTransitionLink>
                        <RouteTransitionLink
                          href={entry.href}
                          className="min-w-0 rounded-md px-0.5 py-0.5 transition hover:bg-white/55"
                          aria-label={`Open ${entry.title}`}
                        >
                          <p className="pixel-font truncate text-[10px] uppercase tracking-[0.12em] text-black/82">
                            {entry.title}
                          </p>
                          {entry.subtitle ? (
                            <p className="mt-1 text-xs text-black/62">{entry.subtitle}</p>
                          ) : null}
                          <p className="mt-1 text-[11px] text-black/54">
                            {formatFavoriteEntityLabel(entry.entityType)} | {formatRelativeDate(entry.createdAt)}
                          </p>
                        </RouteTransitionLink>
                        <RouteTransitionLink
                          href={entry.href}
                          className="self-start rounded-md border border-black/20 bg-white/82 px-2 py-1 text-xs text-black/74"
                        >
                          Open
                        </RouteTransitionLink>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </section>
  );

  const rightPanel = (
    <section className="profile-theme-matrix space-y-4">
      <section className="profile-surface profile-side-panel p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Navigation
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <RouteTransitionLink
            href="/"
            className="rounded-md border border-black/25 bg-white/80 px-2.5 py-1 text-xs text-black/75"
          >
            Back to Pokedex
          </RouteTransitionLink>
          <RouteTransitionLink
            href="/profile/me"
            className="rounded-md border border-black/25 bg-white/80 px-2.5 py-1 text-xs text-black/75"
          >
            My profile
          </RouteTransitionLink>
          <RouteTransitionLink
            href="/favorites"
            className="rounded-md border border-black/25 bg-white/80 px-2.5 py-1 text-xs text-black/75"
          >
            Favorites
          </RouteTransitionLink>
          <RouteTransitionLink
            href="/social"
            className="rounded-md border border-black/25 bg-white/80 px-2.5 py-1 text-xs text-black/75"
          >
            Social
          </RouteTransitionLink>
        </div>
      </section>

      <section className="profile-surface profile-side-panel p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Viewer Status
        </p>
        <p className="mt-2 text-sm text-black/74">
          {session?.user ? (
            <>
              Signed in as{" "}
              <CreatorName
                name={session.user.name ?? session.user.email ?? "Trainer"}
                isCreator={session.user.isCreator === true}
                role={session.user.role}
                compact
              />
            </>
          ) : (
            "Viewing as guest"
          )}
        </p>
      </section>

      <section className="profile-surface p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Module Radar
        </p>
        <div className="mt-2 space-y-2">
          {entityInsights.length === 0 ? (
            <p className="rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-xs text-black/62">
              No public module activity.
            </p>
          ) : (
            entityInsights.slice(0, 6).map((entry) => (
              <div key={`public-radar-${entry.entityType}`} className="profile-signal-row">
                <div className="flex items-center justify-between text-xs text-black/70">
                  <span>{entry.label}</span>
                  <span>{entry.count}</span>
                </div>
                <div className="profile-signal-track">
                  <span
                    className="profile-signal-fill"
                    style={{ width: `${Math.max(10, Math.round(entry.ratio * 100))}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="profile-surface p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Top Tags
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tagInsights.length === 0 ? (
            <p className="rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-xs text-black/62">
              No tags available.
            </p>
          ) : (
            tagInsights.map((entry) => (
              <span key={`public-tag-${entry.tag}`} className="profile-tag-chip">
                {entry.tag} x{entry.count}
              </span>
            ))
          )}
        </div>
      </section>

      <section className="profile-surface p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Recent Captures
        </p>
        <div className="mt-2 space-y-1.5">
          {recentFavorites.length === 0 ? (
            <p className="rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-xs text-black/62">
              No captures yet.
            </p>
          ) : (
            recentFavorites.map((entry) => (
              <article
                key={`public-recent-${entry.id}`}
                className="rounded-lg border border-black/20 bg-white/76 px-2.5 py-2"
              >
                <RouteTransitionLink href={entry.href} className="block rounded-sm transition hover:opacity-80">
                  <p className="pixel-font truncate text-[9px] uppercase tracking-[0.11em] text-black/82">
                    {entry.title}
                  </p>
                </RouteTransitionLink>
                <p className="mt-0.5 text-[11px] text-black/62">
                  {formatFavoriteEntityLabel(entry.entityType)} | {formatRelativeDate(entry.createdAt)}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );

  return (
    <>
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <PokedexFrame
          title={profile ? `${profile.displayName} - Trainer Profile` : "Trainer Profile"}
          status={isLoading ? "loading" : errorMessage ? "error" : "success"}
          leftPanel={leftPanel}
          rightPanel={rightPanel}
        />
      </main>
      <ProfileAvatarLightbox
        open={isAvatarLightboxOpen}
        src={avatarPreviewSrc}
        alt={profile ? `${profile.displayName} avatar` : "Trainer avatar"}
        onClose={closeAvatarLightbox}
      />
    </>
  );
}

