export type FriendshipStatus = "pending" | "accepted";

export type FriendshipRelationStatus =
  | "self"
  | "none"
  | "incoming_pending"
  | "outgoing_pending"
  | "friends"
  | "blocked_by_you"
  | "blocked_you";

export type SocialPresenceState = "online" | "offline" | "hidden";

export interface SocialPresenceView {
  state: SocialPresenceState;
  lastActiveAt: string | null;
}

export interface FriendshipRecord {
  id: string;
  userAId: string;
  userBId: string;
  requestedBy: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
}

export interface SocialUserSummary {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  visibility: "private" | "public";
  profileHref: string;
  presence: SocialPresenceView;
}

export interface FriendshipRelationView {
  relationId: string | null;
  userId: string;
  relationStatus: FriendshipRelationStatus;
}

export interface FriendshipRequestView {
  relationId: string;
  requestedAt: string;
  user: SocialUserSummary;
}

export interface FriendView {
  relationId: string;
  since: string;
  user: SocialUserSummary;
}

export interface FriendNetworkSnapshot {
  friends: FriendView[];
  incoming: FriendshipRequestView[];
  outgoing: FriendshipRequestView[];
}

export interface FriendSearchResultItem {
  user: SocialUserSummary;
  relationId: string | null;
  relationStatus: FriendshipRelationStatus;
}

export type FriendRequestPolicy = "everyone" | "no_one";
export type PresenceVisibility = "everyone" | "friends" | "no_one";

export interface SocialPrivacySettingsRecord {
  userId: string;
  friendRequestPolicy: FriendRequestPolicy;
  presenceVisibility: PresenceVisibility;
  updatedAt: string;
}

export interface SocialPrivacySettingsView {
  friendRequestPolicy: FriendRequestPolicy;
  presenceVisibility: PresenceVisibility;
  updatedAt: string;
}

export interface SocialPresenceRecord {
  userId: string;
  lastActiveAt: string;
}

export interface SocialBlockRecord {
  id: string;
  blockerUserId: string;
  blockedUserId: string;
  createdAt: string;
  updatedAt: string;
}

export type SocialReportReason = "spam" | "abuse" | "impersonation" | "other";
export type SocialReportStatus = "open" | "resolved" | "dismissed";

export interface SocialReportRecord {
  id: string;
  reporterUserId: string;
  targetUserId: string;
  reason: SocialReportReason;
  notes: string | null;
  status: SocialReportStatus;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  reviewNotes: string | null;
  createdAt: string;
}

export type SocialActivityKind =
  | "friend_request_sent"
  | "friend_request_accepted"
  | "friend_removed"
  | "favorite_added";

export interface SocialActivityRecord {
  id: string;
  kind: SocialActivityKind;
  actorUserId: string;
  targetUserId: string | null;
  favoriteEntityType: string | null;
  favoriteEntityId: string | null;
  favoriteTitle: string | null;
  favoriteHref: string | null;
  createdAt: string;
}

export interface SocialActivityFavoriteView {
  entityType: string;
  entityId: string;
  title: string;
  href: string;
}

export interface SocialActivityView {
  id: string;
  kind: SocialActivityKind;
  actor: SocialUserSummary;
  target: SocialUserSummary | null;
  favorite: SocialActivityFavoriteView | null;
  createdAt: string;
}

export interface BlockedUserView {
  user: SocialUserSummary;
  blockedAt: string;
}

export interface SocialHubPayload {
  snapshot: FriendNetworkSnapshot;
  settings: SocialPrivacySettingsView;
  blocked: BlockedUserView[];
  feed: SocialActivityView[];
  pagination?: {
    friendsNextCursor: string | null;
    incomingNextCursor: string | null;
    outgoingNextCursor: string | null;
    feedNextCursor: string | null;
  };
}

export type SocialNotificationKind =
  | "incoming_friend_request"
  | "friend_request_accepted"
  | "friend_removed"
  | "social_report_submitted";

export interface SocialNotificationRecord {
  id: string;
  userId: string;
  kind: SocialNotificationKind;
  actorUserId: string | null;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface SocialNotificationView {
  id: string;
  kind: SocialNotificationKind;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
  actor: SocialUserSummary | null;
}

export interface SocialNotificationListPayload {
  items: SocialNotificationView[];
  unreadCount: number;
  nextCursor: string | null;
}

export interface SocialReportAdminView {
  id: string;
  reason: SocialReportReason;
  notes: string | null;
  status: SocialReportStatus;
  reviewedAt: string | null;
  reviewedBy: SocialUserSummary | null;
  reviewNotes: string | null;
  createdAt: string;
  reporter: SocialUserSummary | null;
  target: SocialUserSummary | null;
}

export interface SocialReportListPayload {
  items: SocialReportAdminView[];
  nextCursor: string | null;
}
