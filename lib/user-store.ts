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
import { assertCanUseUnsafeLocalPersistence } from "@/lib/durable-storage";
import { normalizeEmailAddress, sanitizeDisplayName } from "@/lib/auth-validation";
import { DEFAULT_TRAINER_AVATAR_URL, isGoogleProfileImageUrl } from "@/lib/default-avatar";
import { readPostgresJsonArray, writePostgresJsonArray } from "@/lib/postgres-json-store";
import { normalizeUserRole, type UserRole } from "@/lib/roles";
import { resolveDataStoreDir } from "@/lib/runtime-storage";

export type AuthProviderKind = "credentials" | "google" | "hybrid";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  provider: AuthProviderKind;
  role: UserRole;
  passwordHash: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  suspendedAt: string | null;
  suspensionReason: string | null;
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

function normalizeEmailVerified(value: unknown) {
  return typeof value === "boolean" ? value : true;
}

function normalizeOptionalIsoDate(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return null;
  }

  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
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
  const emailVerified = normalizeEmailVerified((row as { emailVerified?: unknown }).emailVerified);
  const emailVerifiedAtRaw = (row as { emailVerifiedAt?: unknown }).emailVerifiedAt;
  const emailVerifiedAt =
    typeof emailVerifiedAtRaw === "string" && emailVerifiedAtRaw.trim().length > 0
      ? normalizeIsoDate(emailVerifiedAtRaw, updatedAt)
      : emailVerified
        ? createdAt
        : null;

  return {
    id,
    email,
    name: sanitizeDisplayName(typeof row.name === "string" ? row.name : "", email),
    image: typeof row.image === "string" ? row.image : row.image === null ? null : null,
    provider: isValidProvider(row.provider) ? row.provider : "credentials",
    role: normalizeUserRole((row as { role?: unknown }).role),
    passwordHash: typeof row.passwordHash === "string" ? row.passwordHash : null,
    emailVerified,
    emailVerifiedAt,
    suspendedAt: normalizeOptionalIsoDate((row as { suspendedAt?: unknown }).suspendedAt),
    suspensionReason:
      typeof (row as { suspensionReason?: unknown }).suspensionReason === "string"
        ? (row as { suspensionReason?: string }).suspensionReason?.trim().slice(0, 240) ?? null
        : null,
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

async function writeLocalUsers(
  users: StoredUser[],
  options?: {
    skipUnsafeLocalWrite?: boolean;
  }
) {
  const sorted = sortUsersByCreatedAt(users);
  const wroteToPg = await writePostgresJsonArray("users", sorted as unknown[]);
  if (wroteToPg) {
    return;
  }

  if (options?.skipUnsafeLocalWrite) {
    return;
  }

  assertCanUseUnsafeLocalPersistence(
    "Persistent account storage is unavailable. Account changes were not saved."
  );

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
    return false;
  }

  await collection.doc(user.id).set(user, { merge: true });
  return true;
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
    await writeLocalUsers(users, { skipUnsafeLocalWrite: true });
  });
}

async function mirrorLocalUsers(users: StoredUser[]) {
  await runExclusive(async () => {
    await writeLocalUsers(users, { skipUnsafeLocalWrite: true });
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
    let wroteCloudUser = false;
    const existingUser =
      (await readCloudUserByEmail(normalizedEmail)) ?? users.find((user) => user.email === normalizedEmail);

    if (existingUser) {
      if (existingUser.passwordHash) {
        if (existingUser.emailVerified !== false) {
          upsertUserInList(users, existingUser);
          await writeLocalUsers(users);
          return { status: "exists" as const, user: existingUser };
        }

        const refreshedUser: StoredUser = {
          ...existingUser,
          passwordHash: input.passwordHash,
          name: existingUser.name || resolvedName,
          updatedAt: now
        };

        try {
          wroteCloudUser = await writeCloudUser(refreshedUser);
        } catch {
          // Keep local write as source of truth when cloud sync fails.
        }

        upsertUserInList(users, refreshedUser);
        await writeLocalUsers(users, { skipUnsafeLocalWrite: wroteCloudUser });
        return { status: "verification_pending" as const, user: refreshedUser };
      }

      const updatedUser: StoredUser = {
        ...existingUser,
        passwordHash: input.passwordHash,
        provider: mergeProvider(existingUser.provider, "credentials"),
        name: existingUser.name || resolvedName,
        emailVerified: existingUser.emailVerified,
        emailVerifiedAt: existingUser.emailVerifiedAt,
        updatedAt: now
      };

      try {
        wroteCloudUser = await writeCloudUser(updatedUser);
      } catch {
        // Keep local write as source of truth when cloud sync fails.
      }

      upsertUserInList(users, updatedUser);
      await writeLocalUsers(users, { skipUnsafeLocalWrite: wroteCloudUser });
      return { status: "updated" as const, user: updatedUser };
    }

    const user: StoredUser = {
      id: randomUUID(),
      email: normalizedEmail,
      name: resolvedName,
      image: null,
      provider: "credentials",
      role: "member",
      passwordHash: input.passwordHash,
      emailVerified: false,
      emailVerifiedAt: null,
      suspendedAt: null,
      suspensionReason: null,
      createdAt: now,
      updatedAt: now
    };

    try {
      wroteCloudUser = await writeCloudUser(user);
    } catch {
      // Keep local write as source of truth when cloud sync fails.
    }

    users.push(user);
    await writeLocalUsers(users, { skipUnsafeLocalWrite: wroteCloudUser });
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
    let wroteCloudUser = false;
    const existingUser =
      (await readCloudUserByEmail(normalizedEmail)) ?? users.find((user) => user.email === normalizedEmail);

    if (existingUser) {
      const updatedUser: StoredUser = {
        ...existingUser,
        provider: mergeProvider(existingUser.provider, "google"),
        // Keep trainer-edited local identity stable; only backfill if missing.
        name: existingUser.name.trim().length > 0 ? existingUser.name : resolvedName,
        image: resolveGoogleSignInImage(existingUser.image),
        emailVerified: true,
        emailVerifiedAt: existingUser.emailVerifiedAt ?? now,
        updatedAt: now
      };

      try {
        wroteCloudUser = await writeCloudUser(updatedUser);
      } catch {
        // Keep local write as source of truth when cloud sync fails.
      }

      upsertUserInList(users, updatedUser);
      await writeLocalUsers(users, { skipUnsafeLocalWrite: wroteCloudUser });
      return { status: "updated" as const, user: updatedUser };
    }

    const user: StoredUser = {
      id: randomUUID(),
      email: normalizedEmail,
      name: resolvedName,
      image: DEFAULT_TRAINER_AVATAR_URL,
      provider: "google",
      role: "member",
      passwordHash: null,
      emailVerified: true,
      emailVerifiedAt: now,
      suspendedAt: null,
      suspensionReason: null,
      createdAt: now,
      updatedAt: now
    };

    try {
      wroteCloudUser = await writeCloudUser(user);
    } catch {
      // Keep local write as source of truth when cloud sync fails.
    }

    users.push(user);
    await writeLocalUsers(users, { skipUnsafeLocalWrite: wroteCloudUser });
    return { status: "created" as const, user };
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
    let wroteCloudUser = false;
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
      wroteCloudUser = await writeCloudUser(nextUser);
    } catch {
      // Keep local write as source of truth when cloud sync fails.
    }

    upsertUserInList(users, nextUser);
    await writeLocalUsers(users, { skipUnsafeLocalWrite: wroteCloudUser });
    return nextUser;
  });
}

export async function updateStoredUserAdminFields(
  userId: string,
  input: {
    email?: string;
    name?: string | null;
    image?: string | null;
    role?: UserRole;
    suspendedAt?: string | null;
    suspensionReason?: string | null;
  }
) {
  const normalizedId = String(userId ?? "").trim();
  if (!normalizedId) {
    return null;
  }

  return runExclusive(async () => {
    const users = await readLocalUsers();
    const cloudUser = await readCloudUserById(normalizedId);
    let wroteCloudUser = false;
    const user = cloudUser ?? users.find((entry) => entry.id === normalizedId);
    if (!user) {
      return null;
    }

    const nextUser: StoredUser = { ...user };

    if (input.email !== undefined) {
      const nextEmail = normalizeEmailAddress(input.email);
      if (!nextEmail) {
        throw new Error("Email cannot be empty.");
      }

      const localConflict = users.find(
        (entry) => entry.id !== normalizedId && entry.email === nextEmail
      );
      const cloudConflict = await readCloudUserByEmail(nextEmail);
      if (
        localConflict ||
        (cloudConflict && cloudConflict.id !== normalizedId)
      ) {
        throw new Error("Another account already uses that email address.");
      }

      nextUser.email = nextEmail;
      nextUser.name = sanitizeDisplayName(nextUser.name, nextEmail);
    }

    if (input.name !== undefined) {
      nextUser.name = sanitizeDisplayName(input.name ?? "", nextUser.email);
    }

    if (input.image !== undefined) {
      const nextImage = typeof input.image === "string" ? input.image.trim() : "";
      nextUser.image = nextImage ? nextImage : null;
    }

    if (input.role !== undefined) {
      nextUser.role = normalizeUserRole(input.role, nextUser.role);
    }

    if (input.suspendedAt !== undefined) {
      nextUser.suspendedAt = normalizeOptionalIsoDate(input.suspendedAt);
    }

    if (input.suspensionReason !== undefined) {
      const nextReason =
        typeof input.suspensionReason === "string"
          ? input.suspensionReason.trim().slice(0, 240)
          : "";
      nextUser.suspensionReason = nextReason ? nextReason : null;
    }

    nextUser.updatedAt = new Date().toISOString();

    try {
      wroteCloudUser = await writeCloudUser(nextUser);
    } catch {
      // Keep local write as source of truth when cloud sync fails.
    }

    upsertUserInList(users, nextUser);
    await writeLocalUsers(users, { skipUnsafeLocalWrite: wroteCloudUser });
    return nextUser;
  });
}

export async function markUserEmailVerified(input: {
  userId: string;
  email: string;
}) {
  const normalizedId = String(input.userId ?? "").trim();
  const normalizedEmail = normalizeEmailAddress(input.email);

  if (!normalizedId || !normalizedEmail) {
    return { status: "invalid" as const, user: null };
  }

  return runExclusive(async () => {
    const users = await readLocalUsers();
    const cloudUser = await readCloudUserById(normalizedId);
    let wroteCloudUser = false;
    const user =
      cloudUser ??
      users.find((entry) => entry.id === normalizedId || entry.email === normalizedEmail) ??
      null;

    if (!user || user.email !== normalizedEmail) {
      return { status: "not_found" as const, user: null };
    }

    if (user.emailVerified) {
      upsertUserInList(users, user);
      await writeLocalUsers(users, { skipUnsafeLocalWrite: true });
      return { status: "already_verified" as const, user };
    }

    const now = new Date().toISOString();
    const nextUser: StoredUser = {
      ...user,
      emailVerified: true,
      emailVerifiedAt: now,
      updatedAt: now
    };

    try {
      wroteCloudUser = await writeCloudUser(nextUser);
    } catch {
      // Keep local write as source of truth when cloud sync fails.
    }

    upsertUserInList(users, nextUser);
    await writeLocalUsers(users, { skipUnsafeLocalWrite: wroteCloudUser });
    return { status: "verified" as const, user: nextUser };
  });
}
