import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeEmailAddress, sanitizeDisplayName } from "@/lib/auth-validation";

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

const DATA_STORE_DIR = path.resolve(process.cwd(), process.env.POKEDEX_DATA_DIR?.trim() || ".data");
const USER_STORE_FILE = path.join(DATA_STORE_DIR, "users.json");
let writeQueue: Promise<unknown> = Promise.resolve();

function runExclusive<T>(task: () => Promise<T>) {
  const next = writeQueue.then(task, task);
  writeQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

async function ensureStoreFile() {
  await mkdir(path.dirname(USER_STORE_FILE), { recursive: true });
  try {
    await readFile(USER_STORE_FILE, "utf-8");
  } catch {
    await writeFile(USER_STORE_FILE, "[]", "utf-8");
  }
}

async function readUsers() {
  await ensureStoreFile();
  const raw = await readFile(USER_STORE_FILE, "utf-8");

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [] as StoredUser[];
    }
    return parsed as StoredUser[];
  } catch {
    return [] as StoredUser[];
  }
}

async function writeUsers(users: StoredUser[]) {
  await ensureStoreFile();
  await writeFile(USER_STORE_FILE, JSON.stringify(users, null, 2), "utf-8");
}

function mergeProvider(current: AuthProviderKind, incoming: AuthProviderKind): AuthProviderKind {
  if (current === incoming) {
    return current;
  }
  return "hybrid";
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = normalizeEmailAddress(email);
  const users = await readUsers();
  return users.find((user) => user.email === normalizedEmail) ?? null;
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

  const users = await readUsers();
  return users.find((user) => user.id === normalizedId) ?? null;
}

export async function registerCredentialsUser(input: {
  email: string;
  passwordHash: string;
  name?: string;
}) {
  const normalizedEmail = normalizeEmailAddress(input.email);
  const resolvedName = sanitizeDisplayName(input.name ?? "", normalizedEmail);

  return runExclusive(async () => {
    const users = await readUsers();
    const now = new Date().toISOString();
    const existingUser = users.find((user) => user.email === normalizedEmail);

    if (existingUser) {
      if (existingUser.passwordHash) {
        return { status: "exists" as const, user: existingUser };
      }

      existingUser.passwordHash = input.passwordHash;
      existingUser.provider = mergeProvider(existingUser.provider, "credentials");
      existingUser.name = existingUser.name || resolvedName;
      existingUser.updatedAt = now;
      await writeUsers(users);
      return { status: "updated" as const, user: existingUser };
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
    users.push(user);
    await writeUsers(users);
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
  const image = input.image ?? null;

  return runExclusive(async () => {
    const users = await readUsers();
    const now = new Date().toISOString();
    const existingUser = users.find((user) => user.email === normalizedEmail);

    if (existingUser) {
      existingUser.provider = mergeProvider(existingUser.provider, "google");
      existingUser.name = resolvedName || existingUser.name;
      existingUser.image = image ?? existingUser.image;
      existingUser.updatedAt = now;
      await writeUsers(users);
      return existingUser;
    }

    const user: StoredUser = {
      id: randomUUID(),
      email: normalizedEmail,
      name: resolvedName,
      image,
      provider: "google",
      passwordHash: null,
      createdAt: now,
      updatedAt: now
    };

    users.push(user);
    await writeUsers(users);
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
    const users = await readUsers();
    const user = users.find((entry) => entry.id === normalizedId);
    if (!user) {
      return null;
    }

    const nextName = input.name?.trim();
    if (typeof nextName === "string" && nextName.length > 0) {
      user.name = sanitizeDisplayName(nextName, user.email);
    }

    if (input.image !== undefined) {
      user.image = input.image ?? null;
    }

    user.updatedAt = new Date().toISOString();
    await writeUsers(users);
    return user;
  });
}
