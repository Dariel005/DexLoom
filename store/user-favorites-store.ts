"use client";

import { type FavoriteEntityType, type FavoriteRecord, type FavoriteUpsertInput } from "@/lib/profile-types";
import { buildFavoriteId } from "@/lib/profile-validation";

export interface FavoriteQueueOperation {
  opId: string;
  createdAt: string;
  op: "add" | "remove";
  item?: FavoriteUpsertInput;
  entityType?: FavoriteEntityType;
  entityId?: string;
}

interface PersistedFavoritesCache {
  version: 1;
  users: Record<string, FavoriteRecord[]>;
}

interface PersistedFavoritesQueue {
  version: 1;
  users: Record<string, FavoriteQueueOperation[]>;
}

const CACHE_KEY = "pokedex.favorites.cache.v1";
const QUEUE_KEY = "pokedex.favorites.queue.v1";

function loadJson<T>(storageKey: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson<T>(storageKey: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Ignore storage write failures.
  }
}

function normalizeCache(value: unknown): PersistedFavoritesCache {
  if (!value || typeof value !== "object") {
    return { version: 1, users: {} };
  }
  const candidate = value as Partial<PersistedFavoritesCache>;
  if (candidate.version !== 1 || !candidate.users || typeof candidate.users !== "object") {
    return { version: 1, users: {} };
  }
  return {
    version: 1,
    users: candidate.users
  };
}

function normalizeQueue(value: unknown): PersistedFavoritesQueue {
  if (!value || typeof value !== "object") {
    return { version: 1, users: {} };
  }
  const candidate = value as Partial<PersistedFavoritesQueue>;
  if (candidate.version !== 1 || !candidate.users || typeof candidate.users !== "object") {
    return { version: 1, users: {} };
  }
  return {
    version: 1,
    users: candidate.users
  };
}

export function loadFavoriteItemsForUser(userKey: string) {
  const cache = normalizeCache(loadJson<PersistedFavoritesCache | null>(CACHE_KEY, null));
  return Array.isArray(cache.users[userKey]) ? cache.users[userKey] : [];
}

export function saveFavoriteItemsForUser(userKey: string, items: FavoriteRecord[]) {
  const cache = normalizeCache(loadJson<PersistedFavoritesCache | null>(CACHE_KEY, null));
  cache.users[userKey] = items;
  saveJson(CACHE_KEY, cache);
}

export function loadFavoriteQueueForUser(userKey: string) {
  const queue = normalizeQueue(loadJson<PersistedFavoritesQueue | null>(QUEUE_KEY, null));
  return Array.isArray(queue.users[userKey]) ? queue.users[userKey] : [];
}

export function saveFavoriteQueueForUser(userKey: string, queueOps: FavoriteQueueOperation[]) {
  const queue = normalizeQueue(loadJson<PersistedFavoritesQueue | null>(QUEUE_KEY, null));
  queue.users[userKey] = queueOps;
  saveJson(QUEUE_KEY, queue);
}

export function saveFavoriteStateForUser(input: {
  userKey: string;
  items: FavoriteRecord[];
  queueOps: FavoriteQueueOperation[];
}) {
  saveFavoriteItemsForUser(input.userKey, input.items);
  saveFavoriteQueueForUser(input.userKey, input.queueOps);
}

export function mergeQueueOperation(
  queueOps: FavoriteQueueOperation[],
  operation: FavoriteQueueOperation
) {
  const filtered = queueOps.filter((entry) => {
    if (operation.op === "add") {
      const target = operation.item;
      if (!target) {
        return true;
      }
      if (entry.op === "add" && entry.item) {
        return !(
          entry.item.entityType === target.entityType &&
          entry.item.entityId === target.entityId
        );
      }
      return !(
        entry.op === "remove" &&
        entry.entityType === target.entityType &&
        entry.entityId === target.entityId
      );
    }

    if (operation.op === "remove") {
      return !(
        (entry.op === "remove" &&
          entry.entityType === operation.entityType &&
          entry.entityId === operation.entityId) ||
        (entry.op === "add" &&
          entry.item?.entityType === operation.entityType &&
          entry.item?.entityId === operation.entityId)
      );
    }

    return true;
  });

  return [...filtered, operation];
}

export function applyFavoriteUpsert(
  items: FavoriteRecord[],
  userId: string,
  input: FavoriteUpsertInput
) {
  const favoriteId = buildFavoriteId(input.entityType, input.entityId);
  const now = new Date().toISOString();
  const existing = items.find((entry) => entry.id === favoriteId);
  const nextRecord: FavoriteRecord = {
    id: favoriteId,
    userId,
    entityType: input.entityType,
    entityId: input.entityId,
    title: input.title,
    href: input.href,
    imageUrl: input.imageUrl ?? null,
    subtitle: input.subtitle ?? null,
    tags: input.tags ?? [],
    createdAt: existing?.createdAt ?? now
  };

  const nextItems = items.filter((entry) => entry.id !== favoriteId);
  nextItems.push(nextRecord);
  nextItems.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return nextItems;
}

export function applyFavoriteRemove(
  items: FavoriteRecord[],
  entityType: FavoriteEntityType,
  entityId: string
) {
  const targetId = buildFavoriteId(entityType, entityId);
  return items.filter((entry) => entry.id !== targetId);
}

export function replayFavoriteQueue(
  items: FavoriteRecord[],
  queueOps: FavoriteQueueOperation[],
  userId: string
) {
  return queueOps.reduce((acc, op) => {
    if (op.op === "add" && op.item) {
      return applyFavoriteUpsert(acc, userId, op.item);
    }
    if (op.op === "remove" && op.entityType && op.entityId) {
      return applyFavoriteRemove(acc, op.entityType, op.entityId);
    }
    return acc;
  }, items.slice());
}

export function buildAddQueueOperation(item: FavoriteUpsertInput): FavoriteQueueOperation {
  return {
    opId: `add-${item.entityType}-${item.entityId}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    op: "add",
    item
  };
}

export function buildRemoveQueueOperation(
  entityType: FavoriteEntityType,
  entityId: string
): FavoriteQueueOperation {
  return {
    opId: `remove-${entityType}-${entityId}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    op: "remove",
    entityType,
    entityId
  };
}
