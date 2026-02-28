import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  getFirebaseFirestoreDb,
  isFirebaseProfileSyncEnabled
} from "@/lib/firebase-admin";
import { assertCanUseUnsafeLocalPersistence } from "@/lib/durable-storage";
import { readPostgresJsonArray, writePostgresJsonArray } from "@/lib/postgres-json-store";
import { resolveDataStoreDir } from "@/lib/runtime-storage";
import {
  normalizeTeamBuilderStoredRecord,
  type TeamBuilderStoredRecord
} from "@/lib/team-builder";

const DATA_STORE_DIR = resolveDataStoreDir();
const TEAM_BUILDER_STORE_FILE = path.join(DATA_STORE_DIR, "team-builder.json");
const TEAM_BUILDER_COLLECTION = "pokedexTeamBuilders";
const TEAM_BUILDER_STORE_KEY = "team_builder_records";

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

async function readArrayFile(filePath: string) {
  const pgRows = await readPostgresJsonArray(TEAM_BUILDER_STORE_KEY);
  if (pgRows !== null) {
    return Array.isArray(pgRows) ? pgRows : [];
  }

  const available = await ensureStoreFile(filePath, "[]");
  if (!available) {
    return [] as unknown[];
  }

  let raw = "";
  try {
    raw = await readFile(filePath, "utf-8");
  } catch {
    return [] as unknown[];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeArrayFile(
  filePath: string,
  rows: TeamBuilderStoredRecord[],
  options?: {
    skipUnsafeLocalWrite?: boolean;
    errorMessage?: string;
  }
) {
  const wroteToPg = await writePostgresJsonArray(TEAM_BUILDER_STORE_KEY, rows as unknown[]);
  if (wroteToPg) {
    return;
  }

  if (options?.skipUnsafeLocalWrite) {
    return;
  }

  assertCanUseUnsafeLocalPersistence(
    options?.errorMessage ?? "Persistent team builder storage is unavailable. Your changes were not saved."
  );

  const available = await ensureStoreFile(filePath, "[]");
  if (!available) {
    return;
  }

  try {
    await writeFile(filePath, JSON.stringify(rows, null, 2), "utf-8");
  } catch {
    // Local fallback should not crash request handling in serverless.
  }
}

async function readLocalTeamBuilderRecords() {
  const rows = await readArrayFile(TEAM_BUILDER_STORE_FILE);
  return rows
    .map((entry) => normalizeTeamBuilderStoredRecord(entry))
    .filter((entry): entry is TeamBuilderStoredRecord => entry !== null);
}

async function getCloudTeamBuilderRecord(userId: string) {
  if (!isFirebaseProfileSyncEnabled()) {
    return null;
  }

  const db = getFirebaseFirestoreDb();
  if (!db) {
    return null;
  }

  const snapshot = await db.collection(TEAM_BUILDER_COLLECTION).doc(userId).get();
  if (!snapshot.exists) {
    return null;
  }

  return normalizeTeamBuilderStoredRecord(snapshot.data());
}

async function upsertCloudTeamBuilderRecord(record: TeamBuilderStoredRecord) {
  if (!isFirebaseProfileSyncEnabled()) {
    return false;
  }

  const db = getFirebaseFirestoreDb();
  if (!db) {
    return false;
  }

  await db.collection(TEAM_BUILDER_COLLECTION).doc(record.userId).set(record, { merge: true });
  return true;
}

async function mirrorLocalTeamBuilderRecord(
  record: TeamBuilderStoredRecord,
  options?: {
    skipUnsafeLocalWrite?: boolean;
  }
) {
  return runExclusive(async () => {
    const rows = await readLocalTeamBuilderRecords();
    const index = rows.findIndex((entry) => entry.userId === record.userId);
    if (index >= 0) {
      rows[index] = record;
    } else {
      rows.push(record);
    }

    await writeArrayFile(TEAM_BUILDER_STORE_FILE, rows, {
      skipUnsafeLocalWrite: options?.skipUnsafeLocalWrite,
      errorMessage: "Persistent team builder storage is unavailable. Your changes were not saved."
    });
  });
}

export async function getTeamBuilderRecord(userId: string) {
  const local = (await readLocalTeamBuilderRecords()).find((entry) => entry.userId === userId) ?? null;

  try {
    const cloud = await getCloudTeamBuilderRecord(userId);
    if (cloud) {
      await mirrorLocalTeamBuilderRecord(cloud, { skipUnsafeLocalWrite: true });
      return cloud;
    }

    if (local) {
      await upsertCloudTeamBuilderRecord(local);
    }
  } catch {
    // Cloud read failed; local fallback is returned below.
  }

  return local;
}

export async function upsertTeamBuilderRecord(record: TeamBuilderStoredRecord) {
  let wroteCloudRecord = false;
  try {
    wroteCloudRecord = await upsertCloudTeamBuilderRecord(record);
  } catch {
    // Cloud write failed; keep local mirror as fallback.
  }

  await mirrorLocalTeamBuilderRecord(record, { skipUnsafeLocalWrite: wroteCloudRecord });
  return record;
}
