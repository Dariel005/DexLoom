"use client";

import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreatorName } from "@/components/CreatorName";
import { PokedexFrame } from "@/components/PokedexFrame";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import {
  type BlockedUserView,
  type FriendNetworkSnapshot,
  type FriendSearchResultItem,
  type FriendshipRelationStatus,
  type FriendshipRelationView,
  type SocialActivityView,
  type SocialHubPayload,
  type SocialNotificationListPayload,
  type SocialNotificationView,
  type SocialPrivacySettingsView,
  type SocialReportAdminView,
  type SocialReportReason,
  type SocialReportStatus,
  type SocialUserSummary
} from "@/lib/social-types";
import { cn } from "@/lib/utils";

const EMPTY_NETWORK: FriendNetworkSnapshot = {
  friends: [],
  incoming: [],
  outgoing: []
};

const DEFAULT_SETTINGS: SocialPrivacySettingsView = {
  friendRequestPolicy: "everyone",
  presenceVisibility: "friends",
  updatedAt: new Date(0).toISOString()
};

interface SocialHubPaginationState {
  friendsNextCursor: string | null;
  incomingNextCursor: string | null;
  outgoingNextCursor: string | null;
  feedNextCursor: string | null;
}

const EMPTY_PAGINATION: SocialHubPaginationState = {
  friendsNextCursor: null,
  incomingNextCursor: null,
  outgoingNextCursor: null,
  feedNextCursor: null
};

const EMPTY_NOTIFICATIONS: SocialNotificationListPayload = {
  items: [],
  unreadCount: 0,
  nextCursor: null
};

interface FriendActionPayload {
  action: "request" | "accept" | "reject" | "cancel" | "remove";
  targetUserId?: string;
  relationId?: string;
}

interface SelectedTrainer {
  user: SocialUserSummary;
  relationStatus: FriendshipRelationStatus;
  relationId: string | null;
}

type SocialConsoleTab = "trainer" | "requests" | "network" | "alerts" | "moderation";

function formatRelativeDate(value: string | null | undefined) {
  if (!value) {
    return "unknown";
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "unknown";
  }

  const deltaMs = Date.now() - parsed;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (deltaMs < minute) return "just now";
  if (deltaMs < hour) return `${Math.max(1, Math.floor(deltaMs / minute))}m ago`;
  if (deltaMs < day) return `${Math.max(1, Math.floor(deltaMs / hour))}h ago`;
  if (deltaMs < day * 7) return `${Math.max(1, Math.floor(deltaMs / day))}d ago`;

  return new Date(parsed).toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
}

function relationLabel(status: FriendshipRelationStatus) {
  if (status === "friends") return "Friends";
  if (status === "incoming_pending") return "Incoming";
  if (status === "outgoing_pending") return "Pending";
  if (status === "blocked_by_you") return "Blocked by you";
  if (status === "blocked_you") return "Blocked you";
  if (status === "self") return "You";
  return "No relation";
}

function presenceLabel(presence: SocialUserSummary["presence"]) {
  if (presence.state === "online") {
    return "Online";
  }
  if (presence.state === "hidden") {
    return "Hidden";
  }
  if (presence.lastActiveAt) {
    return `Last seen ${formatRelativeDate(presence.lastActiveAt)}`;
  }
  return "Offline";
}

function feedLine(entry: SocialActivityView) {
  const actor = entry.actor.displayName;
  const target = entry.target?.displayName ?? "another trainer";

  if (entry.kind === "friend_request_sent") {
    return `${actor} sent a friend request to ${target}.`;
  }
  if (entry.kind === "friend_request_accepted") {
    return `${actor} accepted a friend request with ${target}.`;
  }
  if (entry.kind === "friend_removed") {
    return `${actor} removed ${target} from friends.`;
  }

  if (entry.favorite?.title) {
    return `${actor} added ${entry.favorite.title} to favorites.`;
  }
  return `${actor} added a new favorite.`;
}

function notificationLine(entry: SocialNotificationView) {
  const actor = entry.actor?.displayName ?? "System";
  if (entry.kind === "incoming_friend_request") {
    return `${actor} sent you a friend request.`;
  }
  if (entry.kind === "friend_request_accepted") {
    return `${actor} accepted your friend request.`;
  }
  if (entry.kind === "friend_removed") {
    return `${actor} removed a friendship connection.`;
  }
  return entry.title;
}

function reportStatusLabel(status: SocialReportStatus) {
  if (status === "resolved") return "Resolved";
  if (status === "dismissed") return "Dismissed";
  return "Open";
}

function sanitizeInviteUserId(value: string) {
  return value.trim().replace(/[^\w\-:|]/g, "").slice(0, 120);
}

function parseInviteUserId(value: string) {
  const raw = value.trim();
  if (!raw) {
    return null;
  }

  try {
    const parsedUrl = new URL(raw);
    const queryValue =
      parsedUrl.searchParams.get("invite") ??
      parsedUrl.searchParams.get("userId") ??
      parsedUrl.searchParams.get("id");
    if (queryValue) {
      return sanitizeInviteUserId(queryValue) || null;
    }

    const pathTokens = parsedUrl.pathname.split("/").filter(Boolean);
    if (pathTokens.length >= 2 && pathTokens[pathTokens.length - 2] === "profile") {
      return sanitizeInviteUserId(pathTokens[pathTokens.length - 1] ?? "") || null;
    }
  } catch {
    return sanitizeInviteUserId(raw) || null;
  }

  return sanitizeInviteUserId(raw) || null;
}

function toSelectionFromSearch(entry: FriendSearchResultItem): SelectedTrainer {
  return {
    user: entry.user,
    relationId: entry.relationId,
    relationStatus: entry.relationStatus
  };
}

function toSelection(
  user: SocialUserSummary,
  relationStatus: FriendshipRelationStatus,
  relationId: string | null
): SelectedTrainer {
  return {
    user,
    relationStatus,
    relationId
  };
}

export function SocialHubClient() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const [network, setNetwork] = useState<FriendNetworkSnapshot>(EMPTY_NETWORK);
  const [settings, setSettings] = useState<SocialPrivacySettingsView>(DEFAULT_SETTINGS);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserView[]>([]);
  const [feed, setFeed] = useState<SocialActivityView[]>([]);
  const [pagination, setPagination] = useState<SocialHubPaginationState>(EMPTY_PAGINATION);
  const [isLoadingMoreFeed, setIsLoadingMoreFeed] = useState(false);
  const [isLoadingMoreFriends, setIsLoadingMoreFriends] = useState(false);
  const [isLoadingMoreIncoming, setIsLoadingMoreIncoming] = useState(false);
  const [isLoadingMoreOutgoing, setIsLoadingMoreOutgoing] = useState(false);

  const [notifications, setNotifications] = useState<SocialNotificationView[]>(EMPTY_NOTIFICATIONS.items);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [notificationNextCursor, setNotificationNextCursor] = useState<string | null>(null);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isLoadingMoreNotifications, setIsLoadingMoreNotifications] = useState(false);
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);

  const [moderationReports, setModerationReports] = useState<SocialReportAdminView[]>([]);
  const [moderationNextCursor, setModerationNextCursor] = useState<string | null>(null);
  const [moderationStatusFilter, setModerationStatusFilter] = useState<"all" | SocialReportStatus>("open");
  const [isLoadingModeration, setIsLoadingModeration] = useState(false);
  const [isLoadingMoreModeration, setIsLoadingMoreModeration] = useState(false);
  const [isReviewingReport, setIsReviewingReport] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<FriendSearchResultItem[]>([]);
  const [inviteInput, setInviteInput] = useState("");
  const [inviteResult, setInviteResult] = useState<FriendSearchResultItem | null>(null);

  const [isLoadingHub, setIsLoadingHub] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolvingInvite, setIsResolvingInvite] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);

  const [friendRequestPolicyDraft, setFriendRequestPolicyDraft] = useState<
    SocialPrivacySettingsView["friendRequestPolicy"]
  >("everyone");
  const [presenceVisibilityDraft, setPresenceVisibilityDraft] = useState<
    SocialPrivacySettingsView["presenceVisibility"]
  >("friends");

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedFallback, setSelectedFallback] = useState<SelectedTrainer | null>(null);

  const [reportReason, setReportReason] = useState<SocialReportReason>("spam");
  const [reportNotes, setReportNotes] = useState("");
  const [activeConsoleTab, setActiveConsoleTab] = useState<SocialConsoleTab>("trainer");

  const [inviteErrorMessage, setInviteErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hubRequestControllerRef = useRef<AbortController | null>(null);
  const searchRequestControllerRef = useRef<AbortController | null>(null);
  const inviteRequestControllerRef = useRef<AbortController | null>(null);

  const userId = session?.user?.id ?? null;

  useEffect(
    () => () => {
      hubRequestControllerRef.current?.abort();
      searchRequestControllerRef.current?.abort();
      inviteRequestControllerRef.current?.abort();
    },
    []
  );

  const setHubPayload = useCallback((hub: SocialHubPayload) => {
    setNetwork({
      friends: Array.isArray(hub.snapshot?.friends) ? hub.snapshot.friends : [],
      incoming: Array.isArray(hub.snapshot?.incoming) ? hub.snapshot.incoming : [],
      outgoing: Array.isArray(hub.snapshot?.outgoing) ? hub.snapshot.outgoing : []
    });
    setSettings(hub.settings ?? DEFAULT_SETTINGS);
    setBlockedUsers(Array.isArray(hub.blocked) ? hub.blocked : []);
    setFeed(Array.isArray(hub.feed) ? hub.feed : []);
    setPagination({
      friendsNextCursor: hub.pagination?.friendsNextCursor ?? null,
      incomingNextCursor: hub.pagination?.incomingNextCursor ?? null,
      outgoingNextCursor: hub.pagination?.outgoingNextCursor ?? null,
      feedNextCursor: hub.pagination?.feedNextCursor ?? null
    });
  }, []);

  const loadHub = useCallback(async () => {
    if (!userId) {
      return;
    }

    hubRequestControllerRef.current?.abort();
    const requestController = new AbortController();
    hubRequestControllerRef.current = requestController;

    setIsLoadingHub(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      params.set("feedLimit", "20");
      params.set("friendsLimit", "20");
      params.set("incomingLimit", "20");
      params.set("outgoingLimit", "20");

      const response = await fetch(`/api/social/hub?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
        signal: requestController.signal
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message ?? "Unable to load social hub.");
      }

      const hub = (await response.json()) as SocialHubPayload;
      if (hubRequestControllerRef.current !== requestController) {
        return;
      }
      setHubPayload(hub);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      if (hubRequestControllerRef.current !== requestController) {
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : "Unable to load social hub.");
      setNetwork(EMPTY_NETWORK);
      setBlockedUsers([]);
      setFeed([]);
    } finally {
      if (hubRequestControllerRef.current === requestController) {
        setIsLoadingHub(false);
      }
    }
  }, [setHubPayload, userId]);

  const loadSearch = useCallback(
    async (query: string) => {
      if (!userId) {
        return;
      }

      const normalizedQuery = query.trim();
      if (!normalizedQuery) {
        searchRequestControllerRef.current?.abort();
        searchRequestControllerRef.current = null;
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      searchRequestControllerRef.current?.abort();
      const requestController = new AbortController();
      searchRequestControllerRef.current = requestController;

      setIsSearching(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", "12");
        params.set("q", normalizedQuery);

        const response = await fetch(`/api/friends/search?${params.toString()}`, {
          signal: requestController.signal
        });
        if (!response.ok) {
          throw new Error("Unable to search trainers.");
        }

        const payload = (await response.json()) as { items?: FriendSearchResultItem[] };
        if (searchRequestControllerRef.current !== requestController) {
          return;
        }
        setSearchResults(Array.isArray(payload.items) ? payload.items : []);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        if (searchRequestControllerRef.current !== requestController) {
          return;
        }
        setSearchResults([]);
      } finally {
        if (searchRequestControllerRef.current === requestController) {
          setIsSearching(false);
        }
      }
    },
    [userId]
  );

  const loadInviteCandidate = useCallback(
    async (inputValue: string) => {
      if (!userId) {
        return;
      }

      const targetUserId = parseInviteUserId(inputValue);
      if (!targetUserId) {
        inviteRequestControllerRef.current?.abort();
        inviteRequestControllerRef.current = null;
        setInviteResult(null);
        setInviteErrorMessage("Paste a valid invite link or trainer ID.");
        return;
      }

      if (targetUserId === userId) {
        inviteRequestControllerRef.current?.abort();
        inviteRequestControllerRef.current = null;
        setInviteResult(null);
        setInviteErrorMessage("This invite link belongs to your account.");
        return;
      }

      inviteRequestControllerRef.current?.abort();
      const requestController = new AbortController();
      inviteRequestControllerRef.current = requestController;

      setIsResolvingInvite(true);
      setInviteErrorMessage(null);

      try {
        const response = await fetch(`/api/friends/lookup?userId=${encodeURIComponent(targetUserId)}`, {
          method: "GET",
          cache: "no-store",
          signal: requestController.signal
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(payload.message ?? "Unable to resolve trainer invite.");
        }

        const payload = (await response.json()) as { item?: FriendSearchResultItem | null };
        if (inviteRequestControllerRef.current !== requestController) {
          return;
        }
        if (!payload.item) {
          setInviteResult(null);
          setInviteErrorMessage("No trainer found for that invite link.");
          return;
        }

        setInviteResult(payload.item);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        if (inviteRequestControllerRef.current !== requestController) {
          return;
        }
        setInviteResult(null);
        setInviteErrorMessage(error instanceof Error ? error.message : "Unable to resolve trainer invite.");
      } finally {
        if (inviteRequestControllerRef.current === requestController) {
          setIsResolvingInvite(false);
        }
      }
    },
    [userId]
  );

  const handleCopyInviteLink = useCallback(async () => {
    if (!userId) {
      return;
    }

    const inviteLink = `${window.location.origin}/social?invite=${encodeURIComponent(userId)}`;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setInfoMessage("Invite link copied.");
      setErrorMessage(null);
    } catch {
      setErrorMessage("Unable to copy invite link.");
    }
  }, [userId]);

  const loadNotifications = useCallback(
    async (input?: { append?: boolean; cursor?: string | null; unreadOnly?: boolean }) => {
      if (!userId) {
        return;
      }

      const append = input?.append === true;
      if (append) {
        setIsLoadingMoreNotifications(true);
      } else {
        setIsLoadingNotifications(true);
      }

      try {
        const params = new URLSearchParams();
        params.set("limit", "20");
        if (input?.cursor) {
          params.set("cursor", input.cursor);
        }
        if (input?.unreadOnly) {
          params.set("unreadOnly", "1");
        }

        const response = await fetch(`/api/social/notifications?${params.toString()}`, {
          method: "GET",
          cache: "no-store"
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(payload.message ?? "Unable to load notifications.");
        }

        const payload = (await response.json()) as SocialNotificationListPayload;
        setNotificationUnreadCount(Number(payload.unreadCount ?? 0));
        setNotificationNextCursor(payload.nextCursor ?? null);
        setNotifications((current) => {
          const next = Array.isArray(payload.items) ? payload.items : [];
          if (!append) {
            return next;
          }
          const map = new Map<string, SocialNotificationView>();
          current.forEach((entry) => map.set(entry.id, entry));
          next.forEach((entry) => map.set(entry.id, entry));
          return Array.from(map.values()).sort(
            (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
          );
        });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load notifications.");
      } finally {
        setIsLoadingNotifications(false);
        setIsLoadingMoreNotifications(false);
      }
    },
    [userId]
  );

  const handleNotificationAction = useCallback(
    async (input: { action: "mark_read" | "mark_unread" | "mark_all_read"; notificationId?: string }) => {
      if (!userId) {
        return;
      }

      setIsUpdatingNotifications(true);
      setErrorMessage(null);
      try {
        const response = await fetch("/api/social/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input)
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(payload.message ?? "Unable to update notifications.");
        }
        await loadNotifications();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to update notifications.");
      } finally {
        setIsUpdatingNotifications(false);
      }
    },
    [loadNotifications, userId]
  );

  const loadNetworkSection = useCallback(
    async (section: "friends" | "incoming" | "outgoing", cursor: string) => {
      if (!userId || !cursor) {
        return;
      }

      if (section === "friends") setIsLoadingMoreFriends(true);
      if (section === "incoming") setIsLoadingMoreIncoming(true);
      if (section === "outgoing") setIsLoadingMoreOutgoing(true);

      try {
        const params = new URLSearchParams();
        params.set("section", section);
        params.set("limit", "20");
        params.set("cursor", cursor);
        const response = await fetch(`/api/social/network?${params.toString()}`, {
          method: "GET",
          cache: "no-store"
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(payload.message ?? `Unable to load ${section} list.`);
        }

        const payload = (await response.json()) as {
          section: "friends" | "incoming" | "outgoing";
          items: FriendNetworkSnapshot["friends"] | FriendNetworkSnapshot["incoming"] | FriendNetworkSnapshot["outgoing"];
          nextCursor: string | null;
        };
        const items = Array.isArray(payload.items) ? payload.items : [];
        setNetwork((current) => {
          if (payload.section === "friends") {
            const map = new Map(current.friends.map((entry) => [entry.relationId, entry]));
            (items as FriendNetworkSnapshot["friends"]).forEach((entry) => map.set(entry.relationId, entry));
            return { ...current, friends: Array.from(map.values()) };
          }
          if (payload.section === "incoming") {
            const map = new Map(current.incoming.map((entry) => [entry.relationId, entry]));
            (items as FriendNetworkSnapshot["incoming"]).forEach((entry) => map.set(entry.relationId, entry));
            return { ...current, incoming: Array.from(map.values()) };
          }
          const map = new Map(current.outgoing.map((entry) => [entry.relationId, entry]));
          (items as FriendNetworkSnapshot["outgoing"]).forEach((entry) => map.set(entry.relationId, entry));
          return { ...current, outgoing: Array.from(map.values()) };
        });

        setPagination((current) => ({
          ...current,
          friendsNextCursor:
            payload.section === "friends" ? payload.nextCursor ?? null : current.friendsNextCursor,
          incomingNextCursor:
            payload.section === "incoming" ? payload.nextCursor ?? null : current.incomingNextCursor,
          outgoingNextCursor:
            payload.section === "outgoing" ? payload.nextCursor ?? null : current.outgoingNextCursor
        }));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : `Unable to load ${section} list.`);
      } finally {
        setIsLoadingMoreFriends(false);
        setIsLoadingMoreIncoming(false);
        setIsLoadingMoreOutgoing(false);
      }
    },
    [userId]
  );

  const loadMoreFeed = useCallback(async () => {
    if (!userId || !pagination.feedNextCursor) {
      return;
    }

    setIsLoadingMoreFeed(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "20");
      params.set("cursor", pagination.feedNextCursor);
      const response = await fetch(`/api/social/feed?${params.toString()}`, {
        method: "GET",
        cache: "no-store"
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message ?? "Unable to load more feed activity.");
      }

      const payload = (await response.json()) as { items?: SocialActivityView[]; nextCursor?: string | null };
      const items = Array.isArray(payload.items) ? payload.items : [];
      setFeed((current) => {
        const map = new Map(current.map((entry) => [entry.id, entry]));
        items.forEach((entry) => map.set(entry.id, entry));
        return Array.from(map.values()).sort(
          (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
        );
      });
      setPagination((current) => ({
        ...current,
        feedNextCursor: payload.nextCursor ?? null
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load more feed activity.");
    } finally {
      setIsLoadingMoreFeed(false);
    }
  }, [pagination.feedNextCursor, userId]);

  const loadModerationReports = useCallback(
    async (input?: { append?: boolean; cursor?: string | null }) => {
      if (!userId || session?.user?.isCreator !== true) {
        return;
      }

      const append = input?.append === true;
      if (append) {
        setIsLoadingMoreModeration(true);
      } else {
        setIsLoadingModeration(true);
      }

      try {
        const params = new URLSearchParams();
        params.set("limit", "20");
        if (input?.cursor) {
          params.set("cursor", input.cursor);
        }
        if (moderationStatusFilter !== "all") {
          params.set("status", moderationStatusFilter);
        }

        const response = await fetch(`/api/social/reports?${params.toString()}`, {
          method: "GET",
          cache: "no-store"
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(payload.message ?? "Unable to load moderation reports.");
        }

        const payload = (await response.json()) as { items?: SocialReportAdminView[]; nextCursor?: string | null };
        const items = Array.isArray(payload.items) ? payload.items : [];
        setModerationReports((current) => {
          if (!append) {
            return items;
          }
          const map = new Map(current.map((entry) => [entry.id, entry]));
          items.forEach((entry) => map.set(entry.id, entry));
          return Array.from(map.values()).sort(
            (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
          );
        });
        setModerationNextCursor(payload.nextCursor ?? null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load moderation reports.");
      } finally {
        setIsLoadingModeration(false);
        setIsLoadingMoreModeration(false);
      }
    },
    [moderationStatusFilter, session?.user?.isCreator, userId]
  );

  const handleReviewReport = useCallback(
    async (input: { reportId: string; action: "resolve" | "dismiss" | "reopen" }) => {
      if (!userId || session?.user?.isCreator !== true) {
        return;
      }

      setIsReviewingReport(true);
      setErrorMessage(null);
      try {
        const response = await fetch("/api/social/reports", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input)
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(payload.message ?? "Unable to review report.");
        }
        await loadModerationReports();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to review report.");
      } finally {
        setIsReviewingReport(false);
      }
    },
    [loadModerationReports, session?.user?.isCreator, userId]
  );

  const selectTrainer = useCallback((selection: SelectedTrainer) => {
    setSelectedUserId(selection.user.userId);
    setSelectedFallback(selection);
    setReportNotes("");
    setReportReason("spam");
  }, []);

  useEffect(() => {
    if (!userId) {
      hubRequestControllerRef.current?.abort();
      searchRequestControllerRef.current?.abort();
      inviteRequestControllerRef.current?.abort();
      setNetwork(EMPTY_NETWORK);
      setSettings(DEFAULT_SETTINGS);
      setBlockedUsers([]);
      setFeed([]);
      setPagination(EMPTY_PAGINATION);
      setSearchResults([]);
      setInviteResult(null);
      setInviteInput("");
      setInviteErrorMessage(null);
      setSelectedUserId(null);
      setSelectedFallback(null);
      setNotifications([]);
      setNotificationUnreadCount(0);
      setNotificationNextCursor(null);
      setModerationReports([]);
      setModerationNextCursor(null);
      return;
    }

    void loadHub();
    void loadNotifications();
    if (session?.user?.isCreator === true) {
      void loadModerationReports();
    }
  }, [loadHub, loadModerationReports, loadNotifications, session?.user?.isCreator, userId]);

  useEffect(() => {
    setFriendRequestPolicyDraft(settings.friendRequestPolicy);
    setPresenceVisibilityDraft(settings.presenceVisibility);
  }, [settings.friendRequestPolicy, settings.presenceVisibility]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const canSyncSocialNow = () =>
      typeof document === "undefined" || document.visibilityState === "visible";

    const sendPresenceHeartbeat = async () => {
      if (!canSyncSocialNow()) {
        return;
      }

      try {
        await fetch("/api/social/presence", {
          method: "POST",
          cache: "no-store"
        });
      } catch {
        // ignore heartbeat errors
      }
    };

    void sendPresenceHeartbeat();

    const presenceIntervalId = window.setInterval(() => {
      void sendPresenceHeartbeat();
    }, 30_000);

    const hubRefreshIntervalId = window.setInterval(() => {
      if (!canSyncSocialNow()) {
        return;
      }
      void loadHub();
      void loadNotifications();
      if (session?.user?.isCreator === true) {
        void loadModerationReports();
      }
    }, 45_000);

    const handleVisibility = () => {
      if (!canSyncSocialNow()) {
        return;
      }

      void sendPresenceHeartbeat();
      void loadHub();
      void loadNotifications();
      if (session?.user?.isCreator === true) {
        void loadModerationReports();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(presenceIntervalId);
      window.clearInterval(hubRefreshIntervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadHub, loadModerationReports, loadNotifications, session?.user?.isCreator, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    if (!searchInput.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadSearch(searchInput);
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [loadSearch, searchInput, userId]);

  const inviteQueryValue = searchParams.get("invite");

  useEffect(() => {
    if (!userId || !inviteQueryValue) {
      return;
    }

    setInviteInput(inviteQueryValue);
    void loadInviteCandidate(inviteQueryValue);
  }, [inviteQueryValue, loadInviteCandidate, userId]);

  const refreshSocialContext = useCallback(async () => {
    await loadHub();
    await loadNotifications();
    if (session?.user?.isCreator === true) {
      await loadModerationReports();
    }
    if (searchInput.trim()) {
      await loadSearch(searchInput);
    }
    if (inviteInput.trim()) {
      await loadInviteCandidate(inviteInput);
    }
  }, [
    inviteInput,
    loadHub,
    loadInviteCandidate,
    loadModerationReports,
    loadNotifications,
    loadSearch,
    searchInput,
    session?.user?.isCreator
  ]);

  const handleAction = useCallback(
    async (payload: FriendActionPayload) => {
      const actionKey = payload.relationId ?? payload.targetUserId ?? payload.action;
      setActiveActionKey(actionKey);
      setInfoMessage(null);
      setErrorMessage(null);

      try {
        const response = await fetch("/api/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(errorPayload.message ?? "Unable to process friendship action.");
        }

        const result = (await response.json()) as {
          ok: boolean;
          relation: FriendshipRelationView;
          snapshot: FriendNetworkSnapshot;
        };

        setNetwork(result.snapshot ?? EMPTY_NETWORK);

        setInviteResult((current) => {
          if (!current || !result.relation || current.user.userId !== result.relation.userId) {
            return current;
          }
          return {
            ...current,
            relationId: result.relation.relationId,
            relationStatus: result.relation.relationStatus
          };
        });

        setSearchResults((current) =>
          current.map((entry) => {
            if (!result.relation || entry.user.userId !== result.relation.userId) {
              return entry;
            }
            return {
              ...entry,
              relationId: result.relation.relationId,
              relationStatus: result.relation.relationStatus
            };
          })
        );

        if (selectedUserId && result.relation?.userId === selectedUserId) {
          setSelectedFallback((current) => {
            if (!current) {
              return current;
            }
            return {
              ...current,
              relationId: result.relation.relationId,
              relationStatus: result.relation.relationStatus
            };
          });
        }

        setInfoMessage(`Action completed: ${relationLabel(result.relation?.relationStatus ?? "none")}.`);
        await refreshSocialContext();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to process friendship action.");
      } finally {
        setActiveActionKey(null);
      }
    },
    [refreshSocialContext, selectedUserId]
  );

  const handleSaveSettings = useCallback(async () => {
    if (!userId) {
      return;
    }

    setIsSavingSettings(true);
    setInfoMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/social/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendRequestPolicy: friendRequestPolicyDraft,
          presenceVisibility: presenceVisibilityDraft
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message ?? "Unable to update social settings.");
      }

      const updated = (await response.json()) as SocialPrivacySettingsView;
      setSettings(updated);
      setInfoMessage("Social privacy settings saved.");
      await loadHub();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update social settings.");
    } finally {
      setIsSavingSettings(false);
    }
  }, [friendRequestPolicyDraft, loadHub, presenceVisibilityDraft, userId]);

  const handleBlockAction = useCallback(
    async (action: "block" | "unblock", targetUserId: string) => {
      if (!userId) {
        return;
      }

      const actionKey = `${action}:${targetUserId}`;
      setActiveActionKey(actionKey);
      setInfoMessage(null);
      setErrorMessage(null);

      try {
        const response = await fetch("/api/social/block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, targetUserId })
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(payload.message ?? "Unable to update block list.");
        }

        const payload = (await response.json()) as {
          ok: boolean;
          relation: FriendshipRelationView;
          hub: SocialHubPayload;
        };

        if (payload.hub) {
          setHubPayload(payload.hub);
        }

        if (selectedUserId === targetUserId) {
          setSelectedFallback((current) => {
            if (!current) {
              return current;
            }
            return {
              ...current,
              relationId: payload.relation?.relationId ?? null,
              relationStatus: payload.relation?.relationStatus ?? "none"
            };
          });
        }

        if (action === "block") {
          setSearchResults((current) => current.filter((entry) => entry.user.userId !== targetUserId));
          if (inviteResult?.user.userId === targetUserId) {
            setInviteResult(null);
          }
        }

        setInfoMessage(action === "block" ? "Trainer blocked." : "Trainer unblocked.");
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to update block list.");
      } finally {
        setActiveActionKey(null);
      }
    },
    [inviteResult?.user.userId, selectedUserId, setHubPayload, userId]
  );

  const handleSubmitReport = useCallback(async () => {
    const selected = selectedFallback;
    if (!userId || !selected) {
      return;
    }

    setIsSubmittingReport(true);
    setInfoMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/social/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selected.user.userId,
          reason: reportReason,
          notes: reportNotes.trim() || null
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message ?? "Unable to submit report.");
      }

      setReportNotes("");
      setInfoMessage("Report submitted.");
      await loadNotifications();
      if (session?.user?.isCreator === true) {
        await loadModerationReports();
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to submit report.");
    } finally {
      setIsSubmittingReport(false);
    }
  }, [loadModerationReports, loadNotifications, reportNotes, reportReason, selectedFallback, session?.user?.isCreator, userId]);

  const selectedFromNetwork = useMemo(() => {
    if (!selectedUserId) {
      return null;
    }

    const friend = network.friends.find((entry) => entry.user.userId === selectedUserId);
    if (friend) return toSelection(friend.user, "friends", friend.relationId);

    const incoming = network.incoming.find((entry) => entry.user.userId === selectedUserId);
    if (incoming) return toSelection(incoming.user, "incoming_pending", incoming.relationId);

    const outgoing = network.outgoing.find((entry) => entry.user.userId === selectedUserId);
    if (outgoing) return toSelection(outgoing.user, "outgoing_pending", outgoing.relationId);

    return null;
  }, [network.friends, network.incoming, network.outgoing, selectedUserId]);

  const selectedFromSearch = useMemo(() => {
    if (!selectedUserId) {
      return null;
    }

    const searchEntry = searchResults.find((entry) => entry.user.userId === selectedUserId);
    if (searchEntry) {
      return toSelectionFromSearch(searchEntry);
    }

    if (inviteResult?.user.userId === selectedUserId) {
      return toSelectionFromSearch(inviteResult);
    }

    return null;
  }, [inviteResult, searchResults, selectedUserId]);

  const selectedFromBlocked = useMemo(() => {
    if (!selectedUserId) {
      return null;
    }

    const blocked = blockedUsers.find((entry) => entry.user.userId === selectedUserId);
    if (!blocked) {
      return null;
    }

    return toSelection(blocked.user, "blocked_by_you", null);
  }, [blockedUsers, selectedUserId]);

  const selectedTrainer = useMemo(() => {
    if (selectedFromBlocked) return selectedFromBlocked;
    if (selectedFromNetwork) return selectedFromNetwork;
    if (selectedFromSearch) return selectedFromSearch;
    if (selectedFallback && selectedUserId === selectedFallback.user.userId) {
      return selectedFallback;
    }
    return null;
  }, [selectedFallback, selectedFromBlocked, selectedFromNetwork, selectedFromSearch, selectedUserId]);

  useEffect(() => {
    if (selectedUserId) {
      return;
    }

    const firstCandidate =
      inviteResult?.user ??
      searchResults[0]?.user ??
      network.friends[0]?.user ??
      network.incoming[0]?.user ??
      network.outgoing[0]?.user ??
      blockedUsers[0]?.user ??
      null;

    if (!firstCandidate) {
      return;
    }

    setSelectedUserId(firstCandidate.userId);
  }, [blockedUsers, inviteResult?.user, network.friends, network.incoming, network.outgoing, searchResults, selectedUserId]);

  useEffect(() => {
    if (!selectedTrainer) {
      return;
    }
    setSelectedFallback(selectedTrainer);
  }, [selectedTrainer]);

  const hasSettingsChanges =
    friendRequestPolicyDraft !== settings.friendRequestPolicy ||
    presenceVisibilityDraft !== settings.presenceVisibility;

  const stats = useMemo(
    () => ({
      friends: network.friends.length,
      incoming: network.incoming.length,
      outgoing: network.outgoing.length,
      discover: searchResults.length
    }),
    [network.friends.length, network.incoming.length, network.outgoing.length, searchResults.length]
  );

  const hasIncomingRequests = network.incoming.length > 0;
  const currentSelection = selectedTrainer;
  const selectedTrainerInitial =
    currentSelection?.user.displayName.trim().charAt(0).toUpperCase() || "?";
  const hasModerationAccess = session?.user?.isCreator === true;

  useEffect(() => {
    if (activeConsoleTab === "moderation" && !hasModerationAccess) {
      setActiveConsoleTab("trainer");
    }
  }, [activeConsoleTab, hasModerationAccess]);

  if (status === "loading") {
    return (
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <div className="rounded-2xl border border-black/20 bg-white/65 p-4 text-sm text-black/75">Checking session...</div>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <PokedexFrame
          title="Trainer Social"
          status="idle"
          leftPanel={<section className="social-theme-arcade space-y-4"><section className="profile-surface social-arcade-panel p-4"><p className="social-arcade-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Social Network</p><h1 className="pixel-font mt-2 text-[14px] uppercase tracking-[0.12em] text-black/84">Sign in required</h1><p className="mt-2 text-sm text-black/72">Sign in to send requests, accept friends, and build your trainer network.</p><div className="mt-3 flex flex-wrap gap-2"><RouteTransitionLink href="/login" className="social-arcade-btn social-arcade-btn-neutral px-3 py-2 text-xs">Go to login</RouteTransitionLink><RouteTransitionLink href="/register" className="social-arcade-btn social-arcade-btn-neutral px-3 py-2 text-xs">Create account</RouteTransitionLink></div></section></section>}
          rightPanel={<section className="social-theme-arcade space-y-4"><section className="profile-surface social-arcade-panel p-4"><p className="social-arcade-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Navigation</p><div className="mt-2 flex flex-wrap gap-2"><RouteTransitionLink href="/" className="social-arcade-btn social-arcade-btn-neutral px-2.5 py-1 text-xs">Back to Pokedex</RouteTransitionLink></div></section></section>}
        />
      </main>
    );
  }

  return (
    <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
      <PokedexFrame
        title="Trainer Social"
        status={isLoadingHub ? "loading" : "success"}
        leftPanel={
          <section className="social-theme-arcade space-y-4">
            <section className="profile-surface profile-surface-hero social-arcade-panel social-arcade-grid-hero p-4">
              <p className="social-arcade-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Trainer Social Grid</p>
              <p className="mt-2 text-sm text-black/74">Connected as <CreatorName name={session?.user?.name ?? session?.user?.email ?? "Trainer"} isCreator={session?.user?.isCreator === true} compact /></p>
              <div className="profile-metric-grid social-arcade-metric-grid mt-3">
                <div className="profile-metric-tile social-arcade-metric-tile"><span className="profile-metric-label">Friends</span><span className="profile-metric-value">{stats.friends}</span></div>
                <div className="profile-metric-tile social-arcade-metric-tile"><span className="profile-metric-label">Incoming</span><span className="profile-metric-value">{stats.incoming}</span></div>
                <div className="profile-metric-tile social-arcade-metric-tile"><span className="profile-metric-label">Outgoing</span><span className="profile-metric-value">{stats.outgoing}</span></div>
                <div className="profile-metric-tile social-arcade-metric-tile"><span className="profile-metric-label">Discover</span><span className="profile-metric-value text-[10px]">{stats.discover}</span></div>
              </div>
              {infoMessage ? <p className="mt-3 rounded-lg border border-emerald-300 bg-emerald-100/70 px-3 py-2 text-sm text-emerald-900">{infoMessage}</p> : null}
              {errorMessage ? <p className="mt-3 rounded-lg border border-rose-300 bg-rose-100/70 px-3 py-2 text-sm text-rose-900">{errorMessage}</p> : null}
            </section>

            <section className="profile-surface social-arcade-panel p-4">
              <p className="social-arcade-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Social Privacy Controls</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <select value={friendRequestPolicyDraft} onChange={(event) => setFriendRequestPolicyDraft(event.target.value as SocialPrivacySettingsView["friendRequestPolicy"])} className="social-arcade-field rounded-md border border-black/20 bg-white/90 px-2 py-1 text-xs text-black/76"><option value="everyone">Friend requests: Everyone</option><option value="no_one">Friend requests: No one</option></select>
                <select value={presenceVisibilityDraft} onChange={(event) => setPresenceVisibilityDraft(event.target.value as SocialPrivacySettingsView["presenceVisibility"])} className="social-arcade-field rounded-md border border-black/20 bg-white/90 px-2 py-1 text-xs text-black/76"><option value="everyone">Presence: Everyone</option><option value="friends">Presence: Friends</option><option value="no_one">Presence: No one</option></select>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => { void handleSaveSettings(); }} disabled={isSavingSettings || !hasSettingsChanges} className={cn("social-arcade-btn social-arcade-btn-red px-2.5 py-1 text-xs", (isSavingSettings || !hasSettingsChanges) && "opacity-60")}>Save settings</button>
                <span className="text-xs text-black/62">Updated {formatRelativeDate(settings.updatedAt)}</span>
              </div>
            </section>

            <section className="profile-surface social-arcade-panel social-discover-panel p-4">
              <div className="social-panel-header flex flex-wrap items-end justify-between gap-2"><p className="social-panel-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Discover Trainers</p>{isSearching ? <p className="text-xs text-black/60">Searching...</p> : null}</div>
              <div className="social-discover-controls mt-2 rounded-lg border border-black/20 bg-white/72 p-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => { void handleCopyInviteLink(); }} className="social-arcade-btn social-arcade-btn-neutral px-2.5 py-1 text-xs">Copy my invite link</button>
                  <input value={inviteInput} onChange={(event) => setInviteInput(event.target.value)} placeholder="Paste invite link or trainer ID..." className="social-arcade-field min-w-[220px] flex-1 rounded-md border border-black/20 bg-white/88 px-2.5 py-1.5 text-xs text-black/76" />
                  <button type="button" disabled={isResolvingInvite} onClick={() => { void loadInviteCandidate(inviteInput); }} className={cn("social-arcade-btn social-arcade-btn-neutral px-2.5 py-1 text-xs", isResolvingInvite && "opacity-60")}>{isResolvingInvite ? "Resolving..." : "Open invite"}</button>
                </div>
                {inviteErrorMessage ? <p className="mt-2 rounded-md border border-rose-300 bg-rose-100/70 px-2.5 py-1.5 text-xs text-rose-900">{inviteErrorMessage}</p> : null}
                {inviteResult ? <button type="button" onClick={() => selectTrainer(toSelectionFromSearch(inviteResult))} className={cn("social-discover-card mt-2 block w-full rounded-lg border border-black/20 bg-white/84 px-3 py-2.5 text-left", selectedUserId === inviteResult.user.userId && "social-discover-card-selected")}><p className="pixel-font truncate text-[9px] uppercase tracking-[0.12em] text-black/82">{inviteResult.user.displayName}</p><p className="mt-1 text-xs text-black/62">{relationLabel(inviteResult.relationStatus)}</p></button> : null}
              </div>
              <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search trainer name, prefix, or nickname..." className="social-arcade-field social-discover-search-input mt-2 w-full rounded-lg border border-black/20 bg-white/80 px-3 py-2 text-sm text-black/78" />
              <div className="social-discover-list mt-3 space-y-2">
                {searchInput.trim().length === 0 ? <p className="rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-sm text-black/64">Type a trainer name to start searching.</p> : searchResults.length === 0 ? <p className="rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-sm text-black/64">No trainers found.</p> : searchResults.map((entry) => <button type="button" key={`search-user-${entry.user.userId}`} onClick={() => selectTrainer(toSelectionFromSearch(entry))} className={cn("social-discover-card block w-full rounded-lg border border-black/20 bg-white/80 px-3 py-2.5 text-left", selectedUserId === entry.user.userId && "social-discover-card-selected")}><p className="pixel-font truncate text-[9px] uppercase tracking-[0.12em] text-black/82">{entry.user.displayName}</p><p className="mt-1 text-xs text-black/62">{relationLabel(entry.relationStatus)}</p></button>)}
              </div>
            </section>

            <section
              className={cn(
                "profile-surface social-arcade-panel social-incoming-panel p-4",
                hasIncomingRequests && "social-incoming-panel-alert"
              )}
            >
              <div className="social-panel-header flex flex-wrap items-center justify-between gap-2">
                <p className="social-panel-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
                  Incoming Radar
                </p>
                {hasIncomingRequests ? (
                  <span className="social-incoming-count-badge">
                    {network.incoming.length > 99 ? "99+" : network.incoming.length}
                  </span>
                ) : null}
              </div>
              <div className="social-incoming-list mt-2 space-y-2">
                {network.incoming.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-xs text-black/62">
                    No pending requests.
                  </p>
                ) : (
                  network.incoming.slice(0, 2).map((entry) => (
                    <button
                      key={`incoming-preview-${entry.relationId}`}
                      type="button"
                      onClick={() => {
                        selectTrainer(toSelection(entry.user, "incoming_pending", entry.relationId));
                        setActiveConsoleTab("requests");
                      }}
                      className={cn(
                        "social-incoming-request-card block w-full rounded-lg border border-black/20 bg-white/76 px-3 py-2 text-left",
                        selectedUserId === entry.user.userId && "ring-1 ring-emerald-500/55"
                      )}
                    >
                      <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-black/82">
                        {entry.user.displayName}
                      </p>
                      <p className="mt-1 text-[11px] text-black/62">
                        Requested {formatRelativeDate(entry.requestedAt)}
                      </p>
                    </button>
                  ))
                )}
                {network.incoming.length > 2 ? (
                  <p className="text-[11px] text-black/62">
                    +{network.incoming.length - 2} more request(s) in Requests Console.
                  </p>
                ) : null}
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveConsoleTab("requests");
                  }}
                  className="social-arcade-btn social-arcade-btn-neutral px-2.5 py-1 text-xs"
                >
                  Open requests console
                </button>
              </div>
            </section>
          </section>
        }
        rightPanel={
          <section className="social-theme-arcade space-y-4">
            <div className="social-arcade-top-grid">
              <section className="profile-surface social-arcade-panel social-arcade-nav-panel p-4">
                <p className="social-arcade-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Navigation</p>
                <div className="mt-2 grid gap-2">
                  <RouteTransitionLink href="/" className="social-arcade-btn social-arcade-btn-neutral px-2.5 py-1.5 text-xs">Back to Pokedex</RouteTransitionLink>
                  <RouteTransitionLink href="/profile/me" className="social-arcade-btn social-arcade-btn-neutral px-2.5 py-1.5 text-xs">My profile</RouteTransitionLink>
                  <RouteTransitionLink href="/favorites" className="social-arcade-btn social-arcade-btn-neutral px-2.5 py-1.5 text-xs">Favorites</RouteTransitionLink>
                </div>
                <div className="social-gba-tab-grid mt-3">
                  <button
                    type="button"
                    onClick={() => setActiveConsoleTab("trainer")}
                    className={cn(
                      "social-arcade-btn social-gba-tab-btn social-arcade-btn-neutral px-2 py-1 text-xs",
                      activeConsoleTab === "trainer" && "social-gba-tab-btn-active"
                    )}
                  >
                    <span>Trainer</span>
                    <span className="social-gba-tab-pill">{currentSelection ? "locked" : "idle"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveConsoleTab("requests")}
                    className={cn(
                      "social-arcade-btn social-gba-tab-btn social-arcade-btn-neutral px-2 py-1 text-xs",
                      activeConsoleTab === "requests" && "social-gba-tab-btn-active"
                    )}
                  >
                    <span>Requests</span>
                    <span className="social-gba-tab-pill">{network.incoming.length + network.outgoing.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveConsoleTab("network")}
                    className={cn(
                      "social-arcade-btn social-gba-tab-btn social-arcade-btn-neutral px-2 py-1 text-xs",
                      activeConsoleTab === "network" && "social-gba-tab-btn-active"
                    )}
                  >
                    <span>Network</span>
                    <span className="social-gba-tab-pill">{network.friends.length + blockedUsers.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveConsoleTab("alerts")}
                    className={cn(
                      "social-arcade-btn social-gba-tab-btn social-arcade-btn-neutral px-2 py-1 text-xs",
                      activeConsoleTab === "alerts" && "social-gba-tab-btn-active"
                    )}
                  >
                    <span>Alerts</span>
                    <span className="social-gba-tab-pill">{notificationUnreadCount}</span>
                  </button>
                  {hasModerationAccess ? (
                    <button
                      type="button"
                      onClick={() => setActiveConsoleTab("moderation")}
                      className={cn(
                        "social-arcade-btn social-gba-tab-btn social-arcade-btn-neutral px-2 py-1 text-xs",
                        activeConsoleTab === "moderation" && "social-gba-tab-btn-active"
                      )}
                    >
                      <span>Moderation</span>
                      <span className="social-gba-tab-pill">{moderationReports.length}</span>
                    </button>
                  ) : null}
                </div>
              </section>

              {activeConsoleTab === "trainer" ? (
                <section className="profile-surface social-arcade-panel social-arcade-report-panel p-4">
                <p className="social-arcade-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Report Trainer</p>
                <div className="mt-2 grid gap-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select value={reportReason} onChange={(event) => setReportReason(event.target.value as SocialReportReason)} className="social-arcade-field rounded-md border border-black/20 bg-white/90 px-2 py-1 text-xs text-black/76">
                      <option value="spam">Spam</option>
                      <option value="abuse">Abuse</option>
                      <option value="impersonation">Impersonation</option>
                      <option value="other">Other</option>
                    </select>
                    <select value="pokemon" disabled className="social-arcade-field rounded-md border border-black/20 bg-white/90 px-2 py-1 text-xs text-black/76">
                      <option value="pokemon">Pokemon</option>
                    </select>
                  </div>
                  <textarea
                    value={reportNotes}
                    onChange={(event) => setReportNotes(event.target.value)}
                    rows={2}
                    maxLength={300}
                    disabled={!currentSelection}
                    placeholder={currentSelection ? `Report ${currentSelection.user.displayName}...` : "Select a trainer first..."}
                    className="social-arcade-field social-arcade-report-notes rounded-md border border-black/20 bg-white/90 px-2 py-1 text-xs text-black/76"
                  />
                  <button type="button" disabled={isSubmittingReport || !currentSelection} onClick={() => { void handleSubmitReport(); }} className={cn("social-arcade-btn social-arcade-btn-red w-full px-2 py-1 text-xs", (isSubmittingReport || !currentSelection) && "opacity-60")}>
                    {isSubmittingReport ? "Reporting..." : "Submit report"}
                  </button>
                </div>
                </section>
              ) : null}
            </div>
            {activeConsoleTab === "trainer" ? (
              <section className="profile-surface social-quick-card social-arcade-panel social-arcade-selected-panel p-4">
              <p className="social-arcade-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Selected Trainer</p>
              {!currentSelection ? (
                <p className="social-arcade-empty mt-2 rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-xs text-black/62">
                  Select a trainer from lists or search results.
                </p>
              ) : (
                <div className="social-arcade-selected-shell mt-2 space-y-2">
                  <div className="social-arcade-selected-card rounded-lg border border-black/20 bg-white/84 px-3 py-2.5">
                    <div className="social-arcade-selected-head">
                      <div className="social-arcade-selected-avatar">
                        {currentSelection.user.avatarUrl ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={currentSelection.user.avatarUrl} alt={`${currentSelection.user.displayName} avatar`} className="h-full w-full object-cover" loading="lazy" />
                          </>
                        ) : (
                          <span className="social-arcade-selected-avatar-fallback">{selectedTrainerInitial}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="pixel-font truncate text-[12px] uppercase tracking-[0.11em] text-black/88">
                            {currentSelection.user.displayName}
                          </p>
                          <span className={cn("social-arcade-presence-chip", currentSelection.user.presence.state === "online" && "social-arcade-presence-chip-online", currentSelection.user.presence.state === "hidden" && "social-arcade-presence-chip-hidden")}>
                            {presenceLabel(currentSelection.user.presence)}
                          </span>
                        </div>
                        <p className="social-arcade-selected-relation mt-1 text-xs text-black/64">
                          {relationLabel(currentSelection.relationStatus)}.
                        </p>
                        <p className="mt-1 text-[11px] text-black/64">
                          Pokemon Archive: {currentSelection.user.presence.lastActiveAt ? formatRelativeDate(currentSelection.user.presence.lastActiveAt) : "Unknown"}
                        </p>
                      </div>
                    </div>

                    <p className="social-arcade-selected-bio mt-2 text-[12px] text-black/72">
                      &quot;{currentSelection.user.bio?.trim() || "No trainer bio available."}&quot;
                    </p>

                    <div className="social-arcade-selected-actions mt-2">
                      <RouteTransitionLink href={currentSelection.user.profileHref} className="social-arcade-btn social-arcade-btn-neutral px-2 py-1 text-xs">
                        Profile
                      </RouteTransitionLink>
                      {currentSelection.relationStatus === "none" ? (
                        <button
                          type="button"
                          disabled={activeActionKey === currentSelection.user.userId}
                          onClick={() => {
                            void handleAction({ action: "request", targetUserId: currentSelection.user.userId });
                          }}
                          className={cn("social-arcade-btn social-arcade-btn-green px-2 py-1 text-xs", activeActionKey === currentSelection.user.userId && "opacity-60")}
                        >
                          Add friend
                        </button>
                      ) : null}
                      {currentSelection.relationStatus === "incoming_pending" && currentSelection.relationId ? (
                        <>
                          <button
                            type="button"
                            disabled={activeActionKey === currentSelection.relationId}
                            onClick={() => {
                              void handleAction({ action: "accept", relationId: currentSelection.relationId ?? undefined });
                            }}
                            className={cn("social-arcade-btn social-arcade-btn-green px-2 py-1 text-xs", activeActionKey === currentSelection.relationId && "opacity-60")}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            disabled={activeActionKey === currentSelection.relationId}
                            onClick={() => {
                              void handleAction({ action: "reject", relationId: currentSelection.relationId ?? undefined });
                            }}
                            className={cn("social-arcade-btn social-arcade-btn-red px-2 py-1 text-xs", activeActionKey === currentSelection.relationId && "opacity-60")}
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                      {currentSelection.relationStatus === "outgoing_pending" && currentSelection.relationId ? (
                        <button
                          type="button"
                          disabled={activeActionKey === currentSelection.relationId}
                          onClick={() => {
                            void handleAction({ action: "cancel", relationId: currentSelection.relationId ?? undefined });
                          }}
                          className={cn("social-arcade-btn social-arcade-btn-red px-2 py-1 text-xs", activeActionKey === currentSelection.relationId && "opacity-60")}
                        >
                          Cancel
                        </button>
                      ) : null}
                      {currentSelection.relationStatus === "friends" && currentSelection.relationId ? (
                        <button
                          type="button"
                          disabled={activeActionKey === currentSelection.relationId}
                          onClick={() => {
                            void handleAction({ action: "remove", relationId: currentSelection.relationId ?? undefined });
                          }}
                          className={cn("social-arcade-btn social-arcade-btn-red px-2 py-1 text-xs", activeActionKey === currentSelection.relationId && "opacity-60")}
                        >
                          Remove
                        </button>
                      ) : null}
                      {currentSelection.relationStatus === "blocked_by_you" ? (
                        <button
                          type="button"
                          disabled={activeActionKey === `unblock:${currentSelection.user.userId}`}
                          onClick={() => {
                            void handleBlockAction("unblock", currentSelection.user.userId);
                          }}
                          className={cn("social-arcade-btn social-arcade-btn-amber px-2 py-1 text-xs", activeActionKey === `unblock:${currentSelection.user.userId}` && "opacity-60")}
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={activeActionKey === `block:${currentSelection.user.userId}`}
                          onClick={() => {
                            void handleBlockAction("block", currentSelection.user.userId);
                          }}
                          className={cn("social-arcade-btn social-arcade-btn-red px-2 py-1 text-xs", activeActionKey === `block:${currentSelection.user.userId}` && "opacity-60")}
                        >
                          Block
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              </section>
            ) : null}
            {activeConsoleTab === "requests" ? (
              <section
                className={cn(
                  "profile-surface social-arcade-panel social-incoming-panel p-4",
                  hasIncomingRequests && "social-incoming-panel-alert"
                )}
              >
                <div className="social-panel-header flex flex-wrap items-center justify-between gap-2">
                  <p className="social-panel-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
                    Incoming Requests
                  </p>
                  {hasIncomingRequests ? (
                    <span className="social-incoming-count-badge">
                      {network.incoming.length > 99 ? "99+" : network.incoming.length}
                    </span>
                  ) : null}
                </div>
                <div className="social-incoming-list mt-2 space-y-2">
                  {network.incoming.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-xs text-black/62">
                      No pending requests.
                    </p>
                  ) : (
                    network.incoming.map((entry) => {
                      const busy = activeActionKey === entry.relationId;
                      return (
                        <article
                          key={`incoming-console-${entry.relationId}`}
                          className="social-incoming-request-card rounded-lg border border-black/20 bg-white/76 px-3 py-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                selectTrainer(toSelection(entry.user, "incoming_pending", entry.relationId))
                              }
                              className="social-incoming-user no-gbc-btn min-w-[180px] flex-1 appearance-none border-0 bg-transparent p-0 text-left"
                            >
                              <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-black/82">
                                {entry.user.displayName}
                              </p>
                              <p className="mt-1 text-[11px] text-black/62">
                                Requested {formatRelativeDate(entry.requestedAt)}
                              </p>
                            </button>
                            <div className="social-request-actions flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                  void handleAction({ action: "accept", relationId: entry.relationId });
                                }}
                                className={cn(
                                  "social-request-accept-btn rounded-md border border-emerald-400/55 bg-emerald-100 px-2 py-1 text-xs text-emerald-900",
                                  busy && "opacity-60"
                                )}
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                  void handleAction({ action: "reject", relationId: entry.relationId });
                                }}
                                className={cn(
                                  "social-request-reject-btn rounded-md border border-rose-400/55 bg-rose-100 px-2 py-1 text-xs text-rose-900",
                                  busy && "opacity-60"
                                )}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
                {pagination.incomingNextCursor ? (
                  <div className="mt-2">
                    <button
                      type="button"
                      disabled={isLoadingMoreIncoming}
                      onClick={() => {
                        if (pagination.incomingNextCursor) {
                          void loadNetworkSection("incoming", pagination.incomingNextCursor);
                        }
                      }}
                      className={cn(
                        "social-arcade-btn social-arcade-btn-neutral px-2.5 py-1 text-xs",
                        isLoadingMoreIncoming && "opacity-60"
                      )}
                    >
                      {isLoadingMoreIncoming ? "Loading..." : "Load more incoming"}
                    </button>
                  </div>
                ) : null}
              </section>
            ) : null}

            {activeConsoleTab === "network" ? (
              <section className="profile-surface social-arcade-panel social-arcade-stack-panel p-4">
              <div className="social-arcade-stack-head flex items-center justify-between gap-2">
                <p className="social-arcade-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Blocked Trainers</p>
                <span className="text-xs text-black/60">{blockedUsers.length}</span>
              </div>
              <div className="mt-2 space-y-2">
                {blockedUsers.length === 0 ? (
                  <p className="social-arcade-empty rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-xs text-black/62">No blocked trainers.</p>
                ) : (
                  blockedUsers.map((entry) => (
                    <article key={`blocked-${entry.user.userId}`} className="social-arcade-list-card rounded-lg border border-black/20 bg-white/76 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <button type="button" onClick={() => selectTrainer(toSelection(entry.user, "blocked_by_you", null))} className="min-w-0 text-left">
                          <p className="pixel-font truncate text-[9px] uppercase tracking-[0.11em] text-black/82">{entry.user.displayName}</p>
                          <p className="mt-1 text-[11px] text-black/62">Blocked {formatRelativeDate(entry.blockedAt)}</p>
                        </button>
                        <button type="button" disabled={activeActionKey === `unblock:${entry.user.userId}`} onClick={() => { void handleBlockAction("unblock", entry.user.userId); }} className={cn("social-arcade-btn social-arcade-btn-amber px-2 py-1 text-xs", activeActionKey === `unblock:${entry.user.userId}` && "opacity-60")}>Unblock</button>
                      </div>
                    </article>
                  ))
                )}
              </div>
              </section>
            ) : null}

            {activeConsoleTab === "alerts" ? (
              <section className="profile-surface social-arcade-panel social-arcade-stack-panel p-4">
              <div className="social-arcade-stack-head flex items-center justify-between gap-2">
                <p className="social-arcade-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Notifications</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-black/60">{notificationUnreadCount} unread</span>
                  <button
                    type="button"
                    disabled={isUpdatingNotifications}
                    onClick={() => {
                      void handleNotificationAction({ action: "mark_all_read" });
                    }}
                    className={cn(
                      "social-arcade-btn social-arcade-btn-neutral px-2 py-0.5 text-[11px]",
                      isUpdatingNotifications && "opacity-60"
                    )}
                  >
                    Mark all read
                  </button>
                </div>
              </div>
              <div className="pokemon-scrollbar mt-2 max-h-[22vh] space-y-2 overflow-y-auto pr-1">
                {isLoadingNotifications && notifications.length === 0 ? (
                  <p className="social-arcade-empty rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-xs text-black/62">
                    Loading notifications...
                  </p>
                ) : notifications.length === 0 ? (
                  <p className="social-arcade-empty rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-xs text-black/62">
                    No notifications yet.
                  </p>
                ) : (
                  notifications.map((entry) => (
                    <article
                      key={`notification-${entry.id}`}
                      className={cn(
                        "social-arcade-list-card rounded-lg border bg-white/80 px-3 py-2",
                        entry.readAt ? "border-black/20" : "border-emerald-400/45"
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-black/76">{notificationLine(entry)}</p>
                          <p className="mt-1 text-[11px] text-black/58">{formatRelativeDate(entry.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {entry.href ? (
                            <RouteTransitionLink
                              href={entry.href}
                              className="social-arcade-btn social-arcade-btn-neutral px-1.5 py-0.5 text-[11px]"
                            >
                              Open
                            </RouteTransitionLink>
                          ) : null}
                          <button
                            type="button"
                            disabled={isUpdatingNotifications}
                            onClick={() => {
                              void handleNotificationAction({
                                action: entry.readAt ? "mark_unread" : "mark_read",
                                notificationId: entry.id
                              });
                            }}
                            className={cn(
                              "social-arcade-btn social-arcade-btn-neutral px-1.5 py-0.5 text-[11px]",
                              isUpdatingNotifications && "opacity-60"
                            )}
                          >
                            {entry.readAt ? "Unread" : "Read"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
              {notificationNextCursor ? (
                <div className="mt-2">
                  <button
                    type="button"
                    disabled={isLoadingMoreNotifications}
                    onClick={() => {
                      if (notificationNextCursor) {
                        void loadNotifications({ append: true, cursor: notificationNextCursor });
                      }
                    }}
                    className={cn(
                      "social-arcade-btn social-arcade-btn-neutral px-2.5 py-1 text-xs",
                      isLoadingMoreNotifications && "opacity-60"
                    )}
                  >
                    {isLoadingMoreNotifications ? "Loading..." : "Load more notifications"}
                  </button>
                </div>
              ) : null}
              </section>
            ) : null}

            {activeConsoleTab === "moderation" && hasModerationAccess ? (
              <section className="profile-surface social-arcade-panel social-arcade-stack-panel p-4">
                <div className="social-arcade-stack-head flex flex-wrap items-center justify-between gap-2">
                  <p className="social-arcade-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
                    Report Moderation
                  </p>
                  <select
                    value={moderationStatusFilter}
                    onChange={(event) =>
                      setModerationStatusFilter(event.target.value as "all" | SocialReportStatus)
                    }
                    className="social-arcade-field rounded-md border border-black/20 bg-white/85 px-2 py-1 text-xs text-black/74"
                  >
                    <option value="open">Open</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                    <option value="all">All</option>
                  </select>
                </div>
                <div className="pokemon-scrollbar mt-2 max-h-[26vh] space-y-2 overflow-y-auto pr-1">
                  {isLoadingModeration && moderationReports.length === 0 ? (
                    <p className="social-arcade-empty rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-xs text-black/62">
                      Loading reports...
                    </p>
                  ) : moderationReports.length === 0 ? (
                    <p className="social-arcade-empty rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-xs text-black/62">
                      No reports for this filter.
                    </p>
                  ) : (
                    moderationReports.map((entry) => (
                      <article key={`moderation-${entry.id}`} className="social-arcade-list-card rounded-lg border border-black/20 bg-white/80 px-3 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs text-black/78">
                            <strong>{entry.reason.toUpperCase()}</strong> | {reportStatusLabel(entry.status)}
                          </p>
                          <p className="text-[11px] text-black/58">{formatRelativeDate(entry.createdAt)}</p>
                        </div>
                        <p className="mt-1 text-[11px] text-black/66">
                          Reporter: {entry.reporter?.displayName ?? "Unknown"} | Target: {entry.target?.displayName ?? "Unknown"}
                        </p>
                        {entry.notes ? (
                          <p className="mt-1 text-[11px] text-black/64">Notes: {entry.notes}</p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            disabled={isReviewingReport}
                            onClick={() => {
                              void handleReviewReport({ reportId: entry.id, action: "resolve" });
                            }}
                            className={cn(
                              "social-arcade-btn social-arcade-btn-green px-2 py-1 text-xs",
                              isReviewingReport && "opacity-60"
                            )}
                          >
                            Resolve
                          </button>
                          <button
                            type="button"
                            disabled={isReviewingReport}
                            onClick={() => {
                              void handleReviewReport({ reportId: entry.id, action: "dismiss" });
                            }}
                            className={cn(
                              "social-arcade-btn social-arcade-btn-amber px-2 py-1 text-xs",
                              isReviewingReport && "opacity-60"
                            )}
                          >
                            Dismiss
                          </button>
                          <button
                            type="button"
                            disabled={isReviewingReport}
                            onClick={() => {
                              void handleReviewReport({ reportId: entry.id, action: "reopen" });
                            }}
                            className={cn(
                              "social-arcade-btn social-arcade-btn-neutral px-2 py-1 text-xs",
                              isReviewingReport && "opacity-60"
                            )}
                          >
                            Reopen
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
                {moderationNextCursor ? (
                  <div className="mt-2">
                    <button
                      type="button"
                      disabled={isLoadingMoreModeration}
                      onClick={() => {
                        if (moderationNextCursor) {
                          void loadModerationReports({ append: true, cursor: moderationNextCursor });
                        }
                      }}
                      className={cn(
                        "social-arcade-btn social-arcade-btn-neutral px-2.5 py-1 text-xs",
                        isLoadingMoreModeration && "opacity-60"
                      )}
                    >
                      {isLoadingMoreModeration ? "Loading..." : "Load more reports"}
                    </button>
                  </div>
                ) : null}
              </section>
            ) : null}

            {activeConsoleTab === "network" ? (
              <section className="profile-surface social-arcade-panel social-arcade-stack-panel p-4">
              <div className="social-arcade-stack-head">
                <p className="social-arcade-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Friends List</p>
              </div>
              <div className="pokemon-scrollbar mt-2 max-h-[20vh] space-y-2 overflow-y-auto pr-1">
                {network.friends.length === 0 ? (
                  <p className="social-arcade-empty rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-xs text-black/62">No friends yet.</p>
                ) : (
                  network.friends.map((entry) => (
                    <button key={`friend-${entry.relationId}`} type="button" onClick={() => selectTrainer(toSelection(entry.user, "friends", entry.relationId))} className={cn("social-arcade-list-card block w-full rounded-lg border border-black/20 bg-white/80 px-3 py-2 text-left", selectedUserId === entry.user.userId && "ring-1 ring-emerald-500/55")}>
                      <p className="pixel-font truncate text-[9px] uppercase tracking-[0.11em] text-black/82">{entry.user.displayName}</p>
                      <p className="mt-1 text-[11px] text-black/62">{presenceLabel(entry.user.presence)}</p>
                    </button>
                  ))
                )}
              </div>
              {pagination.friendsNextCursor ? (
                <div className="mt-2">
                  <button
                    type="button"
                    disabled={isLoadingMoreFriends}
                    onClick={() => {
                      if (pagination.friendsNextCursor) {
                        void loadNetworkSection("friends", pagination.friendsNextCursor);
                      }
                    }}
                    className={cn(
                      "social-arcade-btn social-arcade-btn-neutral px-2.5 py-1 text-xs",
                      isLoadingMoreFriends && "opacity-60"
                    )}
                  >
                    {isLoadingMoreFriends ? "Loading..." : "Load more friends"}
                  </button>
                </div>
              ) : null}
              </section>
            ) : null}

            {activeConsoleTab === "requests" ? (
              <section className="profile-surface social-arcade-panel social-arcade-stack-panel p-4">
              <div className="social-arcade-stack-head">
                <p className="social-arcade-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Outgoing Requests</p>
              </div>
              <div className="mt-2 space-y-2">
                {network.outgoing.length === 0 ? (
                  <p className="social-arcade-empty rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-xs text-black/62">No outgoing requests.</p>
                ) : (
                  network.outgoing.map((entry) => (
                    <button key={`outgoing-${entry.relationId}`} type="button" onClick={() => selectTrainer(toSelection(entry.user, "outgoing_pending", entry.relationId))} className={cn("social-arcade-list-card block w-full rounded-lg border border-black/20 bg-white/80 px-3 py-2 text-left", selectedUserId === entry.user.userId && "ring-1 ring-emerald-500/55")}>
                      <p className="pixel-font truncate text-[9px] uppercase tracking-[0.11em] text-black/82">{entry.user.displayName}</p>
                      <p className="mt-1 text-[11px] text-black/62">Requested {formatRelativeDate(entry.requestedAt)}</p>
                    </button>
                  ))
                )}
              </div>
              {pagination.outgoingNextCursor ? (
                <div className="mt-2">
                  <button
                    type="button"
                    disabled={isLoadingMoreOutgoing}
                    onClick={() => {
                      if (pagination.outgoingNextCursor) {
                        void loadNetworkSection("outgoing", pagination.outgoingNextCursor);
                      }
                    }}
                    className={cn(
                      "social-arcade-btn social-arcade-btn-neutral px-2.5 py-1 text-xs",
                      isLoadingMoreOutgoing && "opacity-60"
                    )}
                  >
                    {isLoadingMoreOutgoing ? "Loading..." : "Load more outgoing"}
                  </button>
                </div>
              ) : null}
              </section>
            ) : null}

            {activeConsoleTab === "alerts" ? (
              <section className="profile-surface social-arcade-panel social-arcade-stack-panel p-4">
              <div className="social-arcade-stack-head">
                <p className="social-arcade-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Social Feed</p>
              </div>
              <div className="pokemon-scrollbar mt-2 max-h-[30vh] space-y-2 overflow-y-auto pr-1">
                {feed.length === 0 ? (
                  <p className="social-arcade-empty rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-xs text-black/62">No recent social activity.</p>
                ) : (
                  feed.map((entry) => (
                    <article key={entry.id} className="social-feed-card social-arcade-list-card rounded-lg border border-black/20 bg-white/80 px-3 py-2">
                      <p className="text-xs text-black/76">{feedLine(entry)}</p>
                      <div className="social-feed-meta mt-1 flex flex-wrap items-center gap-2 text-[11px] text-black/58">
                        <span>{formatRelativeDate(entry.createdAt)}</span>
                        {entry.favorite?.href ? <RouteTransitionLink href={entry.favorite.href} className="social-arcade-btn social-arcade-btn-neutral px-1.5 py-0.5 text-[11px]">Open</RouteTransitionLink> : null}
                      </div>
                    </article>
                  ))
                )}
              </div>
              {pagination.feedNextCursor ? (
                <div className="mt-2">
                  <button
                    type="button"
                    disabled={isLoadingMoreFeed}
                    onClick={() => {
                      void loadMoreFeed();
                    }}
                    className={cn(
                      "social-arcade-btn social-arcade-btn-neutral px-2.5 py-1 text-xs",
                      isLoadingMoreFeed && "opacity-60"
                    )}
                  >
                    {isLoadingMoreFeed ? "Loading..." : "Load more feed"}
                  </button>
                </div>
              ) : null}
              </section>
            ) : null}
          </section>
        }
      />
    </main>
  );
}
