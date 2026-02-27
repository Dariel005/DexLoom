import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getFirebaseFirestoreDb, isFirebaseProfileSyncEnabled } from "@/lib/firebase-admin";
import {
  type FavoriteEntityType,
  type FavoriteListResult,
  type FavoriteRecord,
  type FavoriteSyncResult,
  type FavoriteSyncOperation,
  type FavoriteUpsertResult,
  type FavoriteUpsertInput,
  type UserProfileRecord
} from "@/lib/profile-types";
import { resolveDataStoreDir } from "@/lib/runtime-storage";
import { buildFavoriteId, decodeCursor, encodeCursor } from "@/lib/profile-validation";

const DATA_STORE_DIR = resolveDataStoreDir();
const PROFILE_STORE_FILE = path.join(DATA_STORE_DIR, "profiles.json");
const FAVORITES_STORE_FILE = path.join(DATA_STORE_DIR, "favorites.json");
const PROFILE_COLLECTION = "pokedexProfiles";
const FAVORITES_COLLECTION = "pokedexFavorites";

let writeQueue: Promise<unknown> = Promise.resolve();

function runExclusive<T>(task: () => Promise<T>) {
  const next = writeQueue.then(task, task);
  writeQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

async function ensureStoreFile(filePath: string, initialValue: string) {
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
  } catch {
    return false;
  }

  try {
    await readFile(filePath, "utf-8");
    return true;
  } catch {
    try {
      await writeFile(filePath, initialValue, "utf-8");
      return true;
    } catch {
      return false;
    }
  }
}

async function readArrayFile<T>(filePath: string) {
  const available = await ensureStoreFile(filePath, "[]");
  if (!available) {
    return [] as T[];
  }

  let raw = "";
  try {
    raw = await readFile(filePath, "utf-8");
  } catch {
    return [] as T[];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : ([] as T[]);
  } catch {
    return [] as T[];
  }
}

async function writeArrayFile<T>(filePath: string, rows: T[]) {
  const available = await ensureStoreFile(filePath, "[]");
  if (!available) {
    return;
  }

  try {
    await writeFile(filePath, JSON.stringify(rows, null, 2), "utf-8");
  } catch {
    // Local fallback should never crash request handling in serverless.
  }
}

function sortFavoritesByCreatedAtDesc(rows: FavoriteRecord[]) {
  return rows
    .slice()
    .sort((a, b) => {
      const timeA = Date.parse(a.createdAt);
      const timeB = Date.parse(b.createdAt);
      if (Number.isNaN(timeA) || Number.isNaN(timeB) || timeA === timeB) {
        return a.id.localeCompare(b.id);
      }
      return timeB - timeA;
    });
}

async function readLocalProfiles() {
  return readArrayFile<UserProfileRecord>(PROFILE_STORE_FILE);
}

async function readLocalFavorites() {
  return readArrayFile<FavoriteRecord>(FAVORITES_STORE_FILE);
}

async function getCloudProfile(userId: string) {
  if (!isFirebaseProfileSyncEnabled()) {
    return null;
  }

  const db = getFirebaseFirestoreDb();
  if (!db) {
    return null;
  }

  const snapshot = await db.collection(PROFILE_COLLECTION).doc(userId).get();
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as UserProfileRecord;
  if (!data || typeof data.userId !== "string") {
    return null;
  }
  return data;
}

async function upsertCloudProfile(record: UserProfileRecord) {
  if (!isFirebaseProfileSyncEnabled()) {
    return;
  }

  const db = getFirebaseFirestoreDb();
  if (!db) {
    return;
  }
  await db.collection(PROFILE_COLLECTION).doc(record.userId).set(record, { merge: true });
}

async function getCloudFavorites(userId: string) {
  if (!isFirebaseProfileSyncEnabled()) {
    return null;
  }

  const db = getFirebaseFirestoreDb();
  if (!db) {
    return null;
  }

  const snapshot = await db
    .collection(FAVORITES_COLLECTION)
    .where("userId", "==", userId)
    .get();
  if (snapshot.empty) {
    return [] as FavoriteRecord[];
  }

  const rows = snapshot.docs
    .map((doc) => doc.data() as FavoriteRecord)
    .filter((entry) => typeof entry?.id === "string" && typeof entry?.userId === "string");
  return sortFavoritesByCreatedAtDesc(rows);
}

async function upsertCloudFavorite(record: FavoriteRecord) {
  if (!isFirebaseProfileSyncEnabled()) {
    return;
  }

  const db = getFirebaseFirestoreDb();
  if (!db) {
    return;
  }
  const cloudDocId = `${record.userId}__${record.id}`;
  await db.collection(FAVORITES_COLLECTION).doc(cloudDocId).set(record, { merge: true });
}

async function deleteCloudFavorite(
  userId: string,
  entityType: FavoriteEntityType,
  entityId: string
) {
  if (!isFirebaseProfileSyncEnabled()) {
    return;
  }

  const db = getFirebaseFirestoreDb();
  if (!db) {
    return;
  }
  const cloudDocId = `${userId}__${buildFavoriteId(entityType, entityId)}`;
  await db.collection(FAVORITES_COLLECTION).doc(cloudDocId).delete();
}

async function mirrorLocalProfile(record: UserProfileRecord) {
  return runExclusive(async () => {
    const profiles = await readLocalProfiles();
    const index = profiles.findIndex((entry) => entry.userId === record.userId);
    if (index >= 0) {
      profiles[index] = record;
    } else {
      profiles.push(record);
    }
    await writeArrayFile(PROFILE_STORE_FILE, profiles);
  });
}

async function mirrorLocalFavoritesForUser(userId: string, rows: FavoriteRecord[]) {
  return runExclusive(async () => {
    const favorites = await readLocalFavorites();
    const preserved = favorites.filter((entry) => entry.userId !== userId);
    const merged = [...preserved, ...rows];
    await writeArrayFile(FAVORITES_STORE_FILE, merged);
  });
}

async function readLocalProfile(userId: string) {
  const profiles = await readLocalProfiles();
  return profiles.find((entry) => entry.userId === userId) ?? null;
}

async function readLocalFavoritesByUser(userId: string) {
  const favorites = await readLocalFavorites();
  return sortFavoritesByCreatedAtDesc(favorites.filter((entry) => entry.userId === userId));
}

function hasFavoriteSetChanged(current: FavoriteRecord[], next: FavoriteRecord[]) {
  if (current.length !== next.length) {
    return true;
  }

  const byId = new Map(current.map((entry) => [entry.id, entry]));
  for (const row of next) {
    const currentRow = byId.get(row.id);
    if (!currentRow) {
      return true;
    }

    if (currentRow.createdAt !== row.createdAt || currentRow.href !== row.href) {
      return true;
    }
  }

  return false;
}

export async function getProfileRecord(userId: string) {
  const local = await readLocalProfile(userId);

  try {
    const cloud = await getCloudProfile(userId);
    if (cloud) {
      await mirrorLocalProfile(cloud);
      return cloud;
    }

    if (local) {
      await upsertCloudProfile(local);
    }
  } catch {
    // Cloud read failed; local fallback is applied below.
  }

  return local;
}

export async function upsertProfileRecord(record: UserProfileRecord) {
  try {
    await upsertCloudProfile(record);
  } catch {
    // Cloud write failed; keep local mirror as fallback.
  }

  await mirrorLocalProfile(record);
  return record;
}

export async function listFavoriteRecords(input: {
  userId: string;
  entityType?: FavoriteEntityType | null;
  cursor?: string | null;
  limit?: number;
}): Promise<FavoriteListResult> {
  const { userId, entityType = null, cursor = null, limit = 50 } = input;
  const localFavorites = await readLocalFavoritesByUser(userId);

  let favorites: FavoriteRecord[] = localFavorites;
  try {
    const cloudFavorites = await getCloudFavorites(userId);
    if (cloudFavorites && cloudFavorites.length > 0) {
      favorites = cloudFavorites;
      if (hasFavoriteSetChanged(localFavorites, cloudFavorites)) {
        await mirrorLocalFavoritesForUser(userId, cloudFavorites);
      }
    } else if (cloudFavorites && localFavorites.length > 0) {
      // Cloud store is empty but local records exist; backfill to prevent data loss on next deploy.
      await Promise.all(localFavorites.map((entry) => upsertCloudFavorite(entry)));
      favorites = localFavorites;
    } else if (cloudFavorites) {
      favorites = [];
    }
  } catch {
    favorites = localFavorites;
  }

  const filtered = entityType
    ? favorites.filter((entry) => entry.entityType === entityType)
    : favorites;

  const offset = decodeCursor(cursor ?? null);
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const page = filtered.slice(offset, offset + safeLimit);
  const nextOffset = offset + safeLimit;
  const nextCursor = nextOffset < filtered.length ? encodeCursor(nextOffset) : null;

  return {
    items: page,
    nextCursor
  };
}

export async function upsertFavoriteRecord(
  userId: string,
  input: FavoriteUpsertInput
): Promise<FavoriteUpsertResult> {
  const now = new Date().toISOString();
  const favoriteId = buildFavoriteId(input.entityType, input.entityId);
  const current = await readLocalFavoritesByUser(userId);
  const existing = current.find((entry) => entry.id === favoriteId);
  const created = !existing;
  const record: FavoriteRecord = {
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

  try {
    await upsertCloudFavorite(record);
  } catch {
    // Cloud write failed; keep local mirror as fallback.
  }

  await runExclusive(async () => {
    const all = await readLocalFavorites();
    const index = all.findIndex((entry) => entry.userId === userId && entry.id === favoriteId);
    if (index >= 0) {
      all[index] = record;
    } else {
      all.push(record);
    }
    await writeArrayFile(FAVORITES_STORE_FILE, all);
  });

  return {
    record,
    created
  };
}

export async function deleteFavoriteRecord(
  userId: string,
  entityType: FavoriteEntityType,
  entityId: string
) {
  const favoriteId = buildFavoriteId(entityType, entityId);
  try {
    await deleteCloudFavorite(userId, entityType, entityId);
  } catch {
    // Cloud delete failed; still update local mirror.
  }

  return runExclusive(async () => {
    const all = await readLocalFavorites();
    const next = all.filter((entry) => !(entry.userId === userId && entry.id === favoriteId));
    const removed = next.length !== all.length;
    if (removed) {
      await writeArrayFile(FAVORITES_STORE_FILE, next);
    }
    return removed;
  });
}

export async function syncFavoriteRecords(
  userId: string,
  ops: FavoriteSyncOperation[]
): Promise<FavoriteSyncResult> {
  let applied = 0;
  let failed = 0;
  const createdRecords: FavoriteRecord[] = [];

  for (const op of ops) {
    try {
      if (op.op === "add") {
        const upserted = await upsertFavoriteRecord(userId, op.item);
        if (upserted.created) {
          createdRecords.push(upserted.record);
        }
      } else {
        await deleteFavoriteRecord(userId, op.entityType, op.entityId);
      }
      applied += 1;
    } catch {
      failed += 1;
    }
  }

  return { applied, failed, createdRecords };
}
