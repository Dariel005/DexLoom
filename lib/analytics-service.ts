import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { cpus, totalmem } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { performance } from "node:perf_hooks";
import type { AdminOverviewPayload } from "@/lib/admin-types";
import {
  isFirebaseAdminConfigured,
  isFirebaseProfileSyncEnabled,
  isFirebaseSocialSyncEnabled
} from "@/lib/firebase-admin";
import { isPostgresJsonStoreEnabled, readPostgresJsonArray, writePostgresJsonArray } from "@/lib/postgres-json-store";
import { resolveDataStoreDir } from "@/lib/runtime-storage";
import { listStoredUsers } from "@/lib/user-store";

type AnalyticsEventType = "pageview" | "heartbeat" | "leave";

interface AnalyticsSessionRecord {
  id: string;
  userId: string | null;
  startedAt: string;
  lastSeenAt: string;
  endedAt: string | null;
  pageViews: number;
  entryPath: string;
  lastPath: string;
}

interface AnalyticsPageViewRecord {
  id: string;
  sessionId: string;
  userId: string | null;
  path: string;
  referrer: string | null;
  createdAt: string;
}

export interface AnalyticsTrackEventInput {
  type: AnalyticsEventType;
  sessionId: string;
  path?: string | null;
  referrer?: string | null;
  occurredAt?: string | null;
}

const DATA_STORE_DIR = resolveDataStoreDir();
const SESSION_STORE_FILE = path.join(DATA_STORE_DIR, "analytics-sessions.json");
const PAGEVIEW_STORE_FILE = path.join(DATA_STORE_DIR, "analytics-pageviews.json");
const SESSION_STORE_KEY = "analytics_sessions";
const PAGEVIEW_STORE_KEY = "analytics_pageviews";
const SESSION_STALE_MS = 5 * 60 * 1000;
const SESSION_MAX_DURATION_MS = 45 * 60 * 1000;
const MAX_STORED_SESSIONS = 6000;
const MAX_STORED_PAGEVIEWS = 12000;

let writeQueue: Promise<unknown> = Promise.resolve();

function runExclusive<T>(task: () => Promise<T>) {
  const next = writeQueue.then(task, task);
  writeQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function normalizeIsoDate(value: string | null | undefined, fallback: string) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return fallback;
  }

  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? fallback : new Date(parsed).toISOString();
}

function normalizeSessionId(value: string) {
  return value.trim().slice(0, 120);
}

function normalizePath(value: string | null | undefined) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return "/";
  }
  return raw.startsWith("/") ? raw.slice(0, 240) : `/${raw.slice(0, 239)}`;
}

function normalizeReferrer(value: string | null | undefined) {
  const raw = typeof value === "string" ? value.trim() : "";
  return raw ? raw.slice(0, 320) : null;
}

function toSafeTime(value: string | null | undefined) {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function trimNewest<T extends { createdAt?: string; startedAt?: string }>(rows: T[], max: number) {
  return rows
    .slice()
    .sort((a, b) => {
      const left = toSafeTime(a.createdAt ?? a.startedAt ?? null);
      const right = toSafeTime(b.createdAt ?? b.startedAt ?? null);
      return right - left;
    })
    .slice(0, max);
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

async function readArrayFile<T>(filePath: string, storeKey: string) {
  const pgRows = await readPostgresJsonArray(storeKey);
  if (pgRows !== null) {
    return (Array.isArray(pgRows) ? pgRows : []) as T[];
  }

  const available = await ensureStoreFile(filePath, "[]");
  if (!available) {
    return [] as T[];
  }

  try {
    const raw = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : ([] as T[]);
  } catch {
    return [] as T[];
  }
}

async function writeArrayFile<T>(filePath: string, rows: T[], storeKey: string) {
  const wroteToPg = await writePostgresJsonArray(storeKey, rows as unknown[]);
  if (wroteToPg) {
    return;
  }

  const available = await ensureStoreFile(filePath, "[]");
  if (!available) {
    return;
  }

  try {
    await writeFile(filePath, JSON.stringify(rows, null, 2), "utf-8");
  } catch {
    // Local analytics writes are best-effort only.
  }
}

async function readSessionRecords() {
  return readArrayFile<AnalyticsSessionRecord>(SESSION_STORE_FILE, SESSION_STORE_KEY);
}

async function readPageViewRecords() {
  return readArrayFile<AnalyticsPageViewRecord>(PAGEVIEW_STORE_FILE, PAGEVIEW_STORE_KEY);
}

function createSessionRecord(input: {
  sessionId: string;
  userId: string | null;
  occurredAt: string;
  path: string;
}) {
  return {
    id: input.sessionId,
    userId: input.userId,
    startedAt: input.occurredAt,
    lastSeenAt: input.occurredAt,
    endedAt: null,
    pageViews: 0,
    entryPath: input.path,
    lastPath: input.path
  } satisfies AnalyticsSessionRecord;
}

export async function recordAnalyticsEvent(
  userId: string | null,
  input: AnalyticsTrackEventInput
) {
  const sessionId = normalizeSessionId(input.sessionId);
  if (!sessionId) {
    throw new Error("Missing analytics session id.");
  }

  const occurredAt = normalizeIsoDate(input.occurredAt ?? null, new Date().toISOString());
  const pathValue = normalizePath(input.path);
  const referrer = normalizeReferrer(input.referrer);

  return runExclusive(async () => {
    const [sessions, pageViews] = await Promise.all([readSessionRecords(), readPageViewRecords()]);
    const nextSessions = sessions.slice();
    const sessionIndex = nextSessions.findIndex((entry) => entry.id === sessionId);
    const session =
      sessionIndex >= 0
        ? { ...nextSessions[sessionIndex] }
        : createSessionRecord({
            sessionId,
            userId,
            occurredAt,
            path: pathValue
          });

    session.userId = userId ?? session.userId ?? null;
    session.lastSeenAt = occurredAt;
    session.lastPath = pathValue;

    if (input.type === "pageview") {
      session.pageViews += 1;
      session.endedAt = null;
      if (session.pageViews === 1) {
        session.entryPath = pathValue;
        session.startedAt = occurredAt;
      }

      pageViews.push({
        id: randomUUID(),
        sessionId,
        userId,
        path: pathValue,
        referrer,
        createdAt: occurredAt
      });
    }

    if (input.type === "leave") {
      session.endedAt = occurredAt;
    }

    if (sessionIndex >= 0) {
      nextSessions[sessionIndex] = session;
    } else {
      nextSessions.push(session);
    }

    await Promise.all([
      writeArrayFile(
        SESSION_STORE_FILE,
        trimNewest(nextSessions, MAX_STORED_SESSIONS),
        SESSION_STORE_KEY
      ),
      writeArrayFile(
        PAGEVIEW_STORE_FILE,
        trimNewest(pageViews, MAX_STORED_PAGEVIEWS),
        PAGEVIEW_STORE_KEY
      )
    ]);

    return {
      ok: true as const,
      sessionId,
      pageViews: session.pageViews
    };
  });
}

function createDateBuckets(days: number) {
  const buckets = new Map<string, { date: string; pageViews: number; registrations: number }>();
  const now = new Date();

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, { date: key, pageViews: 0, registrations: 0 });
  }

  return buckets;
}

function percent(value: number) {
  return Math.round(value * 10) / 10;
}

function clampSessionDurationMs(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.min(value, SESSION_MAX_DURATION_MS);
}

function getCompletedOrStaleSessions(rows: AnalyticsSessionRecord[], referenceTime = Date.now()) {
  return rows.filter((entry) => {
    if (entry.endedAt) {
      return true;
    }
    return referenceTime - toSafeTime(entry.lastSeenAt) > SESSION_STALE_MS;
  });
}

async function sampleCpuUsagePercent() {
  const snapshot = () => {
    return cpus()
      .reduce(
        (accumulator: { idle: number; total: number }, cpu: { times: Record<string, number> }) => {
          const total = Object.values(cpu.times).reduce((sum, value) => sum + value, 0);
          return {
            idle: accumulator.idle + cpu.times.idle,
            total: accumulator.total + total
          };
        },
        { idle: 0, total: 0 }
      );
  };

  const start = snapshot();
  await delay(120);
  const end = snapshot();
  const total = end.total - start.total;
  const idle = end.idle - start.idle;

  if (total <= 0) {
    return 0;
  }

  return percent((1 - idle / total) * 100);
}

async function resolveDatabaseHealth() {
  if (isPostgresJsonStoreEnabled()) {
    const startedAt = performance.now();
    const rows = await readPostgresJsonArray("users");
    const latencyMs = Math.round(performance.now() - startedAt);
    if (rows !== null) {
      return {
        state: "online" as const,
        label: "Postgres JSON Store",
        detail: `Operational, ${latencyMs}ms probe`
      };
    }

    return {
      state: "offline" as const,
      label: "Postgres JSON Store",
      detail: "Probe failed"
    };
  }

  if (isFirebaseAdminConfigured() && (isFirebaseProfileSyncEnabled() || isFirebaseSocialSyncEnabled())) {
    return {
      state: "degraded" as const,
      label: "Firestore Mirror",
      detail: "Sync enabled; local JSON remains the primary operational store"
    };
  }

  return {
    state: "degraded" as const,
    label: "Local JSON Store",
    detail: "Running without external database"
  };
}

export async function getAdminOverview(): Promise<AdminOverviewPayload> {
  const [users, sessions, pageViews] = await Promise.all([
    listStoredUsers(),
    readSessionRecords(),
    readPageViewRecords()
  ]);

  const now = Date.now();
  const last24Hours = now - 24 * 60 * 60 * 1000;
  const previous24Hours = last24Hours - 24 * 60 * 60 * 1000;
  const completedSessions = getCompletedOrStaleSessions(sessions, now);
  const previousRecentSessions = sessions.filter((entry) => {
    const time = toSafeTime(entry.lastSeenAt);
    return time >= previous24Hours && time < last24Hours;
  });

  const activeUsers = new Set(
    sessions
      .filter((entry) => now - toSafeTime(entry.lastSeenAt) <= SESSION_STALE_MS)
      .map((entry) => entry.userId ?? `guest:${entry.id}`)
  ).size;

  const previousActiveUsers = new Set(
    previousRecentSessions.map((entry) => entry.userId ?? `guest:${entry.id}`)
  ).size;

  const bouncedSessions = completedSessions.filter((entry) => entry.pageViews <= 1).length;
  const bounceRate =
    completedSessions.length > 0 ? (bouncedSessions / completedSessions.length) * 100 : 0;

  const previousCompletedSessions = getCompletedOrStaleSessions(
    sessions.filter((entry) => {
      const time = toSafeTime(entry.lastSeenAt);
      return time >= previous24Hours && time < last24Hours;
    }),
    last24Hours
  );
  const previousBounceRate =
    previousCompletedSessions.length > 0
      ? (previousCompletedSessions.filter((entry) => entry.pageViews <= 1).length /
          previousCompletedSessions.length) *
        100
      : 0;

  const sessionDurationMs =
    completedSessions.reduce((sum, entry) => {
      const endTime = entry.endedAt ? toSafeTime(entry.endedAt) : toSafeTime(entry.lastSeenAt);
      return sum + clampSessionDurationMs(endTime - toSafeTime(entry.startedAt));
    }, 0) / Math.max(1, completedSessions.length);

  const previousSessionDurationMs =
    previousCompletedSessions.reduce((sum, entry) => {
      const endTime = entry.endedAt ? toSafeTime(entry.endedAt) : toSafeTime(entry.lastSeenAt);
      return sum + clampSessionDurationMs(endTime - toSafeTime(entry.startedAt));
    }, 0) / Math.max(1, previousCompletedSessions.length);

  const trafficBuckets = createDateBuckets(7);
  pageViews.forEach((entry) => {
    const key = entry.createdAt.slice(0, 10);
    const bucket = trafficBuckets.get(key);
    if (bucket) {
      bucket.pageViews += 1;
    }
  });
  users.forEach((entry) => {
    const key = entry.createdAt.slice(0, 10);
    const bucket = trafficBuckets.get(key);
    if (bucket) {
      bucket.registrations += 1;
    }
  });

  const traffic = Array.from(trafficBuckets.values());
  const currentPageViews = pageViews.filter((entry) => toSafeTime(entry.createdAt) >= last24Hours).length;
  const previousPageViews = pageViews.filter((entry) => {
    const time = toSafeTime(entry.createdAt);
    return time >= previous24Hours && time < last24Hours;
  }).length;

  const startedAt = performance.now();
  const databaseHealthPromise = resolveDatabaseHealth();
  const cpuUsagePromise = sampleCpuUsagePercent();
  const memoryUsedMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
  const memoryTotalMb = Math.round(totalmem() / (1024 * 1024));
  const [databaseHealth, cpuUsagePercent] = await Promise.all([
    databaseHealthPromise,
    cpuUsagePromise
  ]);
  const responseLatencyMs = Math.round(performance.now() - startedAt);

  return {
    kpis: {
      totalUsers: users.length,
      activeUsers,
      bounceRate: percent(bounceRate),
      avgSessionMinutes: percent(sessionDurationMs / 60_000)
    },
    deltas: {
      activeUsers: activeUsers - previousActiveUsers,
      bounceRate: percent(bounceRate - previousBounceRate),
      avgSessionMinutes: percent((sessionDurationMs - previousSessionDurationMs) / 60_000),
      pageViews: currentPageViews - previousPageViews
    },
    traffic,
    system: {
      responseLatencyMs,
      cpuUsagePercent,
      memoryUsagePercent: percent((memoryUsedMb / Math.max(1, memoryTotalMb)) * 100),
      memoryUsedMb,
      memoryTotalMb,
      databaseState: databaseHealth.state,
      databaseLabel: databaseHealth.label,
      databaseDetail: databaseHealth.detail,
      serverTimestamp: new Date().toISOString()
    }
  };
}
