import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  getFirebaseFirestoreDb,
  isFirebaseAuthSyncEnabled,
  isFirebaseAdminConfigured,
  isFirebaseProfileSyncEnabled,
  isFirebaseSocialSyncEnabled
} from "@/lib/firebase-admin";
import { normalizeEmailAddress, sanitizeDisplayName } from "@/lib/auth-validation";
import { DEFAULT_TRAINER_AVATAR_URL, isGoogleProfileImageUrl } from "@/lib/default-avatar";
import { readPostgresJsonArray, writePostgresJsonArray } from "@/lib/postgres-json-store";
import { resolveDataStoreDir } from "@/lib/runtime-storage";

export type AuthProviderKind = "credentials" | "google" | "hybrid";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  provider: AuthProviderKind;
  passwordHash: string | null;
  createdAt: string;
  updatedAt: string;
}

const DATA_STORE_DIR = resolveDataStoreDir();
const USER_STORE_FILE = path.join(DATA_STORE_DIR, "users.json");
const USER_COLLECTION = "pokedexUsers";
let writeQueue: Promise<unknown> = Promise.resolve();

function runExclusive<T>(task: () => Promise<T>) {
  const next = writeQueue.then(task, task);
  writeQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function canUseUserDatabase() {
  return (
    isFirebaseAdminConfigured() &&
    (isFirebaseAuthSyncEnabled() || isFirebaseProfileSyncEnabled() || isFirebaseSocialSyncEnabled())
  );
}

function getUserCollection() {
  if (!canUseUserDatabase()) {
    return null;
  }

  const db = getFirebaseFirestoreDb();
  if (!db) {
    return null;
  }

  return db.collection(USER_COLLECTION);
}

function isValidProvider(value: unknown): value is AuthProviderKind {
  return value === "credentials" || value === "google" || value === "hybrid";
}

function normalizeIsoDate(value: unknown, fallback: string) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return fallback;
  }

  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? fallback : new Date(parsed).toISOString();
}

function normalizeStoredUser(value: unknown): StoredUser | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Partial<StoredUser>;
  const id = typeof row.id === "string" ? row.id.trim() : "";
  const email = normalizeEmailAddress(typeof row.email === "string" ? row.email : "");
  if (!id || !email) {
    return null;
  }

  const createdAtFallback = new Date().toISOString();
  const createdAt = normalizeIsoDate(row.createdAt, createdAtFallback);
  const updatedAt = normalizeIsoDate(row.updatedAt, createdAt);

  return {
    id,
    email,
    name: sanitizeDisplayName(typeof row.name === "string" ? row.name : "", email),
    image: typeof row.image === "string" ? row.image : row.image === null ? null : null,
    provider: isValidProvider(row.provider) ? row.provider : "credentials",
    passwordHash: typeof row.passwordHash === "string" ? row.passwordHash : null,
    createdAt,
    updatedAt
  };
}

async function ensureStoreFile() {
  try {
    await mkdir(path.dirname(USER_STORE_FILE), { recursive: true });
  } catch {
    return false;
  }

  try {
    await readFile(USER_STORE_FILE, "utf-8");
    return true;
  } catch {
    try {
      await writeFile(USER_STORE_FILE, "[]", "utf-8");
      return true;
    } catch {
      return false;
    }
  }
}

async function readLocalUsers() {
  const pgRows = await readPostgresJsonArray("users");
  if (pgRows !== null) {
    return pgRows
      .map((entry) => normalizeStoredUser(entry))
      .filter((entry): entry is StoredUser => Boolean(entry));
  }

  const available = await ensureStoreFile();
  if (!available) {
    return [] as StoredUser[];
  }

  let raw = "";
  try {
    raw = await readFile(USER_STORE_FILE, "utf-8");
  } catch {
    return [] as StoredUser[];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [] as StoredUser[];
    }

    return parsed
      .map((entry) => normalizeStoredUser(entry))
      .filter((entry): entry is StoredUser => Boolean(entry));
  } catch {
    return [] as StoredUser[];
  }
}

function sortUsersByCreatedAt(users: StoredUser[]) {
  return users
    .slice()
    .sort((a, b) => {
      const left = Date.parse(a.createdAt);
      const right = Date.parse(b.createdAt);
      if (Number.isNaN(left) && Number.isNaN(right)) {
        return a.id.localeCompare(b.id);
      }
      if (Number.isNaN(left)) {
        return 1;
      }
      if (Number.isNaN(right)) {
        return -1;
      }
      if (left === right) {
        return a.id.localeCompare(b.id);
      }
      return left - right;
    });
}

async function writeLocalUsers(users: StoredUser[]) {
  const sorted = sortUsersByCreatedAt(users);
  const wroteToPg = await writePostgresJsonArray("users", sorted as unknown[]);
  if (wroteToPg) {
    return;
  }

  const available = await ensureStoreFile();
  if (!available) {
    return;
  }

  try {
    await writeFile(USER_STORE_FILE, JSON.stringify(sorted, null, 2), "utf-8");
  } catch {
    // Local mirror writes are best-effort only.
  }
}

async function readCloudUsers() {
  const collection = getUserCollection();
  if (!collection) {
    return null;
  }

  try {
    const snapshot = await collection.get();
    if (snapshot.empty) {
      return [] as StoredUser[];
    }

    const users = snapshot.docs
      .map((doc) => normalizeStoredUser(doc.data()))
      .filter((entry): entry is StoredUser => Boolean(entry));
    return sortUsersByCreatedAt(users);
  } catch {
    return null;
  }
}

async function readCloudUserByEmail(email: string) {
  const collection = getUserCollection();
  if (!collection) {
    return null;
  }

  try {
    const snapshot = await collection.where("email", "==", email).limit(1).get();
    if (snapshot.empty) {
      return null;
    }
    return normalizeStoredUser(snapshot.docs[0]?.data());
  } catch {
    return null;
  }
}

async function readCloudUserById(userId: string) {
  const collection = getUserCollection();
  if (!collection) {
    return null;
  }

  try {
    const snapshot = await collection.doc(userId).get();
    if (!snapshot.exists) {
      return null;
    }
    return normalizeStoredUser(snapshot.data());
  } catch {
    return null;
  }
}

async function writeCloudUser(user: StoredUser) {
  const collection = getUserCollection();
  if (!collection) {
    return;
  }

  await collection.doc(user.id).set(user, { merge: true });
}

function resolveGoogleSignInImage(existingImage: string | null | undefined) {
  if (!existingImage) {
    return DEFAULT_TRAINER_AVATAR_URL;
  }
  return isGoogleProfileImageUrl(existingImage) ? DEFAULT_TRAINER_AVATAR_URL : existingImage;
}

function upsertUserInList(users: StoredUser[], user: StoredUser) {
  const index = users.findIndex((entry) => entry.id === user.id || entry.email === user.email);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
}

async function mirrorLocalUser(user: StoredUser) {
  await runExclusive(async () => {
    const users = await readLocalUsers();
    upsertUserInList(users, user);
    await writeLocalUsers(users);
  });
}

async function mirrorLocalUsers(users: StoredUser[]) {
  await runExclusive(async () => {
    await writeLocalUsers(users);
  });
}

function hasUserListChanged(current: StoredUser[], next: StoredUser[]) {
  if (current.length !== next.length) {
    return true;
  }

  const byId = new Map(current.map((entry) => [entry.id, entry]));
  for (const row of next) {
    const currentRow = byId.get(row.id);
    if (!currentRow) {
      return true;
    }
    if (currentRow.updatedAt !== row.updatedAt || currentRow.email !== row.email) {
      return true;
    }
  }

  return false;
}

async function readUsers() {
  const [localUsers, cloudUsers] = await Promise.all([readLocalUsers(), readCloudUsers()]);
  if (cloudUsers && cloudUsers.length > 0) {
    if (hasUserListChanged(localUsers, cloudUsers)) {
      await mirrorLocalUsers(cloudUsers);
    }
    return cloudUsers;
  }

  if (cloudUsers && cloudUsers.length === 0 && localUsers.length > 0) {
    try {
      await Promise.all(localUsers.map((user) => writeCloudUser(user)));
    } catch {
      // Keep serving local users if cloud backfill fails.
    }
  }

  if (localUsers.length > 0) {
    return localUsers;
  }

  return cloudUsers ?? [];
}

function mergeProvider(current: AuthProviderKind, incoming: AuthProviderKind): AuthProviderKind {
  if (current === incoming) {
    return current;
  }
  return "hybrid";
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = normalizeEmailAddress(email);
  if (!normalizedEmail) {
    return null;
  }

  const cloudUser = await readCloudUserByEmail(normalizedEmail);
  if (cloudUser) {
    await mirrorLocalUser(cloudUser);
    return cloudUser;
  }

  const users = await readLocalUsers();
  const localUser = users.find((user) => user.email === normalizedEmail) ?? null;
  if (localUser) {
    try {
      await writeCloudUser(localUser);
    } catch {
      // Keep local user available for login when cloud sync fails.
    }
  }
  return localUser;
}

export async function listStoredUsers() {
  const users = await readUsers();
  return users.slice();
}

export async function findUserById(userId: string) {
  const normalizedId = String(userId ?? "").trim();
  if (!normalizedId) {
    return null;
  }

  const cloudUser = await readCloudUserById(normalizedId);
  if (cloudUser) {
    await mirrorLocalUser(cloudUser);
    return cloudUser;
  }

  const users = await readLocalUsers();
  const localUser = users.find((user) => user.id === normalizedId) ?? null;
  if (localUser) {
    try {
      await writeCloudUser(localUser);
    } catch {
      // Keep local user available for login when cloud sync fails.
    }
  }
  return localUser;
}

export async function registerCredentialsUser(input: {
  email: string;
  passwordHash: string;
  name?: string;
}) {
  const normalizedEmail = normalizeEmailAddress(input.email);
  const resolvedName = sanitizeDisplayName(input.name ?? "", normalizedEmail);

  return runExclusive(async () => {
    const users = await readLocalUsers();
    const now = new Date().toISOString();
    const existingUser =
      (await readCloudUserByEmail(normalizedEmail)) ?? users.find((user) => user.email === normalizedEmail);

    if (existingUser) {
      if (existingUser.passwordHash) {
        upsertUserInList(users, existingUser);
        await writeLocalUsers(users);
        return { status: "exists" as const, user: existingUser };
      }

      const updatedUser: StoredUser = {
        ...existingUser,
        passwordHash: input.passwordHash,
        provider: mergeProvider(existingUser.provider, "credentials"),
        name: existingUser.name || resolvedName,
        updatedAt: now
      };

      try {
        await writeCloudUser(updatedUser);
      } catch {
        // Keep local write as source of truth when cloud sync fails.
      }

      upsertUserInList(users, updatedUser);
      await writeLocalUsers(users);
      return { status: "updated" as const, user: updatedUser };
    }

    const user: StoredUser = {
      id: randomUUID(),
      email: normalizedEmail,
      name: resolvedName,
      image: null,
      provider: "credentials",
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now
    };

    try {
      await writeCloudUser(user);
    } catch {
      // Keep local write as source of truth when cloud sync fails.
    }

    users.push(user);
    await writeLocalUsers(users);
    return { status: "created" as const, user };
  });
}

export async function upsertGoogleUser(input: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const normalizedEmail = normalizeEmailAddress(input.email);
  const resolvedName = sanitizeDisplayName(input.name ?? "", normalizedEmail);

  return runExclusive(async () => {
    const users = await readLocalUsers();
    const now = new Date().toISOString();
    const existingUser =
      (await readCloudUserByEmail(normalizedEmail)) ?? users.find((user) => user.email === normalizedEmail);

    if (existingUser) {
      const updatedUser: StoredUser = {
        ...existingUser,
        provider: mergeProvider(existingUser.provider, "google"),
        // Keep trainer-edited local identity stable; only backfill if missing.
        name: existingUser.name.trim().length > 0 ? existingUser.name : resolvedName,
        image: resolveGoogleSignInImage(existingUser.image),
        updatedAt: now
      };

      try {
        await writeCloudUser(updatedUser);
      } catch {
        // Keep local write as source of truth when cloud sync fails.
      }

      upsertUserInList(users, updatedUser);
      await writeLocalUsers(users);
      return updatedUser;
    }

    const user: StoredUser = {
      id: randomUUID(),
      email: normalizedEmail,
      name: resolvedName,
      image: DEFAULT_TRAINER_AVATAR_URL,
      provider: "google",
      passwordHash: null,
      createdAt: now,
      updatedAt: now
    };

    try {
      await writeCloudUser(user);
    } catch {
      // Keep local write as source of truth when cloud sync fails.
    }

    users.push(user);
    await writeLocalUsers(users);
    return user;
  });
}

export async function updateStoredUserProfile(
  userId: string,
  input: {
    name?: string | null;
    image?: string | null;
  }
) {
  const normalizedId = String(userId ?? "").trim();
  if (!normalizedId) {
    return null;
  }

  return runExclusive(async () => {
    const users = await readLocalUsers();
    const cloudUser = await readCloudUserById(normalizedId);
    const user = cloudUser ?? users.find((entry) => entry.id === normalizedId);
    if (!user) {
      return null;
    }

    const nextUser: StoredUser = { ...user };
    const nextName = input.name?.trim();
    if (typeof nextName === "string" && nextName.length > 0) {
      nextUser.name = sanitizeDisplayName(nextName, nextUser.email);
    }

    if (input.image !== undefined) {
      nextUser.image = input.image ?? null;
    }

    nextUser.updatedAt = new Date().toISOString();

    try {
      await writeCloudUser(nextUser);
    } catch {
      // Keep local write as source of truth when cloud sync fails.
    }

    upsertUserInList(users, nextUser);
    await writeLocalUsers(users);
    return nextUser;
  });
}
