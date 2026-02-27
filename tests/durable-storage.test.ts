import assert from "node:assert/strict";
import { access, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const TEST_DATA_DIR = path.resolve(process.cwd(), ".data-persistence-test");
const ENV_KEYS = [
  "NODE_ENV",
  "POKEDEX_DATA_DIR",
  "AUTH_FIREBASE_SYNC_ENABLED",
  "PROFILE_FIREBASE_SYNC_ENABLED",
  "SOCIAL_FIREBASE_SYNC_ENABLED",
  "DATABASE_URL",
  "ALLOW_UNSAFE_LOCAL_PERSISTENCE"
] as const;

function saveEnv() {
  return new Map(ENV_KEYS.map((key) => [key, process.env[key]]));
}

function restoreEnv(snapshot: Map<string, string | undefined>) {
  for (const key of ENV_KEYS) {
    const value = snapshot.get(key);
    if (value === undefined) {
      delete process.env[key];
    } else {
      Reflect.set(process.env, key, value);
    }
  }
}

function setEnv(key: string, value: string) {
  Reflect.set(process.env, key, value);
}

async function resetDataDir() {
  await rm(TEST_DATA_DIR, { recursive: true, force: true });
  await mkdir(TEST_DATA_DIR, { recursive: true });
}

async function importFresh<T>(modulePath: string): Promise<T> {
  const fileUrl = pathToFileURL(path.resolve(process.cwd(), modulePath)).href;
  return import(`${fileUrl}?ts=${Date.now()}-${Math.random()}`) as Promise<T>;
}

test("registerCredentialsUser refuses unsafe local-only persistence in production", async () => {
  const envSnapshot = saveEnv();
  await resetDataDir();

  setEnv("NODE_ENV", "production");
  setEnv("POKEDEX_DATA_DIR", TEST_DATA_DIR);
  setEnv("AUTH_FIREBASE_SYNC_ENABLED", "0");
  setEnv("PROFILE_FIREBASE_SYNC_ENABLED", "0");
  setEnv("SOCIAL_FIREBASE_SYNC_ENABLED", "0");
  delete process.env.DATABASE_URL;
  delete process.env.ALLOW_UNSAFE_LOCAL_PERSISTENCE;

  try {
    const userStore = await importFresh<typeof import("../lib/user-store")>("lib/user-store.ts");

    await assert.rejects(
      () =>
        userStore.registerCredentialsUser({
          email: "prod-storage@test.local",
          passwordHash: "hash",
          name: "Prod Guard"
        }),
      /Persistent account storage is unavailable/
    );

    const usersFile = path.join(TEST_DATA_DIR, "users.json");
    const raw = await readFile(usersFile, "utf-8");
    assert.equal(raw.includes("prod-storage@test.local"), false);
  } finally {
    restoreEnv(envSnapshot);
  }
});

test("touchSocialPresence falls back to an in-memory timestamp when durable storage is unavailable", async () => {
  const envSnapshot = saveEnv();
  await resetDataDir();

  setEnv("NODE_ENV", "production");
  setEnv("POKEDEX_DATA_DIR", TEST_DATA_DIR);
  setEnv("AUTH_FIREBASE_SYNC_ENABLED", "0");
  setEnv("PROFILE_FIREBASE_SYNC_ENABLED", "0");
  setEnv("SOCIAL_FIREBASE_SYNC_ENABLED", "0");
  delete process.env.DATABASE_URL;
  delete process.env.ALLOW_UNSAFE_LOCAL_PERSISTENCE;

  try {
    const socialService = await importFresh<typeof import("../lib/social-service")>("lib/social-service.ts");
    const record = await socialService.touchSocialPresence("trainer-prod");

    assert.equal(record.userId, "trainer-prod");
    assert.equal(typeof record.lastActiveAt, "string");
    assert.ok(Date.parse(record.lastActiveAt) > 0);

    const presenceFile = path.join(TEST_DATA_DIR, "social-presence.json");
    await access(presenceFile);
    const raw = await readFile(presenceFile, "utf-8");
    assert.equal(raw.includes("trainer-prod"), false);
  } finally {
    restoreEnv(envSnapshot);
  }
});

test("unsafe local persistence can still be enabled explicitly for local smoke tests", async () => {
  const envSnapshot = saveEnv();
  await resetDataDir();

  setEnv("NODE_ENV", "production");
  setEnv("POKEDEX_DATA_DIR", TEST_DATA_DIR);
  setEnv("AUTH_FIREBASE_SYNC_ENABLED", "0");
  setEnv("PROFILE_FIREBASE_SYNC_ENABLED", "0");
  setEnv("SOCIAL_FIREBASE_SYNC_ENABLED", "0");
  setEnv("ALLOW_UNSAFE_LOCAL_PERSISTENCE", "1");
  delete process.env.DATABASE_URL;

  try {
    const userStore = await importFresh<typeof import("../lib/user-store")>("lib/user-store.ts");
    const result = await userStore.registerCredentialsUser({
      email: "allowed-local@test.local",
      passwordHash: "hash",
      name: "Allowed Local"
    });

    assert.equal(result.status, "created");

    const usersFile = path.join(TEST_DATA_DIR, "users.json");
    const raw = await readFile(usersFile, "utf-8");
    assert.equal(raw.includes("allowed-local@test.local"), true);
  } finally {
    restoreEnv(envSnapshot);
  }
});
