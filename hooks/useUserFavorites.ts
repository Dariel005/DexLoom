"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type FavoriteEntityType,
  type FavoriteListResult,
  type FavoriteRecord,
  type FavoriteUpsertInput
} from "@/lib/profile-types";
import { buildFavoriteId } from "@/lib/profile-validation";
import {
  applyFavoriteRemove,
  applyFavoriteUpsert,
  buildAddQueueOperation,
  buildRemoveQueueOperation,
  loadFavoriteItemsForUser,
  loadFavoriteQueueForUser,
  mergeQueueOperation,
  replayFavoriteQueue,
  saveFavoriteStateForUser,
  type FavoriteQueueOperation
} from "@/store/user-favorites-store";

const LEGACY_POKEMON_KEY = "pokedex.favorite.ids";
const LEGACY_MEGA_KEY = "pokedex.favorite.mega-slugs";

function toTitleFromSlug(slug: string) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function migrateLegacyFavorites(userId: string | null) {
  if (typeof window === "undefined") {
    return [] as FavoriteRecord[];
  }

  if (!userId) {
    return [] as FavoriteRecord[];
  }

  const owner = userId;
  const migrated: FavoriteRecord[] = [];
  const now = new Date().toISOString();

  try {
    const rawPokemon = window.localStorage.getItem(LEGACY_POKEMON_KEY);
    const parsedPokemon = rawPokemon ? (JSON.parse(rawPokemon) as unknown) : [];
    if (Array.isArray(parsedPokemon)) {
      parsedPokemon.forEach((entry) => {
        const numericId = Number(entry);
        if (!Number.isInteger(numericId) || numericId <= 0) {
          return;
        }
        const entityId = String(numericId);
        migrated.push({
          id: buildFavoriteId("pokemon", entityId),
          userId: owner,
          entityType: "pokemon",
          entityId,
          title: `Pokemon #${entityId.padStart(4, "0")}`,
          href: `/pokemon/${entityId}`,
          imageUrl: null,
          subtitle: "Legacy favorite",
          tags: ["pokemon", "legacy"],
          createdAt: now
        });
      });
    }
  } catch {
    // Ignore malformed legacy payload.
  }

  try {
    const rawMega = window.localStorage.getItem(LEGACY_MEGA_KEY);
    const parsedMega = rawMega ? (JSON.parse(rawMega) as unknown) : [];
    if (Array.isArray(parsedMega)) {
      parsedMega.forEach((entry) => {
        const slug = String(entry ?? "").trim().toLowerCase();
        if (!slug) {
          return;
        }
        migrated.push({
          id: buildFavoriteId("mega", slug),
          userId: owner,
          entityType: "mega",
          entityId: slug,
          title: toTitleFromSlug(slug),
          href: `/mega-evolutions/${slug}`,
          imageUrl: null,
          subtitle: "Legacy favorite",
          tags: ["mega", "legacy"],
          createdAt: now
        });
      });
    }
  } catch {
    // Ignore malformed legacy payload.
  }

  if (migrated.length > 0) {
    try {
      window.localStorage.removeItem(LEGACY_POKEMON_KEY);
      window.localStorage.removeItem(LEGACY_MEGA_KEY);
    } catch {
      // Ignore storage write failures.
    }
  }

  const dedupeMap = new Map<string, FavoriteRecord>();
  migrated.forEach((record) => {
    dedupeMap.set(record.id, record);
  });
  return Array.from(dedupeMap.values());
}

function mergeById(records: FavoriteRecord[]) {
  const map = new Map<string, FavoriteRecord>();
  records.forEach((record) => {
    map.set(record.id, record);
  });
  return Array.from(map.values()).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function useUserFavorites() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const isAuthenticated = Boolean(userId);
  const userKey = userId ?? "";
  const [items, setItems] = useState<FavoriteRecord[]>([]);
  const [queueOps, setQueueOps] = useState<FavoriteQueueOperation[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasLoadedServerState, setHasLoadedServerState] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const hydrationDoneRef = useRef(false);
  const queueRef = useRef<FavoriteQueueOperation[]>([]);
  queueRef.current = queueOps;

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setQueueOps([]);
      setIsReady(true);
      setHasLoadedServerState(false);
      setLastSyncError(null);
      return;
    }

    const persistedItems = loadFavoriteItemsForUser(userKey);
    const persistedQueue = loadFavoriteQueueForUser(userKey);

    let mergedItems = persistedItems;
    let mergedQueue = persistedQueue;

    if (mergedItems.length === 0 && !hydrationDoneRef.current) {
      const migrated = migrateLegacyFavorites(userId);
      if (migrated.length > 0) {
        mergedItems = mergeById([...mergedItems, ...migrated]);
      }
      hydrationDoneRef.current = true;
    }

    setItems(mergedItems);
    setQueueOps(mergedQueue);
    setIsReady(true);
    setHasLoadedServerState(false);
  }, [userId, userKey]);

  useEffect(() => {
    if (!isReady || !userId) {
      return;
    }

    saveFavoriteStateForUser({
      userKey,
      items,
      queueOps
    });
  }, [isReady, items, queueOps, userId, userKey]);

  const flushQueue = useCallback(async () => {
    if (!userId || queueRef.current.length === 0 || isSyncing) {
      return;
    }

    setIsSyncing(true);
    setLastSyncError(null);
    const opsPayload = queueRef.current.map((op) => {
      if (op.op === "add" && op.item) {
        return { op: "add", item: op.item };
      }
      return {
        op: "remove",
        entityType: op.entityType,
        entityId: op.entityId
      };
    });

    try {
      const response = await fetch("/api/favorites/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ops: opsPayload })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message ?? "Unable to sync favorites.");
      }

      setQueueOps([]);
    } catch (error) {
      setLastSyncError(error instanceof Error ? error.message : "Unable to sync favorites.");
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, userId]);

  useEffect(() => {
    if (!isReady || !userId || hasLoadedServerState) {
      return;
    }

    let cancelled = false;
    const loadServer = async () => {
      try {
        const response = await fetch("/api/favorites?limit=500", {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });
        if (!response.ok) {
          throw new Error("Unable to load favorites.");
        }
        const payload = (await response.json()) as FavoriteListResult;
        if (cancelled) {
          return;
        }
        const serverItems = Array.isArray(payload.items) ? payload.items : [];
        const optimisticItems = replayFavoriteQueue(serverItems, queueRef.current, userId);
        setItems(mergeById(optimisticItems));
        setHasLoadedServerState(true);
      } catch {
        if (!cancelled) {
          setHasLoadedServerState(true);
        }
      }
    };

    void loadServer();
    return () => {
      cancelled = true;
    };
  }, [hasLoadedServerState, isReady, userId]);

  useEffect(() => {
    if (!isReady || !userId || queueOps.length === 0) {
      return;
    }

    const canFlushNow = () =>
      typeof document === "undefined" || document.visibilityState === "visible";

    const intervalId = window.setInterval(() => {
      if (!canFlushNow()) {
        return;
      }
      void flushQueue();
    }, 12000);

    const onOnline = () => {
      void flushQueue();
    };
    const onFocus = () => {
      void flushQueue();
    };
    const onVisibilityChange = () => {
      if (!canFlushNow()) {
        return;
      }
      void flushQueue();
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [flushQueue, isReady, queueOps.length, userId]);

  const isFavorite = useCallback(
    (entityType: FavoriteEntityType, entityId: string) => {
      if (!userId) {
        return false;
      }
      const targetId = buildFavoriteId(entityType, entityId);
      return items.some((entry) => entry.id === targetId);
    },
    [items, userId]
  );

  const upsertFavorite = useCallback(
    (input: FavoriteUpsertInput) => {
      if (!userId) {
        return;
      }
      const owner = userId;
      setItems((current) => applyFavoriteUpsert(current, owner, input));
      setQueueOps((current) => mergeQueueOperation(current, buildAddQueueOperation(input)));
    },
    [userId]
  );

  const removeFavorite = useCallback(
    (entityType: FavoriteEntityType, entityId: string) => {
      if (!userId) {
        return;
      }
      setItems((current) => applyFavoriteRemove(current, entityType, entityId));
      setQueueOps((current) =>
        mergeQueueOperation(current, buildRemoveQueueOperation(entityType, entityId))
      );
    },
    [userId]
  );

  const toggleFavorite = useCallback(
    (input: FavoriteUpsertInput) => {
      if (!userId) {
        return false;
      }

      if (isFavorite(input.entityType, input.entityId)) {
        removeFavorite(input.entityType, input.entityId);
        return false;
      }

      upsertFavorite(input);
      return true;
    },
    [isFavorite, removeFavorite, upsertFavorite, userId]
  );

  const favoritesByType = useMemo(() => {
    return items.reduce<Record<string, FavoriteRecord[]>>((acc, entry) => {
      if (!acc[entry.entityType]) {
        acc[entry.entityType] = [];
      }
      acc[entry.entityType].push(entry);
      return acc;
    }, {});
  }, [items]);

  return {
    items,
    favoritesByType,
    queueSize: queueOps.length,
    isReady,
    isSyncing,
    isAuthenticated,
    lastSyncError,
    isFavorite,
    upsertFavorite,
    removeFavorite,
    toggleFavorite,
    flushQueue
  };
}
