const ACTION_VALUES = ["request", "accept", "reject", "cancel", "remove"] as const;
const FRIEND_REQUEST_POLICY_VALUES = ["everyone", "no_one"] as const;
const PRESENCE_VISIBILITY_VALUES = ["everyone", "friends", "no_one"] as const;
const BLOCK_ACTION_VALUES = ["block", "unblock"] as const;
const REPORT_REASON_VALUES = ["spam", "abuse", "impersonation", "other"] as const;
const REPORT_STATUS_VALUES = ["open", "resolved", "dismissed"] as const;
const REPORT_REVIEW_ACTION_VALUES = ["resolve", "dismiss", "reopen"] as const;
const NOTIFICATION_ACTION_VALUES = ["mark_read", "mark_unread", "mark_all_read"] as const;

export type FriendshipAction = (typeof ACTION_VALUES)[number];
export type SocialBlockAction = (typeof BLOCK_ACTION_VALUES)[number];
export type SocialReportReason = (typeof REPORT_REASON_VALUES)[number];
export type SocialReportStatus = (typeof REPORT_STATUS_VALUES)[number];
export type SocialReportReviewAction = (typeof REPORT_REVIEW_ACTION_VALUES)[number];
export type SocialNotificationAction = (typeof NOTIFICATION_ACTION_VALUES)[number];

export interface ParsedFriendshipActionPayload {
  action: FriendshipAction;
  targetUserId: string | null;
  relationId: string | null;
}

const MAX_USER_ID = 120;
const MAX_RELATION_ID = 260;
const MAX_QUERY = 64;
const MAX_CURSOR = 96;
const MAX_REPORT_NOTES = 300;
const MAX_REVIEW_NOTES = 400;
const MAX_POST_CONTENT = 560;
const MAX_COMMENT_CONTENT = 320;

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function clampString(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

function normalizeContent(value: string, maxLength: number) {
  return value.replace(/\r\n?/g, "\n").trim().slice(0, maxLength);
}

export function parseFriendshipActionPayload(payload: unknown): ParsedFriendshipActionPayload {
  const body = (payload ?? {}) as Record<string, unknown>;
  const actionRaw = clampString(asString(body.action).toLowerCase(), 20);

  if (!ACTION_VALUES.includes(actionRaw as FriendshipAction)) {
    throw new Error("Invalid friendship action.");
  }

  const action = actionRaw as FriendshipAction;
  const targetUserId = clampString(asString(body.targetUserId), MAX_USER_ID) || null;
  const relationId = clampString(asString(body.relationId), MAX_RELATION_ID) || null;

  if (action === "request" && !targetUserId) {
    throw new Error("Missing target user id.");
  }

  if (action !== "request" && !relationId) {
    throw new Error("Missing friendship relation id.");
  }

  return {
    action,
    targetUserId,
    relationId
  };
}

export function parseFriendSearchParams(searchParams: URLSearchParams) {
  const query = clampString(searchParams.get("q") ?? "", MAX_QUERY);
  const limitRaw = Number(searchParams.get("limit"));
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.max(1, Math.min(40, Math.floor(limitRaw)))
      : 12;

  return {
    query,
    limit
  };
}

export function parsePaginationParams(searchParams: URLSearchParams, defaults?: { limit?: number }) {
  const limitRaw = Number(searchParams.get("limit"));
  const limitDefault = Number.isFinite(defaults?.limit) ? Number(defaults?.limit) : 20;
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.max(1, Math.min(80, Math.floor(limitRaw)))
      : Math.max(1, Math.min(80, Math.floor(limitDefault)));
  const cursor = clampString(searchParams.get("cursor") ?? "", MAX_CURSOR) || null;
  return { limit, cursor };
}

export function parseFriendStatusParams(searchParams: URLSearchParams) {
  const userId = clampString(searchParams.get("userId") ?? "", MAX_USER_ID);
  if (!userId) {
    throw new Error("Missing userId parameter.");
  }
  return { userId };
}

export function parseSocialSettingsPayload(payload: unknown) {
  const body = (payload ?? {}) as Record<string, unknown>;
  const friendRequestPolicy = clampString(asString(body.friendRequestPolicy).toLowerCase(), 24);
  const presenceVisibility = clampString(asString(body.presenceVisibility).toLowerCase(), 24);

  if (!FRIEND_REQUEST_POLICY_VALUES.includes(friendRequestPolicy as (typeof FRIEND_REQUEST_POLICY_VALUES)[number])) {
    throw new Error("Invalid friend request policy.");
  }

  if (!PRESENCE_VISIBILITY_VALUES.includes(presenceVisibility as (typeof PRESENCE_VISIBILITY_VALUES)[number])) {
    throw new Error("Invalid presence visibility.");
  }

  return {
    friendRequestPolicy: friendRequestPolicy as (typeof FRIEND_REQUEST_POLICY_VALUES)[number],
    presenceVisibility: presenceVisibility as (typeof PRESENCE_VISIBILITY_VALUES)[number]
  };
}

export function parseSocialBlockPayload(payload: unknown) {
  const body = (payload ?? {}) as Record<string, unknown>;
  const action = clampString(asString(body.action).toLowerCase(), 16);
  const targetUserId = clampString(asString(body.targetUserId), MAX_USER_ID);

  if (!BLOCK_ACTION_VALUES.includes(action as SocialBlockAction)) {
    throw new Error("Invalid social block action.");
  }
  if (!targetUserId) {
    throw new Error("Missing target user id.");
  }

  return {
    action: action as SocialBlockAction,
    targetUserId
  };
}

export function parseSocialReportPayload(payload: unknown) {
  const body = (payload ?? {}) as Record<string, unknown>;
  const targetUserId = clampString(asString(body.targetUserId), MAX_USER_ID);
  const reason = clampString(asString(body.reason).toLowerCase(), 24);
  const notes = clampString(asString(body.notes), MAX_REPORT_NOTES) || null;

  if (!targetUserId) {
    throw new Error("Missing target user id.");
  }
  if (!REPORT_REASON_VALUES.includes(reason as SocialReportReason)) {
    throw new Error("Invalid report reason.");
  }

  return {
    targetUserId,
    reason: reason as SocialReportReason,
    notes
  };
}

export function parseSocialReportListParams(searchParams: URLSearchParams) {
  const { limit, cursor } = parsePaginationParams(searchParams, { limit: 20 });
  const statusRaw = clampString(searchParams.get("status")?.toLowerCase() ?? "", 16);
  const status =
    statusRaw.length > 0 && REPORT_STATUS_VALUES.includes(statusRaw as SocialReportStatus)
      ? (statusRaw as SocialReportStatus)
      : null;
  return {
    limit,
    cursor,
    status
  };
}

export function parseSocialReportReviewPayload(payload: unknown) {
  const body = (payload ?? {}) as Record<string, unknown>;
  const reportId = clampString(asString(body.reportId), MAX_RELATION_ID);
  const action = clampString(asString(body.action).toLowerCase(), 16);
  const notes = clampString(asString(body.notes), MAX_REVIEW_NOTES) || null;

  if (!reportId) {
    throw new Error("Missing report id.");
  }
  if (!REPORT_REVIEW_ACTION_VALUES.includes(action as SocialReportReviewAction)) {
    throw new Error("Invalid report review action.");
  }

  return {
    reportId,
    action: action as SocialReportReviewAction,
    notes
  };
}

export function parseSocialNotificationListParams(searchParams: URLSearchParams) {
  const { limit, cursor } = parsePaginationParams(searchParams, { limit: 20 });
  const unreadOnly = searchParams.get("unreadOnly") === "1";
  return {
    limit,
    cursor,
    unreadOnly
  };
}

export function parseSocialNotificationPayload(payload: unknown) {
  const body = (payload ?? {}) as Record<string, unknown>;
  const action = clampString(asString(body.action).toLowerCase(), 20);
  const notificationId = clampString(asString(body.notificationId), MAX_RELATION_ID) || null;
  if (!NOTIFICATION_ACTION_VALUES.includes(action as SocialNotificationAction)) {
    throw new Error("Invalid notification action.");
  }
  if (action !== "mark_all_read" && !notificationId) {
    throw new Error("Missing notification id.");
  }
  return {
    action: action as SocialNotificationAction,
    notificationId
  };
}

export function parseSocialPostListParams(searchParams: URLSearchParams) {
  const { limit, cursor } = parsePaginationParams(searchParams, { limit: 12 });
  const commentsLimitRaw = Number(searchParams.get("commentsLimit"));
  const commentsLimit =
    Number.isFinite(commentsLimitRaw) && commentsLimitRaw > 0
      ? Math.max(1, Math.min(8, Math.floor(commentsLimitRaw)))
      : 3;

  return {
    limit,
    cursor,
    commentsLimit
  };
}

export function parseSocialPostCreatePayload(payload: unknown) {
  const body = (payload ?? {}) as Record<string, unknown>;
  const content = normalizeContent(asString(body.content), MAX_POST_CONTENT);
  if (!content) {
    throw new Error("Post content cannot be empty.");
  }

  return { content };
}

export function parseSocialPostDeletePayload(payload: unknown) {
  const body = (payload ?? {}) as Record<string, unknown>;
  const postId = clampString(asString(body.postId), MAX_RELATION_ID);
  if (!postId) {
    throw new Error("Missing post id.");
  }

  return { postId };
}

export function parseSocialCommentListParams(searchParams: URLSearchParams) {
  const { limit, cursor } = parsePaginationParams(searchParams, { limit: 8 });
  const postId = clampString(asString(searchParams.get("postId")), MAX_RELATION_ID);
  if (!postId) {
    throw new Error("Missing post id.");
  }

  return {
    postId,
    limit,
    cursor
  };
}

export function parseSocialCommentCreatePayload(payload: unknown) {
  const body = (payload ?? {}) as Record<string, unknown>;
  const postId = clampString(asString(body.postId), MAX_RELATION_ID);
  const content = normalizeContent(asString(body.content), MAX_COMMENT_CONTENT);

  if (!postId) {
    throw new Error("Missing post id.");
  }
  if (!content) {
    throw new Error("Comment content cannot be empty.");
  }

  return {
    postId,
    content
  };
}

export function parseSocialCommentDeletePayload(payload: unknown) {
  const body = (payload ?? {}) as Record<string, unknown>;
  const commentId = clampString(asString(body.commentId), MAX_RELATION_ID);
  if (!commentId) {
    throw new Error("Missing comment id.");
  }

  return { commentId };
}
