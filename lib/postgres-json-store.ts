import { Pool } from "pg";

const TABLE_NAME = "pokedex_json_store";
let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

function getDatabaseUrl() {
  const value = String(process.env.DATABASE_URL ?? "").trim();
  return value.length > 0 ? value : null;
}

function getSslOption() {
  const mode = String(process.env.PGSSLMODE ?? "").toLowerCase();
  if (mode === "disable") {
    return false;
  }
  return { rejectUnauthorized: false };
}

function getPool() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: getSslOption()
    });
  }

  return pool;
}

async function ensureInitialized() {
  const db = getPool();
  if (!db) {
    return false;
  }

  if (!initPromise) {
    initPromise = db
      .query(
        `
          CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
            store_key TEXT PRIMARY KEY,
            rows JSONB NOT NULL DEFAULT '[]'::jsonb,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `
      )
      .then(() => undefined);
  }

  try {
    await initPromise;
    return true;
  } catch {
    initPromise = null;
    return false;
  }
}

function normalizeArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export function isPostgresJsonStoreEnabled() {
  return Boolean(getDatabaseUrl());
}

export async function readPostgresJsonArray(storeKey: string) {
  const normalizedKey = String(storeKey ?? "").trim();
  if (!normalizedKey) {
    return [] as unknown[];
  }

  const ready = await ensureInitialized();
  const db = getPool();
  if (!ready || !db) {
    return null;
  }

  try {
    const result = await db.query<{ rows: unknown }>(
      `SELECT rows FROM ${TABLE_NAME} WHERE store_key = $1 LIMIT 1`,
      [normalizedKey]
    );
    if (result.rowCount === 0) {
      return [] as unknown[];
    }
    return normalizeArray(result.rows[0]?.rows);
  } catch {
    return null;
  }
}

export async function writePostgresJsonArray(storeKey: string, rows: unknown[]) {
  const normalizedKey = String(storeKey ?? "").trim();
  if (!normalizedKey) {
    return false;
  }

  const ready = await ensureInitialized();
  const db = getPool();
  if (!ready || !db) {
    return false;
  }

  try {
    await db.query(
      `
        INSERT INTO ${TABLE_NAME} (store_key, rows, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (store_key)
        DO UPDATE SET rows = EXCLUDED.rows, updated_at = NOW()
      `,
      [normalizedKey, JSON.stringify(normalizeArray(rows))]
    );
    return true;
  } catch {
    return false;
  }
}
