import { getProfileRecord } from "@/lib/profile-repository";
import { getUserProfileForViewer } from "@/lib/profile-service";
import {
  acceptIncomingFriendshipRecord,
  appendSocialActivityRecord,
  appendSocialNotificationRecord,
  blockUserRecord,
  cancelOutgoingFriendshipRecord,
  createSocialReportRecord,
  getBlockRelationBetweenUsers,
  getFriendshipRecordBetweenUsers,
  getFriendshipRecordById,
  getOtherUserId,
  getSocialPresenceRecord,
  getSocialPrivacySettingsRecord,
  listBlockedUserIdsForViewer,
  listBlockedUsersByBlocker,
  listFriendshipRecordsForUser,
  listSocialActivityRecordsForActorsPaginated,
  listSocialNotificationsByUser,
  listSocialReportRecords,
  markAllSocialNotificationsRead,
  markSocialNotificationReadState,
  removeAcceptedFriendshipRecord,
  removeFriendshipBetweenUsersRecord,
  reviewSocialReportRecord,
  requestFriendshipRecord,
  rejectIncomingFriendshipRecord,
  touchSocialPresenceRecord,
  unblockUserRecord,
  upsertSocialPrivacySettingsRecord
} from "@/lib/social-repository";
import {
  type BlockedUserView,
  type FriendNetworkSnapshot,
  type FriendSearchResultItem,
  type FriendshipRelationStatus,
  type FriendshipRelationView,
  type FriendshipRecord,
  type SocialActivityView,
  type SocialHubPayload,
  type SocialNotificationListPayload,
  type SocialNotificationView,
  type SocialPresenceRecord,
  type SocialPresenceView,
  type SocialPrivacySettingsView,
  type SocialReportAdminView,
  type SocialReportListPayload,
  type SocialReportStatus,
  type SocialUserSummary
} from "@/lib/social-types";
import { findUserById, listStoredUsers } from "@/lib/user-store";

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;
const DEFAULT_HUB_SECTION_LIMIT = 20;
const DEFAULT_FEED_LIMIT = 20;
const DEFAULT_NOTIFICATIONS_LIMIT = 20;

function normalizeString(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toSafeTime(value: string | null | undefined) {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
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
    return { createdAt, id };
  } catch {
    return null;
  }
}

function paginateRowsByCursor<T extends { id: string; createdAt: string }>(
  rows: T[],
  cursorRaw: string | null | undefined,
  limitRaw: number
) {
  const limit = Math.max(1, Math.min(80, Math.floor(limitRaw)));
  const cursor = parseCursor(cursorRaw);
  const sorted = rows
    .slice()
    .sort((a, b) => {
      const delta = toSafeTime(b.createdAt) - toSafeTime(a.createdAt);
      if (delta !== 0) {
        return delta;
      }
      return a.id.localeCompare(b.id);
    });

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

function fuzzySubsequenceScore(needle: string, haystack: string) {
  if (!needle || !haystack) {
    return 0;
  }

  let ni = 0;
  let streak = 0;
  let score = 0;

  for (let hi = 0; hi < haystack.length && ni < needle.length; hi += 1) {
    if (needle[ni] === haystack[hi]) {
      streak += 1;
      score += 1 + streak;
      ni += 1;
    } else {
      streak = 0;
    }
  }

  return ni === needle.length ? score : 0;
}

function rankMatch(query: string, candidates: string[]) {
  let best = 0;

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    if (candidate === query) {
      best = Math.max(best, 1000);
      continue;
    }
    if (candidate.startsWith(query)) {
      best = Math.max(best, 800 - Math.abs(candidate.length - query.length));
      continue;
    }
    if (candidate.includes(query)) {
      best = Math.max(best, 600 - candidate.indexOf(query));
      continue;
    }

    const fuzzy = fuzzySubsequenceScore(query, candidate);
    if (fuzzy > 0) {
      best = Math.max(best, 300 + fuzzy);
    }
  }

  return best;
}

function fallbackDisplayName(userId: string, preferred?: string | null) {
  if (preferred && preferred.trim().length > 0) {
    return preferred.trim();
  }
  return `Trainer ${userId.slice(0, 6)}`;
}

function isPresenceOnline(lastActiveAt: string | null) {
  if (!lastActiveAt) {
    return false;
  }
  const parsed = Date.parse(lastActiveAt);
  if (Number.isNaN(parsed)) {
    return false;
  }
  return Date.now() - parsed <= ONLINE_THRESHOLD_MS;
}

function toPresenceView(record: SocialPresenceRecord | null | undefined): SocialPresenceView {
  const lastActiveAt = record?.lastActiveAt ?? null;
  return {
    state: isPresenceOnline(lastActiveAt) ? "online" : "offline",
    lastActiveAt
  };
}

function hiddenPresence(lastActiveAt: string | null = null): SocialPresenceView {
  return {
    state: "hidden",
    lastActiveAt
  };
}

function deriveRelationStatus(
  viewerId: string,
  targetUserId: string,
  record: FriendshipRecord | null,
  blockRelation: {
    viewerBlockedTarget: boolean;
    targetBlockedViewer: boolean;
  }
): FriendshipRelationView {
  if (viewerId === targetUserId) {
    return {
      relationId: null,
      userId: targetUserId,
      relationStatus: "self"
    };
  }

  if (blockRelation.viewerBlockedTarget) {
    return {
      relationId: null,
      userId: targetUserId,
      relationStatus: "blocked_by_you"
    };
  }

  if (blockRelation.targetBlockedViewer) {
    return {
      relationId: null,
      userId: targetUserId,
      relationStatus: "blocked_you"
    };
  }

  if (!record) {
    return {
      relationId: null,
      userId: targetUserId,
      relationStatus: "none"
    };
  }

  if (record.status === "accepted") {
    return {
      relationId: record.id,
      userId: targetUserId,
      relationStatus: "friends"
    };
  }

  return {
    relationId: record.id,
    userId: targetUserId,
    relationStatus: record.requestedBy === viewerId ? "outgoing_pending" : "incoming_pending"
  };
}

async function safeAppendActivity(input: {
  kind: "friend_request_sent" | "friend_request_accepted" | "friend_removed" | "favorite_added";
  actorUserId: string;
  targetUserId?: string | null;
  favoriteEntityType?: string | null;
  favoriteEntityId?: string | null;
  favoriteTitle?: string | null;
  favoriteHref?: string | null;
}) {
  try {
    await appendSocialActivityRecord(input);
  } catch {
    // Activity feed should not break core social actions.
  }
}

async function safeAppendNotification(input: {
  userId: string;
  kind: "incoming_friend_request" | "friend_request_accepted" | "friend_removed" | "social_report_submitted";
  actorUserId?: string | null;
  title: string;
  body?: string | null;
  href?: string | null;
}) {
  try {
    await appendSocialNotificationRecord(input);
  } catch {
    // Notifications should not break core social actions.
  }
}

async function resolveBaseSocialUserSummary(userIdRaw: string): Promise<Omit<SocialUserSummary, "presence"> | null> {
  const userId = String(userIdRaw ?? "").trim();
  if (!userId) {
    return null;
  }

  const [user, profile] = await Promise.all([findUserById(userId), getProfileRecord(userId)]);
  if (!user && !profile) {
    return null;
  }

  return {
    userId,
    displayName: fallbackDisplayName(userId, profile?.displayName ?? user?.name),
    avatarUrl: profile?.avatarUrl ?? user?.image ?? null,
    bio: profile?.bio ?? null,
    visibility: profile?.visibility ?? "private",
    profileHref: `/profile/${userId}`
  };
}

async function resolvePresenceForViewer(
  viewerIdRaw: string,
  targetUserIdRaw: string,
  relationRecord?: FriendshipRecord | null
): Promise<SocialPresenceView> {
  const viewerId = String(viewerIdRaw ?? "").trim();
  const targetUserId = String(targetUserIdRaw ?? "").trim();
  if (!viewerId || !targetUserId) {
    return hiddenPresence();
  }

  const presence = await getSocialPresenceRecord(targetUserId);

  if (viewerId === targetUserId) {
    return toPresenceView(presence);
  }

  const blockRelation = await getBlockRelationBetweenUsers(viewerId, targetUserId);
  if (blockRelation.viewerBlockedTarget || blockRelation.targetBlockedViewer) {
    return hiddenPresence(presence?.lastActiveAt ?? null);
  }

  const targetSettings = await getSocialPrivacySettingsRecord(targetUserId);
  if (targetSettings.presenceVisibility === "no_one") {
    return hiddenPresence(presence?.lastActiveAt ?? null);
  }

  if (targetSettings.presenceVisibility === "friends") {
    const relation = relationRecord ?? (await getFriendshipRecordBetweenUsers(viewerId, targetUserId));
    if (!relation || relation.status !== "accepted") {
      return hiddenPresence(presence?.lastActiveAt ?? null);
    }
  }

  return toPresenceView(presence);
}

function toSettingsView(record: {
  friendRequestPolicy: "everyone" | "no_one";
  presenceVisibility: "everyone" | "friends" | "no_one";
  updatedAt: string;
}): SocialPrivacySettingsView {
  return {
    friendRequestPolicy: record.friendRequestPolicy,
    presenceVisibility: record.presenceVisibility,
    updatedAt: record.updatedAt
  };
}

async function ensureSocialActionAllowed(userId: string, targetUserId: string, checkRequestPolicy = false) {
  const blockRelation = await getBlockRelationBetweenUsers(userId, targetUserId);
  if (blockRelation.viewerBlockedTarget) {
    throw new Error("You blocked this trainer.");
  }

  if (blockRelation.targetBlockedViewer) {
    throw new Error("This trainer blocked your account.");
  }

  if (checkRequestPolicy) {
    const targetSettings = await getSocialPrivacySettingsRecord(targetUserId);
    if (targetSettings.friendRequestPolicy === "no_one") {
      throw new Error("This trainer is not accepting friend requests.");
    }
  }

  return blockRelation;
}

export async function touchSocialPresence(userIdRaw: string) {
  const userId = String(userIdRaw ?? "").trim();
  if (!userId) {
    throw new Error("Invalid user id for presence.");
  }
  return touchSocialPresenceRecord(userId);
}

export async function resolveSocialUserSummary(
  userIdRaw: string,
  viewerIdRaw?: string | null,
  relationRecord?: FriendshipRecord | null
): Promise<SocialUserSummary | null> {
  const userId = String(userIdRaw ?? "").trim();
  if (!userId) {
    return null;
  }

  const base = await resolveBaseSocialUserSummary(userId);
  if (!base) {
    return null;
  }

  const viewerId = String(viewerIdRaw ?? "").trim();
  if (!viewerId) {
    return {
      ...base,
      presence: hiddenPresence()
    };
  }

  const presence = await resolvePresenceForViewer(viewerId, userId, relationRecord ?? null);
  return {
    ...base,
    presence
  };
}

export async function getFriendRelationForUser(viewerIdRaw: string, targetUserIdRaw: string) {
  const viewerId = String(viewerIdRaw ?? "").trim();
  const targetUserId = String(targetUserIdRaw ?? "").trim();

  if (!viewerId || !targetUserId) {
    throw new Error("Invalid user ids for relation lookup.");
  }

  const [relation, blockRelation] = await Promise.all([
    getFriendshipRecordBetweenUsers(viewerId, targetUserId),
    getBlockRelationBetweenUsers(viewerId, targetUserId)
  ]);

  return deriveRelationStatus(viewerId, targetUserId, relation, blockRelation);
}

export async function getBlockRelationForUsers(viewerIdRaw: string, targetUserIdRaw: string) {
  const viewerId = String(viewerIdRaw ?? "").trim();
  const targetUserId = String(targetUserIdRaw ?? "").trim();
  if (!viewerId || !targetUserId || viewerId === targetUserId) {
    return {
      viewerBlockedTarget: false,
      targetBlockedViewer: false,
      isBlocked: false
    };
  }

  const relation = await getBlockRelationBetweenUsers(viewerId, targetUserId);
  return {
    ...relation,
    isBlocked: relation.viewerBlockedTarget || relation.targetBlockedViewer
  };
}

export async function getFriendNetworkSnapshot(userIdRaw: string): Promise<FriendNetworkSnapshot> {
  const userId = String(userIdRaw ?? "").trim();
  if (!userId) {
    throw new Error("Invalid user id.");
  }

  const [relations, blockedUserIds] = await Promise.all([
    listFriendshipRecordsForUser(userId),
    listBlockedUserIdsForViewer(userId)
  ]);

  const blockedSet = new Set(blockedUserIds);
  const filteredRelations = relations.filter((entry) => {
    const otherUserId = getOtherUserId(entry, userId);
    return Boolean(otherUserId) && !blockedSet.has(otherUserId as string);
  });

  const relationByOtherUserId = new Map<string, FriendshipRecord>();
  filteredRelations.forEach((entry) => {
    const otherUserId = getOtherUserId(entry, userId);
    if (otherUserId) {
      relationByOtherUserId.set(otherUserId, entry);
    }
  });

  const summaryEntries = await Promise.all(
    Array.from(relationByOtherUserId.entries()).map(async ([otherUserId, relation]) => {
      const summary = await resolveSocialUserSummary(otherUserId, userId, relation);
      return [otherUserId, summary] as const;
    })
  );

  const summaryMap = new Map<string, SocialUserSummary>();
  summaryEntries.forEach(([otherUserId, summary]) => {
    if (summary) {
      summaryMap.set(otherUserId, summary);
    }
  });

  const friends = filteredRelations
    .filter((entry) => entry.status === "accepted")
    .map((entry) => {
      const otherUserId = getOtherUserId(entry, userId);
      if (!otherUserId) {
        return null;
      }

      const summary = summaryMap.get(otherUserId);
      if (!summary) {
        return null;
      }

      return {
        relationId: entry.id,
        since: entry.acceptedAt ?? entry.updatedAt,
        user: summary
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => toSafeTime(b.since) - toSafeTime(a.since));

  const incoming = filteredRelations
    .filter((entry) => entry.status === "pending" && entry.requestedBy !== userId)
    .map((entry) => {
      const otherUserId = getOtherUserId(entry, userId);
      if (!otherUserId) {
        return null;
      }

      const summary = summaryMap.get(otherUserId);
      if (!summary) {
        return null;
      }

      return {
        relationId: entry.id,
        requestedAt: entry.createdAt,
        user: summary
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => toSafeTime(b.requestedAt) - toSafeTime(a.requestedAt));

  const outgoing = filteredRelations
    .filter((entry) => entry.status === "pending" && entry.requestedBy === userId)
    .map((entry) => {
      const otherUserId = getOtherUserId(entry, userId);
      if (!otherUserId) {
        return null;
      }

      const summary = summaryMap.get(otherUserId);
      if (!summary) {
        return null;
      }

      return {
        relationId: entry.id,
        requestedAt: entry.createdAt,
        user: summary
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => toSafeTime(b.requestedAt) - toSafeTime(a.requestedAt));

  return {
    friends,
    incoming,
    outgoing
  };
}

export async function requestFriendship(userIdRaw: string, targetUserIdRaw: string) {
  const userId = String(userIdRaw ?? "").trim();
  const targetUserId = String(targetUserIdRaw ?? "").trim();
  if (!userId || !targetUserId) {
    throw new Error("Invalid user id for friendship request.");
  }

  const targetUser = await findUserById(targetUserId);
  if (!targetUser) {
    throw new Error("Target trainer does not exist.");
  }

  await ensureSocialActionAllowed(userId, targetUserId, true);

  const previousRelation = await getFriendshipRecordBetweenUsers(userId, targetUserId);
  const relation = await requestFriendshipRecord(userId, targetUserId);
  const relationView = deriveRelationStatus(userId, targetUserId, relation, {
    viewerBlockedTarget: false,
    targetBlockedViewer: false
  });

  if (!previousRelation && relationView.relationStatus === "outgoing_pending") {
    await safeAppendActivity({
      kind: "friend_request_sent",
      actorUserId: userId,
      targetUserId
    });
    await safeAppendNotification({
      userId: targetUserId,
      kind: "incoming_friend_request",
      actorUserId: userId,
      title: "New friend request",
      body: "A trainer sent you a friend request.",
      href: "/social"
    });
  } else if (
    previousRelation &&
    previousRelation.status === "pending" &&
    previousRelation.requestedBy === targetUserId &&
    relationView.relationStatus === "friends"
  ) {
    await safeAppendActivity({
      kind: "friend_request_accepted",
      actorUserId: userId,
      targetUserId
    });
    await safeAppendNotification({
      userId: targetUserId,
      kind: "friend_request_accepted",
      actorUserId: userId,
      title: "Friend request accepted",
      body: "Your friend request was accepted.",
      href: "/social"
    });
  }

  return relationView;
}

export async function acceptFriendship(userIdRaw: string, relationIdRaw: string) {
  const userId = String(userIdRaw ?? "").trim();
  const relationId = String(relationIdRaw ?? "").trim();
  if (!userId || !relationId) {
    throw new Error("Invalid accept payload.");
  }

  const existing = await getFriendshipRecordById(relationId);
  if (!existing) {
    throw new Error("Friendship request not found.");
  }

  const targetUserId = getOtherUserId(existing, userId);
  if (!targetUserId) {
    throw new Error("This friendship does not belong to the current user.");
  }

  await ensureSocialActionAllowed(userId, targetUserId);

  const accepted = await acceptIncomingFriendshipRecord(userId, relationId);
  if (!accepted) {
    throw new Error("Unable to accept this friendship request.");
  }

  await safeAppendActivity({
    kind: "friend_request_accepted",
    actorUserId: userId,
    targetUserId
  });
  await safeAppendNotification({
    userId: targetUserId,
    kind: "friend_request_accepted",
    actorUserId: userId,
    title: "Friend request accepted",
    body: "Your friend request was accepted.",
    href: "/social"
  });

  return deriveRelationStatus(userId, targetUserId, accepted, {
    viewerBlockedTarget: false,
    targetBlockedViewer: false
  });
}

export async function rejectFriendship(userIdRaw: string, relationIdRaw: string) {
  const userId = String(userIdRaw ?? "").trim();
  const relationId = String(relationIdRaw ?? "").trim();
  if (!userId || !relationId) {
    throw new Error("Invalid reject payload.");
  }

  const existing = await getFriendshipRecordById(relationId);
  if (!existing) {
    throw new Error("Friendship request not found.");
  }

  const targetUserId = getOtherUserId(existing, userId);
  if (!targetUserId) {
    throw new Error("This friendship does not belong to the current user.");
  }

  await ensureSocialActionAllowed(userId, targetUserId);

  const removed = await rejectIncomingFriendshipRecord(userId, relationId);
  if (!removed) {
    throw new Error("Unable to reject this friendship request.");
  }

  return deriveRelationStatus(userId, targetUserId, null, {
    viewerBlockedTarget: false,
    targetBlockedViewer: false
  });
}

export async function cancelFriendRequest(userIdRaw: string, relationIdRaw: string) {
  const userId = String(userIdRaw ?? "").trim();
  const relationId = String(relationIdRaw ?? "").trim();
  if (!userId || !relationId) {
    throw new Error("Invalid cancel payload.");
  }

  const existing = await getFriendshipRecordById(relationId);
  if (!existing) {
    throw new Error("Friendship request not found.");
  }

  const targetUserId = getOtherUserId(existing, userId);
  if (!targetUserId) {
    throw new Error("This friendship does not belong to the current user.");
  }

  await ensureSocialActionAllowed(userId, targetUserId);

  const removed = await cancelOutgoingFriendshipRecord(userId, relationId);
  if (!removed) {
    throw new Error("Unable to cancel this request.");
  }

  return deriveRelationStatus(userId, targetUserId, null, {
    viewerBlockedTarget: false,
    targetBlockedViewer: false
  });
}

export async function removeFriendship(userIdRaw: string, relationIdRaw: string) {
  const userId = String(userIdRaw ?? "").trim();
  const relationId = String(relationIdRaw ?? "").trim();
  if (!userId || !relationId) {
    throw new Error("Invalid remove payload.");
  }

  const existing = await getFriendshipRecordById(relationId);
  if (!existing) {
    throw new Error("Friendship not found.");
  }

  const targetUserId = getOtherUserId(existing, userId);
  if (!targetUserId) {
    throw new Error("This friendship does not belong to the current user.");
  }

  await ensureSocialActionAllowed(userId, targetUserId);

  const removed = await removeAcceptedFriendshipRecord(userId, relationId);
  if (!removed) {
    throw new Error("Unable to remove this friend.");
  }

  await safeAppendActivity({
    kind: "friend_removed",
    actorUserId: userId,
    targetUserId
  });
  await safeAppendNotification({
    userId: targetUserId,
    kind: "friend_removed",
    actorUserId: userId,
    title: "Friendship removed",
    body: "A friendship connection was removed.",
    href: "/social"
  });

  return deriveRelationStatus(userId, targetUserId, null, {
    viewerBlockedTarget: false,
    targetBlockedViewer: false
  });
}

export async function searchFriendCandidates(
  viewerIdRaw: string,
  queryRaw: string,
  limit: number
): Promise<FriendSearchResultItem[]> {
  const viewerId = String(viewerIdRaw ?? "").trim();
  if (!viewerId) {
    throw new Error("Invalid viewer id.");
  }

  const query = normalizeString(queryRaw);
  const safeLimit = Math.max(1, Math.min(40, Math.floor(limit)));
  if (!query) {
    return [];
  }

  const [users, relations, blockedUserIds] = await Promise.all([
    listStoredUsers(),
    listFriendshipRecordsForUser(viewerId),
    listBlockedUserIdsForViewer(viewerId)
  ]);

  const blockedSet = new Set(blockedUserIds);

  const relationMap = new Map<string, FriendshipRecord>();
  relations.forEach((entry) => {
    const otherUserId = getOtherUserId(entry, viewerId);
    if (otherUserId && !blockedSet.has(otherUserId)) {
      relationMap.set(otherUserId, entry);
    }
  });

  const candidateUsers = users
    .filter((entry) => entry.id !== viewerId && !blockedSet.has(entry.id))
    .sort((a, b) => toSafeTime(b.updatedAt) - toSafeTime(a.updatedAt));

  const scored: Array<{ score: number; updatedAt: string; item: FriendSearchResultItem }> = [];

  for (const user of candidateUsers) {
    const preScore = rankMatch(query, [
      normalizeString(user.name),
      normalizeString((user.email ?? "").split("@")[0] ?? "")
    ]);
    if (preScore <= 0) {
      continue;
    }

    const relationRecord = relationMap.get(user.id) ?? null;
    const summary = await resolveSocialUserSummary(user.id, viewerId, relationRecord);
    if (!summary) {
      continue;
    }

    const relation = deriveRelationStatus(viewerId, summary.userId, relationRecord, {
      viewerBlockedTarget: false,
      targetBlockedViewer: false
    });

    const searchTokens = [
      normalizeString(summary.displayName),
      normalizeString(user.name),
      normalizeString((user.email ?? "").split("@")[0] ?? "")
    ];
    const score = rankMatch(query, searchTokens);
    if (score <= 0) {
      continue;
    }

    scored.push({
      score,
      updatedAt: user.updatedAt,
      item: {
        user: summary,
        relationId: relation.relationId,
        relationStatus: relation.relationStatus
      }
    });
  }

  return scored
    .sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return toSafeTime(b.updatedAt) - toSafeTime(a.updatedAt);
    })
    .slice(0, safeLimit)
    .map((entry) => entry.item);
}

export async function lookupFriendCandidateByUserId(
  viewerIdRaw: string,
  targetUserIdRaw: string
): Promise<FriendSearchResultItem | null> {
  const viewerId = String(viewerIdRaw ?? "").trim();
  const targetUserId = String(targetUserIdRaw ?? "").trim();
  if (!viewerId || !targetUserId) {
    throw new Error("Invalid user id.");
  }

  const blockRelation = await getBlockRelationBetweenUsers(viewerId, targetUserId);
  if (blockRelation.viewerBlockedTarget || blockRelation.targetBlockedViewer) {
    return null;
  }

  const relation = await getFriendshipRecordBetweenUsers(viewerId, targetUserId);
  const summary = await resolveSocialUserSummary(targetUserId, viewerId, relation);

  if (!summary) {
    return null;
  }

  const relationView = deriveRelationStatus(viewerId, targetUserId, relation, {
    viewerBlockedTarget: false,
    targetBlockedViewer: false
  });

  return {
    user: summary,
    relationId: relationView.relationId,
    relationStatus: relationView.relationStatus
  };
}

async function getBlockedUsersForViewer(userId: string): Promise<BlockedUserView[]> {
  const blockRecords = await listBlockedUsersByBlocker(userId);
  const rows = await Promise.all(
    blockRecords.map(async (entry) => {
      const summary = await resolveSocialUserSummary(entry.blockedUserId, userId, null);
      if (!summary) {
        return null;
      }
      return {
        user: summary,
        blockedAt: entry.createdAt
      };
    })
  );

  return rows.filter((entry): entry is BlockedUserView => Boolean(entry));
}

export async function getSocialFeedPageForUser(
  userIdRaw: string,
  input?: {
    limit?: number;
    cursor?: string | null;
  }
): Promise<{ items: SocialActivityView[]; nextCursor: string | null }> {
  const userId = String(userIdRaw ?? "").trim();
  if (!userId) {
    throw new Error("Invalid user id.");
  }

  const limit = Math.max(1, Math.min(80, Math.floor(input?.limit ?? DEFAULT_FEED_LIMIT)));
  const [relations, blockedUserIds] = await Promise.all([
    listFriendshipRecordsForUser(userId),
    listBlockedUserIdsForViewer(userId)
  ]);

  const blockedSet = new Set(blockedUserIds);
  const actorUserIds = new Set<string>([userId]);

  relations.forEach((entry) => {
    if (entry.status !== "accepted") {
      return;
    }
    const otherUserId = getOtherUserId(entry, userId);
    if (!otherUserId || blockedSet.has(otherUserId)) {
      return;
    }
    actorUserIds.add(otherUserId);
  });

  const summaryCache = new Map<string, Promise<SocialUserSummary | null>>();
  const profileVisibilityCache = new Map<string, Promise<boolean>>();

  const getSummary = (targetUserId: string) => {
    const key = String(targetUserId);
    const cached = summaryCache.get(key);
    if (cached) {
      return cached;
    }
    const promise = resolveSocialUserSummary(key, userId, null);
    summaryCache.set(key, promise);
    return promise;
  };

  const canShowFavoriteEventsFromActor = (actorUserId: string) => {
    const key = String(actorUserId);
    const cached = profileVisibilityCache.get(key);
    if (cached) {
      return cached;
    }

    const promise = (async () => {
      if (actorUserId === userId) {
        return true;
      }
      const actorProfile = await getUserProfileForViewer({
        profileId: actorUserId,
        viewerId: userId
      });
      if (!actorProfile) {
        return false;
      }
      return actorProfile.showFavoritesOnPublic === true;
    })();

    profileVisibilityCache.set(key, promise);
    return promise;
  };

  const rows: SocialActivityView[] = [];
  let repositoryCursor = input?.cursor ?? null;
  let nextCursor: string | null = null;

  while (rows.length < limit) {
    const page = await listSocialActivityRecordsForActorsPaginated({
      actorUserIds: Array.from(actorUserIds),
      limit: Math.min(120, limit * 2),
      cursor: repositoryCursor
    });

    if (page.items.length === 0) {
      nextCursor = null;
      break;
    }

    for (const entry of page.items) {
      if (rows.length >= limit) {
        break;
      }

      if (blockedSet.has(entry.actorUserId)) {
        continue;
      }

      if (entry.targetUserId && blockedSet.has(entry.targetUserId)) {
        continue;
      }

      if (entry.kind === "favorite_added") {
        const canShowFavoriteEvent = await canShowFavoriteEventsFromActor(entry.actorUserId);
        if (!canShowFavoriteEvent) {
          continue;
        }
      }

      const actorSummary = await getSummary(entry.actorUserId);
      if (!actorSummary) {
        continue;
      }

      const targetSummary = entry.targetUserId ? await getSummary(entry.targetUserId) : null;

      const favorite =
        entry.favoriteEntityType &&
        entry.favoriteEntityId &&
        entry.favoriteTitle &&
        entry.favoriteHref
          ? {
              entityType: entry.favoriteEntityType,
              entityId: entry.favoriteEntityId,
              title: entry.favoriteTitle,
              href: entry.favoriteHref
            }
          : null;

      rows.push({
        id: entry.id,
        kind: entry.kind,
        actor: actorSummary,
        target: targetSummary,
        favorite,
        createdAt: entry.createdAt
      });
    }

    if (rows.length >= limit) {
      nextCursor = page.nextCursor;
      break;
    }

    if (!page.nextCursor) {
      nextCursor = null;
      break;
    }

    repositoryCursor = page.nextCursor;
  }

  return {
    items: rows,
    nextCursor
  };
}

export async function getSocialFeedForUser(userIdRaw: string, limitRaw = 48): Promise<SocialActivityView[]> {
  const page = await getSocialFeedPageForUser(userIdRaw, { limit: limitRaw });
  return page.items;
}

type FriendNetworkSection = "friends" | "incoming" | "outgoing";

export async function getFriendNetworkSectionPage(
  userIdRaw: string,
  section: FriendNetworkSection,
  input?: {
    limit?: number;
    cursor?: string | null;
  }
): Promise<{
  items:
    | FriendNetworkSnapshot["friends"]
    | FriendNetworkSnapshot["incoming"]
    | FriendNetworkSnapshot["outgoing"];
  nextCursor: string | null;
}> {
  const userId = String(userIdRaw ?? "").trim();
  if (!userId) {
    throw new Error("Invalid user id.");
  }

  const snapshot = await getFriendNetworkSnapshot(userId);
  const limit = input?.limit ?? DEFAULT_HUB_SECTION_LIMIT;
  const cursor = input?.cursor ?? null;

  if (section === "friends") {
    const page = paginateRowsByCursor(
      snapshot.friends.map((entry) => ({
        id: entry.relationId,
        createdAt: entry.since,
        value: entry
      })),
      cursor,
      limit
    );
    return {
      items: page.items.map((entry) => entry.value),
      nextCursor: page.nextCursor
    };
  }

  if (section === "incoming") {
    const page = paginateRowsByCursor(
      snapshot.incoming.map((entry) => ({
        id: entry.relationId,
        createdAt: entry.requestedAt,
        value: entry
      })),
      cursor,
      limit
    );
    return {
      items: page.items.map((entry) => entry.value),
      nextCursor: page.nextCursor
    };
  }

  const page = paginateRowsByCursor(
    snapshot.outgoing.map((entry) => ({
      id: entry.relationId,
      createdAt: entry.requestedAt,
      value: entry
    })),
    cursor,
    limit
  );
  return {
    items: page.items.map((entry) => entry.value),
    nextCursor: page.nextCursor
  };
}

export async function getSocialHubPayload(
  userIdRaw: string,
  options?: {
    friendsLimit?: number;
    incomingLimit?: number;
    outgoingLimit?: number;
    feedLimit?: number;
    friendsCursor?: string | null;
    incomingCursor?: string | null;
    outgoingCursor?: string | null;
    feedCursor?: string | null;
  }
): Promise<SocialHubPayload> {
  const userId = String(userIdRaw ?? "").trim();
  if (!userId) {
    throw new Error("Invalid user id.");
  }

  const [friendsPage, incomingPage, outgoingPage, settingsRecord, blocked, feedPage] = await Promise.all([
    getFriendNetworkSectionPage(userId, "friends", {
      limit: options?.friendsLimit ?? DEFAULT_HUB_SECTION_LIMIT,
      cursor: options?.friendsCursor ?? null
    }),
    getFriendNetworkSectionPage(userId, "incoming", {
      limit: options?.incomingLimit ?? DEFAULT_HUB_SECTION_LIMIT,
      cursor: options?.incomingCursor ?? null
    }),
    getFriendNetworkSectionPage(userId, "outgoing", {
      limit: options?.outgoingLimit ?? DEFAULT_HUB_SECTION_LIMIT,
      cursor: options?.outgoingCursor ?? null
    }),
    getSocialPrivacySettingsRecord(userId),
    getBlockedUsersForViewer(userId),
    getSocialFeedPageForUser(userId, {
      limit: options?.feedLimit ?? DEFAULT_FEED_LIMIT,
      cursor: options?.feedCursor ?? null
    })
  ]);

  return {
    snapshot: {
      friends: friendsPage.items as FriendNetworkSnapshot["friends"],
      incoming: incomingPage.items as FriendNetworkSnapshot["incoming"],
      outgoing: outgoingPage.items as FriendNetworkSnapshot["outgoing"]
    },
    settings: toSettingsView(settingsRecord),
    blocked,
    feed: feedPage.items,
    pagination: {
      friendsNextCursor: friendsPage.nextCursor,
      incomingNextCursor: incomingPage.nextCursor,
      outgoingNextCursor: outgoingPage.nextCursor,
      feedNextCursor: feedPage.nextCursor
    }
  };
}

export async function getSocialNotificationsForUser(
  userIdRaw: string,
  input?: {
    limit?: number;
    cursor?: string | null;
    unreadOnly?: boolean;
  }
): Promise<SocialNotificationListPayload> {
  const userId = String(userIdRaw ?? "").trim();
  if (!userId) {
    throw new Error("Invalid user id.");
  }

  const rows = await listSocialNotificationsByUser({
    userId,
    limit: input?.limit ?? DEFAULT_NOTIFICATIONS_LIMIT,
    cursor: input?.cursor ?? null,
    unreadOnly: input?.unreadOnly ?? false
  });

  const summaryCache = new Map<string, Promise<SocialUserSummary | null>>();
  const getSummary = (actorUserId: string | null) => {
    const key = String(actorUserId ?? "").trim();
    if (!key) {
      return Promise.resolve(null);
    }
    const cached = summaryCache.get(key);
    if (cached) {
      return cached;
    }
    const promise = resolveSocialUserSummary(key, userId, null);
    summaryCache.set(key, promise);
    return promise;
  };

  const items: SocialNotificationView[] = [];
  for (const entry of rows.items) {
    items.push({
      id: entry.id,
      kind: entry.kind,
      title: entry.title,
      body: entry.body,
      href: entry.href,
      readAt: entry.readAt,
      createdAt: entry.createdAt,
      actor: await getSummary(entry.actorUserId)
    });
  }

  return {
    items,
    unreadCount: rows.unreadCount,
    nextCursor: rows.nextCursor
  };
}

export async function updateSocialNotificationState(
  userIdRaw: string,
  input: {
    action: "mark_read" | "mark_unread" | "mark_all_read";
    notificationId?: string | null;
  }
) {
  const userId = String(userIdRaw ?? "").trim();
  if (!userId) {
    throw new Error("Invalid user id.");
  }

  if (input.action === "mark_all_read") {
    const updated = await markAllSocialNotificationsRead(userId);
    return { ok: true as const, updated };
  }

  const notificationId = String(input.notificationId ?? "").trim();
  if (!notificationId) {
    throw new Error("Missing notification id.");
  }

  const updated = await markSocialNotificationReadState({
    userId,
    notificationId,
    read: input.action === "mark_read"
  });
  return {
    ok: true as const,
    notification: updated
  };
}

export async function listSocialReportsForModerator(
  moderatorUserIdRaw: string,
  input?: {
    status?: SocialReportStatus | null;
    limit?: number;
    cursor?: string | null;
  }
): Promise<SocialReportListPayload> {
  const moderatorUserId = String(moderatorUserIdRaw ?? "").trim();
  if (!moderatorUserId) {
    throw new Error("Invalid moderator user id.");
  }

  const page = await listSocialReportRecords({
    status: input?.status ?? null,
    limit: input?.limit ?? 20,
    cursor: input?.cursor ?? null
  });

  const summaryCache = new Map<string, Promise<SocialUserSummary | null>>();
  const getSummary = (userId: string | null | undefined) => {
    const key = String(userId ?? "").trim();
    if (!key) {
      return Promise.resolve(null);
    }
    const cached = summaryCache.get(key);
    if (cached) {
      return cached;
    }
    const promise = resolveSocialUserSummary(key, moderatorUserId, null);
    summaryCache.set(key, promise);
    return promise;
  };

  const items: SocialReportAdminView[] = [];
  for (const report of page.items) {
    items.push({
      id: report.id,
      reason: report.reason,
      notes: report.notes,
      status: report.status,
      reviewedAt: report.reviewedAt,
      reviewedBy: await getSummary(report.reviewedByUserId),
      reviewNotes: report.reviewNotes,
      createdAt: report.createdAt,
      reporter: await getSummary(report.reporterUserId),
      target: await getSummary(report.targetUserId)
    });
  }

  return {
    items,
    nextCursor: page.nextCursor
  };
}

export async function reviewSocialReport(
  moderatorUserIdRaw: string,
  input: {
    reportId: string;
    action: "resolve" | "dismiss" | "reopen";
    notes: string | null;
  }
) {
  const moderatorUserId = String(moderatorUserIdRaw ?? "").trim();
  if (!moderatorUserId) {
    throw new Error("Invalid moderator user id.");
  }

  const status: SocialReportStatus =
    input.action === "resolve" ? "resolved" : input.action === "dismiss" ? "dismissed" : "open";
  return reviewSocialReportRecord({
    reportId: input.reportId,
    status,
    reviewedByUserId: moderatorUserId,
    reviewNotes: input.notes
  });
}

export async function updateSocialSettings(
  userIdRaw: string,
  input: {
    friendRequestPolicy: "everyone" | "no_one";
    presenceVisibility: "everyone" | "friends" | "no_one";
  }
): Promise<SocialPrivacySettingsView> {
  const userId = String(userIdRaw ?? "").trim();
  if (!userId) {
    throw new Error("Invalid user id.");
  }

  const updated = await upsertSocialPrivacySettingsRecord(userId, input);
  return toSettingsView(updated);
}

export async function blockUser(userIdRaw: string, targetUserIdRaw: string) {
  const userId = String(userIdRaw ?? "").trim();
  const targetUserId = String(targetUserIdRaw ?? "").trim();
  if (!userId || !targetUserId) {
    throw new Error("Invalid social block payload.");
  }
  if (userId === targetUserId) {
    throw new Error("You cannot block yourself.");
  }

  const targetUser = await findUserById(targetUserId);
  if (!targetUser) {
    throw new Error("Target trainer does not exist.");
  }

  await blockUserRecord(userId, targetUserId);
  await removeFriendshipBetweenUsersRecord(userId, targetUserId);

  return deriveRelationStatus(userId, targetUserId, null, {
    viewerBlockedTarget: true,
    targetBlockedViewer: false
  });
}

export async function unblockUser(userIdRaw: string, targetUserIdRaw: string) {
  const userId = String(userIdRaw ?? "").trim();
  const targetUserId = String(targetUserIdRaw ?? "").trim();
  if (!userId || !targetUserId) {
    throw new Error("Invalid social block payload.");
  }

  await unblockUserRecord(userId, targetUserId);

  const relation = await getFriendshipRecordBetweenUsers(userId, targetUserId);
  return deriveRelationStatus(userId, targetUserId, relation, {
    viewerBlockedTarget: false,
    targetBlockedViewer: false
  });
}

export async function reportUser(
  userIdRaw: string,
  input: {
    targetUserId: string;
    reason: "spam" | "abuse" | "impersonation" | "other";
    notes: string | null;
  }
) {
  const userId = String(userIdRaw ?? "").trim();
  const targetUserId = String(input.targetUserId ?? "").trim();
  if (!userId || !targetUserId) {
    throw new Error("Invalid social report payload.");
  }
  if (userId === targetUserId) {
    throw new Error("You cannot report your own account.");
  }

  const targetUser = await findUserById(targetUserId);
  if (!targetUser) {
    throw new Error("Target trainer does not exist.");
  }

  const report = await createSocialReportRecord({
    reporterUserId: userId,
    targetUserId,
    reason: input.reason,
    notes: input.notes
  });
  await safeAppendNotification({
    userId,
    kind: "social_report_submitted",
    actorUserId: null,
    title: "Report submitted",
    body: "Thanks. Your report was sent for moderation.",
    href: "/social"
  });
  return report;
}

export async function recordFavoriteAddedActivity(input: {
  actorUserId: string;
  entityType: string;
  entityId: string;
  title: string;
  href: string;
}) {
  const actorUserId = String(input.actorUserId ?? "").trim();
  if (!actorUserId) {
    return;
  }

  await safeAppendActivity({
    kind: "favorite_added",
    actorUserId,
    favoriteEntityType: String(input.entityType ?? "").trim() || null,
    favoriteEntityId: String(input.entityId ?? "").trim() || null,
    favoriteTitle: String(input.title ?? "").trim() || null,
    favoriteHref: String(input.href ?? "").trim() || null
  });
}
