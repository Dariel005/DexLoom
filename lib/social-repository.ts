import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  getFirebaseFirestoreDb,
  isSocialDatabaseEnabled
} from "@/lib/firebase-admin";
import { assertCanUseUnsafeLocalPersistence } from "@/lib/durable-storage";
import { readPostgresJsonArray, writePostgresJsonArray } from "@/lib/postgres-json-store";
import { resolveDataStoreDir } from "@/lib/runtime-storage";
import {
  type FriendshipRecord,
  type SocialActivityKind,
  type SocialActivityRecord,
  type SocialBlockRecord,
  type SocialCommentRecord,
  type SocialNotificationKind,
  type SocialNotificationRecord,
  type SocialPresenceRecord,
  type SocialPostRecord,
  type SocialPrivacySettingsRecord,
  type SocialReportReason,
  type SocialReportStatus,
  type SocialReportRecord
} from "@/lib/social-types";

const DATA_STORE_DIR = resolveDataStoreDir();
const FRIENDSHIP_STORE_FILE = path.join(DATA_STORE_DIR, "friendships.json");
const SOCIAL_PRESENCE_STORE_FILE = path.join(DATA_STORE_DIR, "social-presence.json");
const SOCIAL_SETTINGS_STORE_FILE = path.join(DATA_STORE_DIR, "social-settings.json");
const SOCIAL_BLOCKS_STORE_FILE = path.join(DATA_STORE_DIR, "social-blocks.json");
const SOCIAL_REPORTS_STORE_FILE = path.join(DATA_STORE_DIR, "social-reports.json");
const SOCIAL_ACTIVITIES_STORE_FILE = path.join(DATA_STORE_DIR, "social-activities.json");
const SOCIAL_NOTIFICATIONS_STORE_FILE = path.join(DATA_STORE_DIR, "social-notifications.json");
const SOCIAL_POSTS_STORE_FILE = path.join(DATA_STORE_DIR, "social-posts.json");
const SOCIAL_COMMENTS_STORE_FILE = path.join(DATA_STORE_DIR, "social-comments.json");

type SocialStoreName =
  | "friendships"
  | "social_presence"
  | "social_settings"
  | "social_blocks"
  | "social_reports"
  | "social_activities"
  | "social_notifications"
  | "social_posts"
  | "social_comments";

const SOCIAL_STORE_COLLECTION = "social_store";

const DEFAULT_FRIEND_REQUEST_POLICY: SocialPrivacySettingsRecord["friendRequestPolicy"] = "everyone";
const DEFAULT_PRESENCE_VISIBILITY: SocialPrivacySettingsRecord["presenceVisibility"] = "friends";

const MAX_ACTIVITY_ROWS = 2000;
const ACTIVITY_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_NOTIFICATIONS_ROWS = 4000;
const NOTIFICATION_RETENTION_MS = 60 * 24 * 60 * 60 * 1000;
const MAX_POST_ROWS = 4000;
const MAX_COMMENT_ROWS = 12000;

let writeQueue: Promise<unknown> = Promise.resolve();

function runExclusive<T>(task: () => Promise<T>) {
  const next = writeQueue.then(task, task);
  writeQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function normalizeUserId(value: string) {
  return String(value ?? "").trim();
}

function normalizeRelationId(value: string) {
  return String(value ?? "").trim();
}

function sortPair(left: string, right: string) {
  return [left, right].sort((a, b) => a.localeCompare(b));
}

function isValidStatus(value: string): value is FriendshipRecord["status"] {
  return value === "pending" || value === "accepted";
}

function isValidFriendshipRecord(value: unknown): value is FriendshipRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Partial<FriendshipRecord>;
  if (
    typeof row.id !== "string" ||
    typeof row.userAId !== "string" ||
    typeof row.userBId !== "string" ||
    typeof row.requestedBy !== "string" ||
    typeof row.createdAt !== "string" ||
    typeof row.updatedAt !== "string"
  ) {
    return false;
  }

  if (row.userAId.trim().length === 0 || row.userBId.trim().length === 0 || row.userAId === row.userBId) {
    return false;
  }

  if (!isValidStatus(String(row.status ?? ""))) {
    return false;
  }

  if (row.requestedBy !== row.userAId && row.requestedBy !== row.userBId) {
    return false;
  }

  if (row.acceptedAt !== null && typeof row.acceptedAt !== "string") {
    return false;
  }

  return true;
}

function isValidPresenceRecord(value: unknown): value is SocialPresenceRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Partial<SocialPresenceRecord>;
  return typeof row.userId === "string" && typeof row.lastActiveAt === "string" && row.userId.trim().length > 0;
}

function isValidSettingsRecord(value: unknown): value is SocialPrivacySettingsRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Partial<SocialPrivacySettingsRecord>;
  return (
    typeof row.userId === "string" &&
    (row.friendRequestPolicy === "everyone" || row.friendRequestPolicy === "no_one") &&
    (row.presenceVisibility === "everyone" || row.presenceVisibility === "friends" || row.presenceVisibility === "no_one") &&
    typeof row.updatedAt === "string" &&
    row.userId.trim().length > 0
  );
}

function isValidBlockRecord(value: unknown): value is SocialBlockRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Partial<SocialBlockRecord>;
  return (
    typeof row.id === "string" &&
    typeof row.blockerUserId === "string" &&
    typeof row.blockedUserId === "string" &&
    typeof row.createdAt === "string" &&
    typeof row.updatedAt === "string" &&
    row.blockerUserId.trim().length > 0 &&
    row.blockedUserId.trim().length > 0 &&
    row.blockerUserId !== row.blockedUserId
  );
}

function isValidReportReason(value: string): value is SocialReportReason {
  return value === "spam" || value === "abuse" || value === "impersonation" || value === "other";
}

function isValidReportStatus(value: string): value is SocialReportStatus {
  return value === "open" || value === "resolved" || value === "dismissed";
}

function normalizeReportRecord(value: unknown): SocialReportRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const row = value as Partial<SocialReportRecord>;
  if (
    typeof row.id !== "string" ||
    typeof row.reporterUserId !== "string" ||
    typeof row.targetUserId !== "string" ||
    typeof row.createdAt !== "string" ||
    (row.notes !== null && row.notes !== undefined && typeof row.notes !== "string") ||
    !isValidReportReason(String(row.reason ?? "")) ||
    row.reporterUserId.trim().length === 0 ||
    row.targetUserId.trim().length === 0 ||
    row.reporterUserId === row.targetUserId
  ) {
    return null;
  }

  const statusRaw = String(row.status ?? "open");
  const status = isValidReportStatus(statusRaw) ? statusRaw : "open";
  const reviewedAt = row.reviewedAt && typeof row.reviewedAt === "string" ? row.reviewedAt : null;
  const reviewedByUserId =
    row.reviewedByUserId && typeof row.reviewedByUserId === "string" ? row.reviewedByUserId : null;
  const reviewNotes = row.reviewNotes && typeof row.reviewNotes === "string" ? row.reviewNotes : null;

  return {
    id: row.id,
    reporterUserId: row.reporterUserId,
    targetUserId: row.targetUserId,
    reason: row.reason as SocialReportReason,
    notes: row.notes ?? null,
    status,
    reviewedAt,
    reviewedByUserId,
    reviewNotes,
    createdAt: row.createdAt
  };
}

function isValidReportRecord(value: unknown): value is SocialReportRecord {
  return Boolean(normalizeReportRecord(value));
}

function isValidPostRecord(value: unknown): value is SocialPostRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Partial<SocialPostRecord>;
  return (
    typeof row.id === "string" &&
    typeof row.authorUserId === "string" &&
    typeof row.content === "string" &&
    typeof row.createdAt === "string" &&
    typeof row.updatedAt === "string" &&
    row.authorUserId.trim().length > 0 &&
    row.content.trim().length > 0
  );
}

function isValidCommentRecord(value: unknown): value is SocialCommentRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Partial<SocialCommentRecord>;
  return (
    typeof row.id === "string" &&
    typeof row.postId === "string" &&
    typeof row.authorUserId === "string" &&
    typeof row.content === "string" &&
    typeof row.createdAt === "string" &&
    typeof row.updatedAt === "string" &&
    row.postId.trim().length > 0 &&
    row.authorUserId.trim().length > 0 &&
    row.content.trim().length > 0
  );
}

function isValidNotificationKind(value: string): value is SocialNotificationKind {
  return (
    value === "incoming_friend_request" ||
    value === "friend_request_accepted" ||
    value === "friend_removed" ||
    value === "social_report_submitted"
  );
}

function isValidNotificationRecord(value: unknown): value is SocialNotificationRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Partial<SocialNotificationRecord>;
  return (
    typeof row.id === "string" &&
    typeof row.userId === "string" &&
    isValidNotificationKind(String(row.kind ?? "")) &&
    (row.actorUserId === null || row.actorUserId === undefined || typeof row.actorUserId === "string") &&
    typeof row.title === "string" &&
    (row.body === null || row.body === undefined || typeof row.body === "string") &&
    (row.href === null || row.href === undefined || typeof row.href === "string") &&
    (row.readAt === null || row.readAt === undefined || typeof row.readAt === "string") &&
    typeof row.createdAt === "string" &&
    row.userId.trim().length > 0 &&
    row.title.trim().length > 0
  );
}

function isValidActivityKind(value: string): value is SocialActivityKind {
  return (
    value === "friend_request_sent" ||
    value === "friend_request_accepted" ||
    value === "friend_removed" ||
    value === "favorite_added"
  );
}

function isValidActivityRecord(value: unknown): value is SocialActivityRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Partial<SocialActivityRecord>;
  return (
    typeof row.id === "string" &&
    isValidActivityKind(String(row.kind ?? "")) &&
    typeof row.actorUserId === "string" &&
    (row.targetUserId === null || typeof row.targetUserId === "string") &&
    (row.favoriteEntityType === null || typeof row.favoriteEntityType === "string") &&
    (row.favoriteEntityId === null || typeof row.favoriteEntityId === "string") &&
    (row.favoriteTitle === null || typeof row.favoriteTitle === "string") &&
    (row.favoriteHref === null || typeof row.favoriteHref === "string") &&
    typeof row.createdAt === "string" &&
    row.actorUserId.trim().length > 0
  );
}

async function ensureStoreFile(filePath: string) {
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
      await writeFile(filePath, "[]", "utf-8");
      return true;
    } catch {
      return false;
    }
  }
}

function canUseSocialDatabase() {
  return isSocialDatabaseEnabled() && Boolean(getFirebaseFirestoreDb());
}

async function readArrayFromDatabase(storeName: SocialStoreName) {
  const db = getFirebaseFirestoreDb();
  if (!db) {
    return [] as unknown[];
  }

  try {
    const doc = await db.collection(SOCIAL_STORE_COLLECTION).doc(storeName).get();
    if (!doc.exists) {
      return [] as unknown[];
    }
    const data = doc.data() as { rows?: unknown } | undefined;
    return Array.isArray(data?.rows) ? data.rows : [];
  } catch {
    return [] as unknown[];
  }
}

async function writeArrayToDatabase<T>(storeName: SocialStoreName, rows: T[]) {
  const db = getFirebaseFirestoreDb();
  if (!db) {
    return;
  }

  await db.collection(SOCIAL_STORE_COLLECTION).doc(storeName).set(
    {
      rows,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );
}

async function readArrayFromLocalFile(filePath: string, storeName: SocialStoreName) {
  const pgRows = await readPostgresJsonArray(`social:${storeName}`);
  if (pgRows !== null) {
    return Array.isArray(pgRows) ? pgRows : [];
  }

  const available = await ensureStoreFile(filePath);
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

async function writeArrayToLocalFile<T>(
  filePath: string,
  rows: T[],
  storeName: SocialStoreName,
  options?: {
    skipUnsafeLocalWrite?: boolean;
    errorMessage?: string;
  }
) {
  const wroteToPg = await writePostgresJsonArray(`social:${storeName}`, rows as unknown[]);
  if (wroteToPg) {
    return;
  }

  if (options?.skipUnsafeLocalWrite) {
    return;
  }

  assertCanUseUnsafeLocalPersistence(
    options?.errorMessage ?? "Persistent social storage is unavailable. Your changes were not saved."
  );

  const available = await ensureStoreFile(filePath);
  if (!available) {
    return;
  }

  try {
    await writeFile(filePath, JSON.stringify(rows, null, 2), "utf-8");
  } catch {
    // Local fallback should not fail requests in serverless.
  }
}

async function readArrayFile(filePath: string, storeName: SocialStoreName) {
  if (canUseSocialDatabase()) {
    const remoteRows = await readArrayFromDatabase(storeName);
    if (remoteRows.length > 0) {
      await writeArrayToLocalFile(filePath, remoteRows, storeName, {
        skipUnsafeLocalWrite: true
      });
      return remoteRows;
    }

    const localRows = await readArrayFromLocalFile(filePath, storeName);
    if (localRows.length > 0) {
      try {
        await writeArrayToDatabase(storeName, localRows);
      } catch {
        // Keep serving local data if cloud backfill fails in local/dev mode.
      }
      return localRows;
    }

    return remoteRows;
  }

  return readArrayFromLocalFile(filePath, storeName);
}

async function writeArrayFile<T>(
  filePath: string,
  rows: T[],
  storeName: SocialStoreName,
  options?: {
    skipUnsafeLocalWrite?: boolean;
    errorMessage?: string;
  }
) {
  let wroteRemote = false;
  if (canUseSocialDatabase()) {
    try {
      await writeArrayToDatabase(storeName, rows);
      wroteRemote = true;
    } catch {
      // Cloud write failed; continue to local fallback.
    }
  }

  await writeArrayToLocalFile(filePath, rows, storeName, {
    skipUnsafeLocalWrite: wroteRemote || options?.skipUnsafeLocalWrite,
    errorMessage: options?.errorMessage
  });

  if (wroteRemote) {
    return;
  }
}

async function readFriendships() {
  const rows = await readArrayFile(FRIENDSHIP_STORE_FILE, "friendships");
  return rows.filter(isValidFriendshipRecord);
}

async function writeFriendships(rows: FriendshipRecord[]) {
  await writeArrayFile(FRIENDSHIP_STORE_FILE, rows, "friendships", {
    errorMessage: "Persistent friendship storage is unavailable. Your changes were not saved."
  });
}

async function readPresenceRecords() {
  const rows = await readArrayFile(SOCIAL_PRESENCE_STORE_FILE, "social_presence");
  return rows.filter(isValidPresenceRecord);
}

async function writePresenceRecords(rows: SocialPresenceRecord[]) {
  await writeArrayFile(SOCIAL_PRESENCE_STORE_FILE, rows, "social_presence", {
    errorMessage: "Persistent presence storage is unavailable. Your changes were not saved."
  });
}

async function readSettingsRecords() {
  const rows = await readArrayFile(SOCIAL_SETTINGS_STORE_FILE, "social_settings");
  return rows.filter(isValidSettingsRecord);
}

async function writeSettingsRecords(rows: SocialPrivacySettingsRecord[]) {
  await writeArrayFile(SOCIAL_SETTINGS_STORE_FILE, rows, "social_settings", {
    errorMessage: "Persistent social settings storage is unavailable. Your changes were not saved."
  });
}

async function readBlockRecords() {
  const rows = await readArrayFile(SOCIAL_BLOCKS_STORE_FILE, "social_blocks");
  return rows.filter(isValidBlockRecord);
}

async function writeBlockRecords(rows: SocialBlockRecord[]) {
  await writeArrayFile(SOCIAL_BLOCKS_STORE_FILE, rows, "social_blocks", {
    errorMessage: "Persistent block list storage is unavailable. Your changes were not saved."
  });
}

async function readReportRecords() {
  const rows = await readArrayFile(SOCIAL_REPORTS_STORE_FILE, "social_reports");
  return rows
    .map((entry) => normalizeReportRecord(entry))
    .filter((entry): entry is SocialReportRecord => Boolean(entry));
}

async function writeReportRecords(rows: SocialReportRecord[]) {
  await writeArrayFile(SOCIAL_REPORTS_STORE_FILE, rows, "social_reports", {
    errorMessage: "Persistent moderation report storage is unavailable. Your changes were not saved."
  });
}

async function readActivityRecords() {
  const rows = await readArrayFile(SOCIAL_ACTIVITIES_STORE_FILE, "social_activities");
  return rows.filter(isValidActivityRecord);
}

async function writeActivityRecords(rows: SocialActivityRecord[]) {
  await writeArrayFile(SOCIAL_ACTIVITIES_STORE_FILE, rows, "social_activities", {
    errorMessage: "Persistent social activity storage is unavailable. Your changes were not saved."
  });
}

async function readNotificationRecords() {
  const rows = await readArrayFile(SOCIAL_NOTIFICATIONS_STORE_FILE, "social_notifications");
  return rows.filter(isValidNotificationRecord);
}

async function writeNotificationRecords(rows: SocialNotificationRecord[]) {
  await writeArrayFile(SOCIAL_NOTIFICATIONS_STORE_FILE, rows, "social_notifications", {
    errorMessage: "Persistent notification storage is unavailable. Your changes were not saved."
  });
}

async function readPostRecords() {
  const rows = await readArrayFile(SOCIAL_POSTS_STORE_FILE, "social_posts");
  return rows.filter(isValidPostRecord);
}

async function writePostRecords(rows: SocialPostRecord[]) {
  await writeArrayFile(SOCIAL_POSTS_STORE_FILE, rows, "social_posts", {
    errorMessage: "Persistent community post storage is unavailable. Your changes were not saved."
  });
}

async function readCommentRecords() {
  const rows = await readArrayFile(SOCIAL_COMMENTS_STORE_FILE, "social_comments");
  return rows.filter(isValidCommentRecord);
}

async function writeCommentRecords(rows: SocialCommentRecord[]) {
  await writeArrayFile(SOCIAL_COMMENTS_STORE_FILE, rows, "social_comments", {
    errorMessage: "Persistent community comment storage is unavailable. Your changes were not saved."
  });
}

function toSafeTime(value: string | null | undefined) {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortByUpdatedAtDesc(rows: FriendshipRecord[]) {
  return rows
    .slice()
    .sort((a, b) => {
      const timeA = toSafeTime(a.updatedAt);
      const timeB = toSafeTime(b.updatedAt);
      if (timeA === timeB) {
        return a.id.localeCompare(b.id);
      }
      return timeB - timeA;
    });
}

function sortByCreatedAtDesc<T extends { id: string; createdAt: string }>(rows: T[]) {
  return rows
    .slice()
    .sort((a, b) => {
      const delta = toSafeTime(b.createdAt) - toSafeTime(a.createdAt);
      if (delta !== 0) {
        return delta;
      }
      return a.id.localeCompare(b.id);
    });
}

function isUserInFriendship(record: FriendshipRecord, userId: string) {
  return record.userAId === userId || record.userBId === userId;
}

function isIncomingPending(record: FriendshipRecord, userId: string) {
  return record.status === "pending" && isUserInFriendship(record, userId) && record.requestedBy !== userId;
}

function isOutgoingPending(record: FriendshipRecord, userId: string) {
  return record.status === "pending" && isUserInFriendship(record, userId) && record.requestedBy === userId;
}

function buildSocialBlockId(blockerUserId: string, blockedUserId: string) {
  return `${blockerUserId}__${blockedUserId}`;
}

function createDefaultSettingsRecord(userId: string): SocialPrivacySettingsRecord {
  return {
    userId,
    friendRequestPolicy: DEFAULT_FRIEND_REQUEST_POLICY,
    presenceVisibility: DEFAULT_PRESENCE_VISIBILITY,
    updatedAt: new Date().toISOString()
  };
}

function pruneActivities(rows: SocialActivityRecord[]) {
  const cutoff = Date.now() - ACTIVITY_RETENTION_MS;
  const filtered = rows.filter((entry) => toSafeTime(entry.createdAt) >= cutoff);
  const sorted = sortByCreatedAtDesc(filtered);
  return sorted.slice(0, MAX_ACTIVITY_ROWS);
}

function pruneNotifications(rows: SocialNotificationRecord[]) {
  const cutoff = Date.now() - NOTIFICATION_RETENTION_MS;
  const filtered = rows.filter((entry) => toSafeTime(entry.createdAt) >= cutoff);
  const sorted = sortByCreatedAtDesc(filtered);
  return sorted.slice(0, MAX_NOTIFICATIONS_ROWS);
}

function prunePosts(rows: SocialPostRecord[]) {
  return sortByCreatedAtDesc(rows).slice(0, MAX_POST_ROWS);
}

function pruneComments(rows: SocialCommentRecord[]) {
  return sortByCreatedAtDesc(rows).slice(0, MAX_COMMENT_ROWS);
}

function buildCursor(createdAt: string, id: string) {
  return Buffer.from(`${createdAt}::${id}`, "utf-8").toString("base64");
}

function parseCursor(cursorRaw: string | null | undefined) {
  const cursor = String(cursorRaw ?? "").trim();
  if (!cursor) {
    return null;
  }

  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");
    const [createdAt, id] = decoded.split("::");
    if (!createdAt || !id) {
      return null;
    }
    return {
      createdAt,
      id
    };
  } catch {
    return null;
  }
}

function paginateByCursor<T extends { id: string; createdAt: string }>(
  rows: T[],
  cursorRaw: string | null | undefined,
  limitRaw: number
) {
  const sorted = sortByCreatedAtDesc(rows);
  const limit = Math.max(1, Math.min(120, Math.floor(limitRaw)));
  const cursor = parseCursor(cursorRaw);

  let startIndex = 0;
  if (cursor) {
    const cursorTime = toSafeTime(cursor.createdAt);
    startIndex = sorted.findIndex((entry) => {
      const time = toSafeTime(entry.createdAt);
      if (time < cursorTime) {
        return true;
      }
      if (time > cursorTime) {
        return false;
      }
      return entry.id.localeCompare(cursor.id) > 0;
    });

    if (startIndex < 0) {
      return {
        items: [] as T[],
        nextCursor: null as string | null
      };
    }
  }

  const items = sorted.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < sorted.length;
  const nextCursor =
    hasMore && items.length > 0
      ? buildCursor(items[items.length - 1].createdAt, items[items.length - 1].id)
      : null;

  return {
    items,
    nextCursor
  };
}

export function buildFriendshipId(userIdA: string, userIdB: string) {
  const left = normalizeUserId(userIdA);
  const right = normalizeUserId(userIdB);
  const [sortedLeft, sortedRight] = sortPair(left, right);
  return `${sortedLeft}__${sortedRight}`;
}

export function getOtherUserId(record: FriendshipRecord, userId: string) {
  if (record.userAId === userId) {
    return record.userBId;
  }
  if (record.userBId === userId) {
    return record.userAId;
  }
  return null;
}

export async function listFriendshipRecordsForUser(userIdRaw: string) {
  const userId = normalizeUserId(userIdRaw);
  if (!userId) {
    return [] as FriendshipRecord[];
  }

  const all = await readFriendships();
  const filtered = all.filter((entry) => isUserInFriendship(entry, userId));
  return sortByUpdatedAtDesc(filtered);
}

export async function getFriendshipRecordById(relationIdRaw: string) {
  const relationId = normalizeRelationId(relationIdRaw);
  if (!relationId) {
    return null;
  }

  const all = await readFriendships();
  return all.find((entry) => entry.id === relationId) ?? null;
}

export async function getFriendshipRecordBetweenUsers(userIdARaw: string, userIdBRaw: string) {
  const userIdA = normalizeUserId(userIdARaw);
  const userIdB = normalizeUserId(userIdBRaw);
  if (!userIdA || !userIdB || userIdA === userIdB) {
    return null;
  }

  const relationId = buildFriendshipId(userIdA, userIdB);
  return getFriendshipRecordById(relationId);
}

export async function removeFriendshipBetweenUsersRecord(userIdARaw: string, userIdBRaw: string) {
  const userIdA = normalizeUserId(userIdARaw);
  const userIdB = normalizeUserId(userIdBRaw);
  if (!userIdA || !userIdB || userIdA === userIdB) {
    return false;
  }

  const relationId = buildFriendshipId(userIdA, userIdB);
  return runExclusive(async () => {
    const all = await readFriendships();
    const next = all.filter((entry) => entry.id !== relationId);
    if (next.length === all.length) {
      return false;
    }

    await writeFriendships(next);
    return true;
  });
}

export async function requestFriendshipRecord(requesterIdRaw: string, targetUserIdRaw: string) {
  const requesterId = normalizeUserId(requesterIdRaw);
  const targetUserId = normalizeUserId(targetUserIdRaw);

  if (!requesterId || !targetUserId) {
    throw new Error("Invalid user ids for friendship request.");
  }
  if (requesterId === targetUserId) {
    throw new Error("You cannot send a friendship request to yourself.");
  }

  return runExclusive(async () => {
    const all = await readFriendships();
    const relationId = buildFriendshipId(requesterId, targetUserId);
    const index = all.findIndex((entry) => entry.id === relationId);
    const now = new Date().toISOString();

    if (index < 0) {
      const [userAId, userBId] = sortPair(requesterId, targetUserId);
      const record: FriendshipRecord = {
        id: relationId,
        userAId,
        userBId,
        requestedBy: requesterId,
        status: "pending",
        createdAt: now,
        updatedAt: now,
        acceptedAt: null
      };

      all.push(record);
      await writeFriendships(all);
      return record;
    }

    const existing = all[index];
    if (existing.status === "accepted") {
      return existing;
    }

    if (existing.requestedBy !== requesterId) {
      const next: FriendshipRecord = {
        ...existing,
        status: "accepted",
        updatedAt: now,
        acceptedAt: now
      };
      all[index] = next;
      await writeFriendships(all);
      return next;
    }

    return existing;
  });
}

export async function acceptIncomingFriendshipRecord(actorIdRaw: string, relationIdRaw: string) {
  const actorId = normalizeUserId(actorIdRaw);
  const relationId = normalizeRelationId(relationIdRaw);
  if (!actorId || !relationId) {
    return null;
  }

  return runExclusive(async () => {
    const all = await readFriendships();
    const index = all.findIndex((entry) => entry.id === relationId);
    if (index < 0) {
      return null;
    }

    const current = all[index];
    if (!isIncomingPending(current, actorId)) {
      return null;
    }

    const now = new Date().toISOString();
    const next: FriendshipRecord = {
      ...current,
      status: "accepted",
      updatedAt: now,
      acceptedAt: now
    };

    all[index] = next;
    await writeFriendships(all);
    return next;
  });
}

export async function rejectIncomingFriendshipRecord(actorIdRaw: string, relationIdRaw: string) {
  const actorId = normalizeUserId(actorIdRaw);
  const relationId = normalizeRelationId(relationIdRaw);
  if (!actorId || !relationId) {
    return false;
  }

  return runExclusive(async () => {
    const all = await readFriendships();
    const index = all.findIndex((entry) => entry.id === relationId);
    if (index < 0) {
      return false;
    }

    if (!isIncomingPending(all[index], actorId)) {
      return false;
    }

    const next = all.filter((entry) => entry.id !== relationId);
    await writeFriendships(next);
    return true;
  });
}

export async function cancelOutgoingFriendshipRecord(actorIdRaw: string, relationIdRaw: string) {
  const actorId = normalizeUserId(actorIdRaw);
  const relationId = normalizeRelationId(relationIdRaw);
  if (!actorId || !relationId) {
    return false;
  }

  return runExclusive(async () => {
    const all = await readFriendships();
    const index = all.findIndex((entry) => entry.id === relationId);
    if (index < 0) {
      return false;
    }

    if (!isOutgoingPending(all[index], actorId)) {
      return false;
    }

    const next = all.filter((entry) => entry.id !== relationId);
    await writeFriendships(next);
    return true;
  });
}

export async function removeAcceptedFriendshipRecord(actorIdRaw: string, relationIdRaw: string) {
  const actorId = normalizeUserId(actorIdRaw);
  const relationId = normalizeRelationId(relationIdRaw);
  if (!actorId || !relationId) {
    return false;
  }

  return runExclusive(async () => {
    const all = await readFriendships();
    const index = all.findIndex((entry) => entry.id === relationId);
    if (index < 0) {
      return false;
    }

    const current = all[index];
    if (current.status !== "accepted" || !isUserInFriendship(current, actorId)) {
      return false;
    }

    const next = all.filter((entry) => entry.id !== relationId);
    await writeFriendships(next);
    return true;
  });
}

export async function touchSocialPresenceRecord(userIdRaw: string) {
  const userId = normalizeUserId(userIdRaw);
  if (!userId) {
    throw new Error("Invalid user id for presence.");
  }

  return runExclusive(async () => {
    const all = await readPresenceRecords();
    const now = new Date().toISOString();
    const index = all.findIndex((entry) => entry.userId === userId);
    const nextRecord: SocialPresenceRecord = {
      userId,
      lastActiveAt: now
    };

    if (index >= 0) {
      all[index] = nextRecord;
    } else {
      all.push(nextRecord);
    }

    await writePresenceRecords(all);
    return nextRecord;
  });
}

export async function getSocialPresenceRecord(userIdRaw: string) {
  const userId = normalizeUserId(userIdRaw);
  if (!userId) {
    return null;
  }

  const all = await readPresenceRecords();
  return all.find((entry) => entry.userId === userId) ?? null;
}

export async function getSocialPrivacySettingsRecord(userIdRaw: string) {
  const userId = normalizeUserId(userIdRaw);
  if (!userId) {
    throw new Error("Invalid user id for social settings.");
  }

  const all = await readSettingsRecords();
  return all.find((entry) => entry.userId === userId) ?? createDefaultSettingsRecord(userId);
}

export async function upsertSocialPrivacySettingsRecord(
  userIdRaw: string,
  input: {
    friendRequestPolicy: SocialPrivacySettingsRecord["friendRequestPolicy"];
    presenceVisibility: SocialPrivacySettingsRecord["presenceVisibility"];
  }
) {
  const userId = normalizeUserId(userIdRaw);
  if (!userId) {
    throw new Error("Invalid user id for social settings.");
  }

  return runExclusive(async () => {
    const all = await readSettingsRecords();
    const now = new Date().toISOString();
    const index = all.findIndex((entry) => entry.userId === userId);
    const next: SocialPrivacySettingsRecord = {
      userId,
      friendRequestPolicy: input.friendRequestPolicy,
      presenceVisibility: input.presenceVisibility,
      updatedAt: now
    };

    if (index >= 0) {
      all[index] = next;
    } else {
      all.push(next);
    }

    await writeSettingsRecords(all);
    return next;
  });
}

export async function getBlockRelationBetweenUsers(viewerIdRaw: string, targetUserIdRaw: string) {
  const viewerId = normalizeUserId(viewerIdRaw);
  const targetUserId = normalizeUserId(targetUserIdRaw);
  if (!viewerId || !targetUserId || viewerId === targetUserId) {
    return {
      viewerBlockedTarget: false,
      targetBlockedViewer: false
    };
  }

  const all = await readBlockRecords();
  const viewerBlockedTarget = all.some(
    (entry) => entry.blockerUserId === viewerId && entry.blockedUserId === targetUserId
  );
  const targetBlockedViewer = all.some(
    (entry) => entry.blockerUserId === targetUserId && entry.blockedUserId === viewerId
  );

  return {
    viewerBlockedTarget,
    targetBlockedViewer
  };
}

export async function listBlockedUserIdsForViewer(userIdRaw: string) {
  const userId = normalizeUserId(userIdRaw);
  if (!userId) {
    return [] as string[];
  }

  const all = await readBlockRecords();
  const ids = new Set<string>();

  all.forEach((entry) => {
    if (entry.blockerUserId === userId) {
      ids.add(entry.blockedUserId);
    }
    if (entry.blockedUserId === userId) {
      ids.add(entry.blockerUserId);
    }
  });

  return Array.from(ids);
}

export async function listBlockedUsersByBlocker(userIdRaw: string) {
  const userId = normalizeUserId(userIdRaw);
  if (!userId) {
    return [] as SocialBlockRecord[];
  }

  const all = await readBlockRecords();
  return sortByCreatedAtDesc(all.filter((entry) => entry.blockerUserId === userId));
}

export async function blockUserRecord(blockerUserIdRaw: string, blockedUserIdRaw: string) {
  const blockerUserId = normalizeUserId(blockerUserIdRaw);
  const blockedUserId = normalizeUserId(blockedUserIdRaw);
  if (!blockerUserId || !blockedUserId || blockerUserId === blockedUserId) {
    throw new Error("Invalid social block payload.");
  }

  return runExclusive(async () => {
    const all = await readBlockRecords();
    const id = buildSocialBlockId(blockerUserId, blockedUserId);
    const now = new Date().toISOString();
    const index = all.findIndex((entry) => entry.id === id);

    if (index >= 0) {
      const existing = all[index];
      const next: SocialBlockRecord = {
        ...existing,
        updatedAt: now
      };
      all[index] = next;
      await writeBlockRecords(all);
      return next;
    }

    const next: SocialBlockRecord = {
      id,
      blockerUserId,
      blockedUserId,
      createdAt: now,
      updatedAt: now
    };
    all.push(next);
    await writeBlockRecords(all);
    return next;
  });
}

export async function unblockUserRecord(blockerUserIdRaw: string, blockedUserIdRaw: string) {
  const blockerUserId = normalizeUserId(blockerUserIdRaw);
  const blockedUserId = normalizeUserId(blockedUserIdRaw);
  if (!blockerUserId || !blockedUserId || blockerUserId === blockedUserId) {
    return false;
  }

  return runExclusive(async () => {
    const all = await readBlockRecords();
    const id = buildSocialBlockId(blockerUserId, blockedUserId);
    const next = all.filter((entry) => entry.id !== id);
    if (next.length === all.length) {
      return false;
    }

    await writeBlockRecords(next);
    return true;
  });
}

export async function createSocialReportRecord(input: {
  reporterUserId: string;
  targetUserId: string;
  reason: SocialReportReason;
  notes: string | null;
}) {
  const reporterUserId = normalizeUserId(input.reporterUserId);
  const targetUserId = normalizeUserId(input.targetUserId);
  if (!reporterUserId || !targetUserId || reporterUserId === targetUserId) {
    throw new Error("Invalid social report payload.");
  }

  return runExclusive(async () => {
    const all = await readReportRecords();
    const next: SocialReportRecord = {
      id: randomUUID(),
      reporterUserId,
      targetUserId,
      reason: input.reason,
      notes: input.notes,
      status: "open",
      reviewedAt: null,
      reviewedByUserId: null,
      reviewNotes: null,
      createdAt: new Date().toISOString()
    };
    all.push(next);
    await writeReportRecords(all);
    return next;
  });
}

export async function listSocialReportRecords(input: {
  status?: SocialReportStatus | null;
  limit: number;
  cursor?: string | null;
}) {
  const status = input.status ?? null;
  const all = await readReportRecords();
  const filtered =
    status === null ? all : all.filter((entry) => entry.status === status);
  return paginateByCursor(filtered, input.cursor ?? null, input.limit);
}

export async function getSocialReportRecordById(reportIdRaw: string) {
  const reportId = normalizeRelationId(reportIdRaw);
  if (!reportId) {
    return null;
  }

  const all = await readReportRecords();
  return all.find((entry) => entry.id === reportId) ?? null;
}

export async function reviewSocialReportRecord(input: {
  reportId: string;
  status: SocialReportStatus;
  reviewedByUserId: string;
  reviewNotes: string | null;
}) {
  const reportId = normalizeRelationId(input.reportId);
  const reviewedByUserId = normalizeUserId(input.reviewedByUserId);
  if (!reportId || !reviewedByUserId) {
    throw new Error("Invalid report review payload.");
  }

  return runExclusive(async () => {
    const all = await readReportRecords();
    const index = all.findIndex((entry) => entry.id === reportId);
    if (index < 0) {
      throw new Error("Report not found.");
    }

    const current = all[index];
    const next: SocialReportRecord = {
      ...current,
      status: input.status,
      reviewedAt: new Date().toISOString(),
      reviewedByUserId,
      reviewNotes: input.reviewNotes
    };

    all[index] = next;
    await writeReportRecords(all);
    return next;
  });
}

export async function appendSocialActivityRecord(input: {
  kind: SocialActivityKind;
  actorUserId: string;
  targetUserId?: string | null;
  favoriteEntityType?: string | null;
  favoriteEntityId?: string | null;
  favoriteTitle?: string | null;
  favoriteHref?: string | null;
}) {
  const actorUserId = normalizeUserId(input.actorUserId);
  const targetUserId = normalizeUserId(input.targetUserId ?? "") || null;
  if (!actorUserId) {
    throw new Error("Invalid social activity actor.");
  }

  return runExclusive(async () => {
    const all = await readActivityRecords();
    const nextRecord: SocialActivityRecord = {
      id: randomUUID(),
      kind: input.kind,
      actorUserId,
      targetUserId,
      favoriteEntityType: input.favoriteEntityType ?? null,
      favoriteEntityId: input.favoriteEntityId ?? null,
      favoriteTitle: input.favoriteTitle ?? null,
      favoriteHref: input.favoriteHref ?? null,
      createdAt: new Date().toISOString()
    };

    const nextRows = pruneActivities([nextRecord, ...all]);
    await writeActivityRecords(nextRows);
    return nextRecord;
  });
}

export async function listSocialActivityRecordsForActorsPaginated(input: {
  actorUserIds: string[];
  limit: number;
  cursor?: string | null;
}) {
  const actorUserIds = Array.from(
    new Set(input.actorUserIds.map((value) => normalizeUserId(value)).filter((value) => value.length > 0))
  );
  if (actorUserIds.length === 0) {
    return {
      items: [] as SocialActivityRecord[],
      nextCursor: null as string | null
    };
  }

  const limit = Math.max(1, Math.min(120, Math.floor(input.limit)));
  const activityRows = pruneActivities(await readActivityRecords());
  const actorRows = activityRows.filter((entry) => actorUserIds.includes(entry.actorUserId));
  return paginateByCursor(actorRows, input.cursor ?? null, limit);
}

export async function listSocialActivityRecordsForActors(actorUserIdsRaw: string[], limitRaw: number) {
  const page = await listSocialActivityRecordsForActorsPaginated({
    actorUserIds: actorUserIdsRaw,
    limit: limitRaw
  });
  return page.items;
}

export async function appendSocialNotificationRecord(input: {
  userId: string;
  kind: SocialNotificationKind;
  actorUserId?: string | null;
  title: string;
  body?: string | null;
  href?: string | null;
}) {
  const userId = normalizeUserId(input.userId);
  if (!userId) {
    throw new Error("Invalid social notification user.");
  }

  return runExclusive(async () => {
    const all = await readNotificationRecords();
    const nextRecord: SocialNotificationRecord = {
      id: randomUUID(),
      userId,
      kind: input.kind,
      actorUserId: normalizeUserId(input.actorUserId ?? "") || null,
      title: String(input.title ?? "").trim() || "Social notification",
      body: input.body ?? null,
      href: input.href ?? null,
      readAt: null,
      createdAt: new Date().toISOString()
    };
    const nextRows = pruneNotifications([nextRecord, ...all]);
    await writeNotificationRecords(nextRows);
    return nextRecord;
  });
}

export async function listSocialNotificationsByUser(input: {
  userId: string;
  limit: number;
  cursor?: string | null;
  unreadOnly?: boolean;
}) {
  const userId = normalizeUserId(input.userId);
  if (!userId) {
    return {
      items: [] as SocialNotificationRecord[],
      unreadCount: 0,
      nextCursor: null as string | null
    };
  }

  const all = pruneNotifications(await readNotificationRecords());
  const userRows = all.filter((entry) => entry.userId === userId);
  const unreadCount = userRows.filter((entry) => entry.readAt === null).length;
  const filtered = input.unreadOnly ? userRows.filter((entry) => entry.readAt === null) : userRows;
  const page = paginateByCursor(filtered, input.cursor ?? null, input.limit);
  return {
    items: page.items,
    unreadCount,
    nextCursor: page.nextCursor
  };
}

export async function markSocialNotificationReadState(input: {
  userId: string;
  notificationId: string;
  read: boolean;
}) {
  const userId = normalizeUserId(input.userId);
  const notificationId = normalizeRelationId(input.notificationId);
  if (!userId || !notificationId) {
    throw new Error("Invalid notification payload.");
  }

  return runExclusive(async () => {
    const all = await readNotificationRecords();
    const index = all.findIndex((entry) => entry.id === notificationId && entry.userId === userId);
    if (index < 0) {
      throw new Error("Notification not found.");
    }
    const current = all[index];
    const next: SocialNotificationRecord = {
      ...current,
      readAt: input.read ? current.readAt ?? new Date().toISOString() : null
    };
    all[index] = next;
    await writeNotificationRecords(pruneNotifications(all));
    return next;
  });
}

export async function markAllSocialNotificationsRead(userIdRaw: string) {
  const userId = normalizeUserId(userIdRaw);
  if (!userId) {
    return 0;
  }

  return runExclusive(async () => {
    const all = await readNotificationRecords();
    const now = new Date().toISOString();
    let updated = 0;
    const nextRows = all.map((entry) => {
      if (entry.userId !== userId || entry.readAt !== null) {
        return entry;
      }
      updated += 1;
      return {
        ...entry,
        readAt: now
      };
    });
    if (updated > 0) {
      await writeNotificationRecords(pruneNotifications(nextRows));
    }
    return updated;
  });
}

export async function listSocialPostRecordsPaginated(input: {
  limit: number;
  cursor?: string | null;
}) {
  const all = await readPostRecords();
  return paginateByCursor(all, input.cursor ?? null, input.limit);
}

export async function getSocialPostRecordById(postIdRaw: string) {
  const postId = normalizeRelationId(postIdRaw);
  if (!postId) {
    return null;
  }

  const all = await readPostRecords();
  return all.find((entry) => entry.id === postId) ?? null;
}

export async function createSocialPostRecord(input: {
  authorUserId: string;
  content: string;
}) {
  const authorUserId = normalizeUserId(input.authorUserId);
  const content = String(input.content ?? "").trim();
  if (!authorUserId || !content) {
    throw new Error("Invalid social post payload.");
  }

  return runExclusive(async () => {
    const all = await readPostRecords();
    const now = new Date().toISOString();
    const nextRecord: SocialPostRecord = {
      id: randomUUID(),
      authorUserId,
      content,
      createdAt: now,
      updatedAt: now
    };

    await writePostRecords(prunePosts([nextRecord, ...all]));
    return nextRecord;
  });
}

export async function deleteSocialPostRecord(postIdRaw: string) {
  const postId = normalizeRelationId(postIdRaw);
  if (!postId) {
    return {
      post: null as SocialPostRecord | null,
      deletedComments: 0
    };
  }

  return runExclusive(async () => {
    const [posts, comments] = await Promise.all([readPostRecords(), readCommentRecords()]);
    const post = posts.find((entry) => entry.id === postId) ?? null;
    if (!post) {
      return {
        post: null,
        deletedComments: 0
      };
    }

    const nextPosts = posts.filter((entry) => entry.id !== postId);
    const deletedComments = comments.filter((entry) => entry.postId === postId).length;
    const nextComments = comments.filter((entry) => entry.postId !== postId);

    await Promise.all([writePostRecords(nextPosts), writeCommentRecords(nextComments)]);
    return {
      post,
      deletedComments
    };
  });
}

export async function listSocialCommentRecordsByPostPaginated(input: {
  postId: string;
  limit: number;
  cursor?: string | null;
}) {
  const postId = normalizeRelationId(input.postId);
  if (!postId) {
    return {
      items: [] as SocialCommentRecord[],
      nextCursor: null as string | null
    };
  }

  const all = await readCommentRecords();
  const filtered = all.filter((entry) => entry.postId === postId);
  return paginateByCursor(filtered, input.cursor ?? null, input.limit);
}

export async function listSocialCommentRecordsByPostIds(postIdsRaw: string[]) {
  const postIds = new Set(
    postIdsRaw.map((value) => normalizeRelationId(value)).filter((value) => value.length > 0)
  );
  if (postIds.size === 0) {
    return [] as SocialCommentRecord[];
  }

  const all = await readCommentRecords();
  return sortByCreatedAtDesc(all.filter((entry) => postIds.has(entry.postId)));
}

export async function getSocialCommentRecordById(commentIdRaw: string) {
  const commentId = normalizeRelationId(commentIdRaw);
  if (!commentId) {
    return null;
  }

  const all = await readCommentRecords();
  return all.find((entry) => entry.id === commentId) ?? null;
}

export async function createSocialCommentRecord(input: {
  postId: string;
  authorUserId: string;
  content: string;
}) {
  const postId = normalizeRelationId(input.postId);
  const authorUserId = normalizeUserId(input.authorUserId);
  const content = String(input.content ?? "").trim();
  if (!postId || !authorUserId || !content) {
    throw new Error("Invalid social comment payload.");
  }

  return runExclusive(async () => {
    const all = await readCommentRecords();
    const now = new Date().toISOString();
    const nextRecord: SocialCommentRecord = {
      id: randomUUID(),
      postId,
      authorUserId,
      content,
      createdAt: now,
      updatedAt: now
    };

    await writeCommentRecords(pruneComments([nextRecord, ...all]));
    return nextRecord;
  });
}

export async function deleteSocialCommentRecord(commentIdRaw: string) {
  const commentId = normalizeRelationId(commentIdRaw);
  if (!commentId) {
    return null;
  }

  return runExclusive(async () => {
    const all = await readCommentRecords();
    const comment = all.find((entry) => entry.id === commentId) ?? null;
    if (!comment) {
      return null;
    }

    const nextRows = all.filter((entry) => entry.id !== commentId);
    await writeCommentRecords(nextRows);
    return comment;
  });
}
