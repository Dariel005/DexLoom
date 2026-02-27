import { findUserByEmail, listStoredUsers } from "@/lib/user-store";

const CREATOR_CACHE_TTL_MS = 60_000;

let creatorUserIdCache: string | null = null;
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

async function resolveCreatorUserIdUncached() {
  const explicitUserId = readEnvValue("CREATOR_USER_ID", "NEXT_PUBLIC_CREATOR_USER_ID");
  if (explicitUserId) {
    return explicitUserId;
  }

  const explicitEmail = readEnvValue("CREATOR_EMAIL", "NEXT_PUBLIC_CREATOR_EMAIL");
  if (explicitEmail) {
    const matchedUser = await findUserByEmail(explicitEmail);
    if (matchedUser?.id) {
      return matchedUser.id;
    }
  }

  const users = await listStoredUsers();
  if (users.length === 0) {
    return null;
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

  return sortedByOldest[0]?.id ?? null;
}

export async function getCreatorUserId() {
  const now = Date.now();
  if (now < creatorCacheExpiresAt) {
    return creatorUserIdCache;
  }

  creatorUserIdCache = await resolveCreatorUserIdUncached();
  creatorCacheExpiresAt = now + CREATOR_CACHE_TTL_MS;
  return creatorUserIdCache;
}

export async function isCreatorUserId(userId: string | null | undefined) {
  const normalizedUserId = String(userId ?? "").trim();
  if (!normalizedUserId) {
    return false;
  }

  const creatorUserId = await getCreatorUserId();
  return Boolean(creatorUserId && creatorUserId === normalizedUserId);
}

