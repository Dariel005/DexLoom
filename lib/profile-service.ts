import {
  deleteFavoriteRecord,
  getProfileRecord,
  listFavoriteRecords,
  syncFavoriteRecords,
  upsertFavoriteRecord,
  upsertProfileRecord
} from "@/lib/profile-repository";
import {
  type FavoriteEntityType,
  type FavoriteListResult,
  type FavoriteSyncResult,
  type FavoriteSyncOperation,
  type FavoriteUpsertResult,
  type FavoriteUpsertInput,
  type ProfileUpdateInput,
  type UserProfileRecord
} from "@/lib/profile-types";
import { DEFAULT_TRAINER_AVATAR_URL, isGoogleProfileImageUrl } from "@/lib/default-avatar";
import { findUserById, updateStoredUserProfile } from "@/lib/user-store";

const DEFAULT_PROFILE_BIO = "";
const DEFAULT_PROFILE_VISIBILITY = "private" as const;
const DEFAULT_SHOW_FAVORITES_PUBLIC = false;

function fallbackDisplayName(userId: string, preferred?: string | null) {
  if (preferred && preferred.trim().length > 0) {
    return preferred.trim();
  }
  return `Trainer ${userId.slice(0, 6)}`;
}

function createDefaultProfile(input: {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}): UserProfileRecord {
  const now = new Date().toISOString();
  return {
    userId: input.userId,
    displayName: input.displayName,
    bio: DEFAULT_PROFILE_BIO,
    avatarUrl: input.avatarUrl,
    visibility: DEFAULT_PROFILE_VISIBILITY,
    showFavoritesOnPublic: DEFAULT_SHOW_FAVORITES_PUBLIC,
    createdAt: now,
    updatedAt: now
  };
}

export async function getOrCreateUserProfile(userId: string) {
  const existing = await getProfileRecord(userId);
  const user = await findUserById(userId);

  if (existing) {
    let didPatch = false;
    const next: UserProfileRecord = { ...existing };

    if (!next.displayName) {
      next.displayName = fallbackDisplayName(userId, user?.name);
      didPatch = true;
    }
    if (!next.avatarUrl && user?.image) {
      next.avatarUrl = user.image;
      didPatch = true;
    }
    if (isGoogleProfileImageUrl(next.avatarUrl)) {
      next.avatarUrl = DEFAULT_TRAINER_AVATAR_URL;
      didPatch = true;
    }

    if (didPatch) {
      next.updatedAt = new Date().toISOString();
      return upsertProfileRecord(next);
    }

    return existing;
  }

  const profile = createDefaultProfile({
    userId,
    displayName: fallbackDisplayName(userId, user?.name),
    avatarUrl: user?.image ?? DEFAULT_TRAINER_AVATAR_URL
  });
  return upsertProfileRecord(profile);
}

export async function updateUserProfile(
  userId: string,
  input: ProfileUpdateInput
) {
  const current = await getOrCreateUserProfile(userId);
  const now = new Date().toISOString();

  const next: UserProfileRecord = {
    ...current,
    displayName: input.displayName,
    bio: input.bio,
    visibility: input.visibility,
    showFavoritesOnPublic: input.showFavoritesOnPublic,
    updatedAt: now
  };

  await updateStoredUserProfile(userId, {
    name: input.displayName
  });

  return upsertProfileRecord(next);
}

export async function updateUserAvatar(userId: string, avatarUrl: string | null) {
  const current = await getOrCreateUserProfile(userId);
  const next: UserProfileRecord = {
    ...current,
    avatarUrl,
    updatedAt: new Date().toISOString()
  };

  await updateStoredUserProfile(userId, {
    image: avatarUrl
  });

  return upsertProfileRecord(next);
}

export async function getUserProfileForViewer(input: {
  profileId: string;
  viewerId?: string | null;
}) {
  const viewerId = input.viewerId ?? null;
  let profile = await getProfileRecord(input.profileId);

  if (!profile && viewerId === input.profileId) {
    profile = await getOrCreateUserProfile(input.profileId);
  }

  if (!profile) {
    return null;
  }

  const isSelf = viewerId === profile.userId;

  if (!isSelf && profile.visibility !== "public") {
    return null;
  }

  return profile;
}

export async function listUserFavorites(input: {
  userId: string;
  entityType?: FavoriteEntityType | null;
  cursor?: string | null;
  limit?: number;
}) {
  return listFavoriteRecords(input);
}

export async function listPublicFavorites(input: {
  profileId: string;
  viewerId?: string | null;
  entityType?: FavoriteEntityType | null;
  cursor?: string | null;
  limit?: number;
}): Promise<FavoriteListResult | null> {
  const profile = await getUserProfileForViewer({
    profileId: input.profileId,
    viewerId: input.viewerId
  });
  if (!profile) {
    return null;
  }

  const isSelf = profile.userId === (input.viewerId ?? null);
  if (!isSelf && !profile.showFavoritesOnPublic) {
    return {
      items: [],
      nextCursor: null
    };
  }

  return listFavoriteRecords({
    userId: profile.userId,
    entityType: input.entityType,
    cursor: input.cursor,
    limit: input.limit
  });
}

export async function upsertUserFavorite(
  userId: string,
  input: FavoriteUpsertInput
): Promise<FavoriteUpsertResult> {
  return upsertFavoriteRecord(userId, input);
}

export async function removeUserFavorite(
  userId: string,
  entityType: FavoriteEntityType,
  entityId: string
) {
  await deleteFavoriteRecord(userId, entityType, entityId);
  return { ok: true as const };
}

export async function syncUserFavorites(
  userId: string,
  ops: FavoriteSyncOperation[]
): Promise<FavoriteSyncResult> {
  return syncFavoriteRecords(userId, ops);
}
