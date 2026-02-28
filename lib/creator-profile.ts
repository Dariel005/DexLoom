import { findUserByEmail, listStoredUsers } from "@/lib/user-store";
import { normalizeUserRole } from "@/lib/roles";

const CREATOR_CACHE_TTL_MS = 60_000;

let creatorUserIdsCache = new Set<string>();
let creatorCacheExpiresAt = 0;

function readEnvValue(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
}

async function resolveCreatorUserIdsUncached() {
  const creatorIds = new Set<string>();
  const explicitUserId = readEnvValue("CREATOR_USER_ID", "NEXT_PUBLIC_CREATOR_USER_ID");
  if (explicitUserId) {
    creatorIds.add(explicitUserId);
  }

  const explicitEmail = readEnvValue("CREATOR_EMAIL", "NEXT_PUBLIC_CREATOR_EMAIL");
  if (explicitEmail) {
    const matchedUser = await findUserByEmail(explicitEmail);
    if (matchedUser?.id) {
      creatorIds.add(matchedUser.id);
    }
  }

  const users = await listStoredUsers();
  users.forEach((user) => {
    if (normalizeUserRole(user.role) === "creator") {
      creatorIds.add(user.id);
    }
  });

  if (creatorIds.size > 0) {
    return creatorIds;
  }

  if (users.length === 0) {
    return creatorIds;
  }

  const sortedByOldest = users.slice().sort((a, b) => {
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
    return left - right;
  });

  if (sortedByOldest[0]?.id) {
    creatorIds.add(sortedByOldest[0].id);
  }

  return creatorIds;
}

async function getCreatorUserIds() {
  const now = Date.now();
  if (now < creatorCacheExpiresAt) {
    return creatorUserIdsCache;
  }

  creatorUserIdsCache = await resolveCreatorUserIdsUncached();
  creatorCacheExpiresAt = now + CREATOR_CACHE_TTL_MS;
  return creatorUserIdsCache;
}

export async function getCreatorUserId() {
  const creatorIds = await getCreatorUserIds();
  return creatorIds.values().next().value ?? null;
}

export async function isCreatorUserId(userId: string | null | undefined) {
  const normalizedUserId = String(userId ?? "").trim();
  if (!normalizedUserId) {
    return false;
  }

  const creatorIds = await getCreatorUserIds();
  return creatorIds.has(normalizedUserId);
}
