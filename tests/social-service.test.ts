import assert from "node:assert/strict";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

process.env.POKEDEX_DATA_DIR = ".data-social-test";
process.env.NEXT_PUBLIC_PROFILE_FEATURE_ENABLED = "1";
process.env.PROFILE_FIREBASE_SYNC_ENABLED = "0";
process.env.SOCIAL_FIREBASE_SYNC_ENABLED = "0";

const DATA_DIR = path.resolve(process.cwd(), process.env.POKEDEX_DATA_DIR);

async function resetDataStore() {
  await rm(DATA_DIR, { recursive: true, force: true });
  await mkdir(DATA_DIR, { recursive: true });
}

test("social service core flows", async () => {
  await resetDataStore();

  const userStore = await import("../lib/user-store");
  const profileService = await import("../lib/profile-service");
  const socialService = await import("../lib/social-service");

  const createUser = async (email: string, name: string) => {
    const result = await userStore.registerCredentialsUser({
      email,
      passwordHash: "hash",
      name
    });
    const user = result.user;
    await profileService.updateUserProfile(user.id, {
      displayName: name,
      bio: "",
      visibility: "public",
      showFavoritesOnPublic: true
    });
    return user;
  };

  const alice = await createUser("alice-social@test.local", "Alice Alpha");
  const bob = await createUser("bob-social@test.local", "Brock Bravo");

  const requested = await socialService.requestFriendship(alice.id, bob.id);
  assert.equal(requested.relationStatus, "outgoing_pending");
  assert.ok(requested.relationId);

  const fuzzyResults = await socialService.searchFriendCandidates(alice.id, "brk", 10);
  assert.ok(fuzzyResults.some((entry) => entry.user.userId === bob.id));

  const bobNotifications = await socialService.getSocialNotificationsForUser(bob.id, {
    limit: 20,
    unreadOnly: true
  });
  assert.ok(bobNotifications.unreadCount >= 1);
  assert.ok(bobNotifications.items.some((entry) => entry.kind === "incoming_friend_request"));

  const accepted = await socialService.acceptFriendship(bob.id, requested.relationId as string);
  assert.equal(accepted.relationStatus, "friends");

  const aliceNotifications = await socialService.getSocialNotificationsForUser(alice.id, {
    limit: 20,
    unreadOnly: true
  });
  assert.ok(aliceNotifications.items.some((entry) => entry.kind === "friend_request_accepted"));

  await socialService.removeFriendship(alice.id, accepted.relationId as string);
  const bobNotificationsAfterRemoval = await socialService.getSocialNotificationsForUser(bob.id, {
    limit: 20
  });
  assert.ok(bobNotificationsAfterRemoval.items.some((entry) => entry.kind === "friend_removed"));

  await socialService.updateSocialNotificationState(bob.id, { action: "mark_all_read" });
  const bobNotificationsRead = await socialService.getSocialNotificationsForUser(bob.id, {
    limit: 20
  });
  assert.equal(bobNotificationsRead.unreadCount, 0);

  for (let i = 0; i < 16; i += 1) {
    await socialService.recordFavoriteAddedActivity({
      actorUserId: alice.id,
      entityType: "pokemon",
      entityId: String(1000 + i),
      title: `Pokemon ${i}`,
      href: `/pokemon/${1000 + i}`
    });
  }

  const feedPageA = await socialService.getSocialFeedPageForUser(alice.id, { limit: 5 });
  assert.equal(feedPageA.items.length, 5);
  assert.ok(feedPageA.nextCursor);
  const feedPageB = await socialService.getSocialFeedPageForUser(alice.id, {
    limit: 5,
    cursor: feedPageA.nextCursor
  });
  assert.equal(feedPageB.items.length, 5);
  assert.notEqual(feedPageA.items[0]?.id, feedPageB.items[0]?.id);

  for (let i = 0; i < 5; i += 1) {
    const extra = await createUser(`friend-${i}@test.local`, `Friend ${i}`);
    const relation = await socialService.requestFriendship(alice.id, extra.id);
    await socialService.acceptFriendship(extra.id, relation.relationId as string);
  }

  const friendsPageA = await socialService.getFriendNetworkSectionPage(alice.id, "friends", { limit: 3 });
  assert.equal(friendsPageA.items.length, 3);
  assert.ok(friendsPageA.nextCursor);
  const friendsPageB = await socialService.getFriendNetworkSectionPage(alice.id, "friends", {
    limit: 3,
    cursor: friendsPageA.nextCursor
  });
  assert.ok(friendsPageB.items.length >= 1);

  const report = await socialService.reportUser(alice.id, {
    targetUserId: bob.id,
    reason: "spam",
    notes: "test moderation flow"
  });

  const openReports = await socialService.listSocialReportsForModerator(alice.id, {
    status: "open",
    limit: 20
  });
  assert.ok(openReports.items.some((entry) => entry.id === report.id));

  await socialService.reviewSocialReport(alice.id, {
    reportId: report.id,
    action: "resolve",
    notes: "resolved in tests"
  });
  const resolvedReports = await socialService.listSocialReportsForModerator(alice.id, {
    status: "resolved",
    limit: 20
  });
  assert.ok(resolvedReports.items.some((entry) => entry.id === report.id));

  const aliceAfterReportNotifications = await socialService.getSocialNotificationsForUser(alice.id, {
    limit: 20
  });
  assert.ok(
    aliceAfterReportNotifications.items.some((entry) => entry.kind === "social_report_submitted")
  );
});
