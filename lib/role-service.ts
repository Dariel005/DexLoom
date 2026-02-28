import type { AdminUserRow, AdminUsersPayload } from "@/lib/admin-types";
import { isCreatorUserId } from "@/lib/creator-profile";
import { getProfileRecord } from "@/lib/profile-repository";
import type { ProfileVisibility, UserProfileRecord } from "@/lib/profile-types";
import { getRolePermissions, normalizeUserRole, type RolePermissions, type UserRole } from "@/lib/roles";
import { getSocialPresenceRecord } from "@/lib/social-repository";
import { findUserById, listStoredUsers, type StoredUser } from "@/lib/user-store";

function fallbackDisplayName(userId: string, preferred?: string | null) {
  if (preferred && preferred.trim().length > 0) {
    return preferred.trim();
  }
  return `Trainer ${userId.slice(0, 6)}`;
}

export interface ResolvedUserAccessState {
  role: UserRole;
  isCreator: boolean;
  permissions: RolePermissions;
  suspendedAt: string | null;
  suspensionReason: string | null;
}

export async function resolveUserRoleById(
  userId: string,
  storedRole?: UserRole | null
): Promise<UserRole> {
  const normalizedUserId = String(userId ?? "").trim();
  if (!normalizedUserId) {
    return "member";
  }

  if (await isCreatorUserId(normalizedUserId)) {
    return "creator";
  }

  return normalizeUserRole(storedRole);
}

export async function getResolvedUserAccessState(
  userId: string
): Promise<ResolvedUserAccessState | null> {
  const normalizedUserId = String(userId ?? "").trim();
  if (!normalizedUserId) {
    return null;
  }

  const storedUser = await findUserById(normalizedUserId);
  if (!storedUser) {
    return null;
  }

  const role = await resolveUserRoleById(storedUser.id, storedUser.role);
  return {
    role,
    isCreator: role === "creator",
    permissions: getRolePermissions(role),
    suspendedAt: storedUser.suspendedAt ?? null,
    suspensionReason: storedUser.suspensionReason ?? null
  };
}

export async function buildAdminUserRow(user: StoredUser): Promise<AdminUserRow> {
  const [profile, presence, role] = await Promise.all([
    getProfileRecord(user.id),
    getSocialPresenceRecord(user.id),
    resolveUserRoleById(user.id, user.role)
  ]);

  const visibility: ProfileVisibility = profile?.visibility ?? "private";

  return {
    uid: user.id,
    username: fallbackDisplayName(user.id, profile?.displayName ?? user.name),
    email: user.email,
    role,
    joinDate: user.createdAt,
    lastActive: presence?.lastActiveAt ?? null,
    avatarUrl: profile?.avatarUrl ?? user.image ?? null,
    bio: profile?.bio ?? "",
    visibility,
    showFavoritesOnPublic: profile?.showFavoritesOnPublic ?? false,
    provider: user.provider,
    suspendedAt: user.suspendedAt ?? null,
    isCreator: role === "creator"
  };
}

export async function listAdminUserRows() {
  const users = await listStoredUsers();
  return Promise.all(users.map((user) => buildAdminUserRow(user)));
}

export async function getAdminUsersPayload(): Promise<AdminUsersPayload> {
  const items = await listAdminUserRows();
  return {
    items,
    totals: {
      total: items.length,
      suspended: items.filter((entry) => Boolean(entry.suspendedAt)).length,
      active: items.filter((entry) => !entry.suspendedAt).length,
      byRole: {
        member: items.filter((entry) => entry.role === "member").length,
        vip: items.filter((entry) => entry.role === "vip").length,
        beta_tester: items.filter((entry) => entry.role === "beta_tester").length,
        moderator: items.filter((entry) => entry.role === "moderator").length,
        creator: items.filter((entry) => entry.role === "creator").length
      }
    }
  };
}

export async function enrichProfileWithRole(profile: UserProfileRecord): Promise<UserProfileRecord> {
  const [storedUser, presence, role] = await Promise.all([
    findUserById(profile.userId),
    getSocialPresenceRecord(profile.userId),
    resolveUserRoleById(profile.userId)
  ]);

  return {
    ...profile,
    isCreator: role === "creator",
    role,
    joinDate: storedUser?.createdAt ?? profile.createdAt,
    lastActive: presence?.lastActiveAt ?? null,
    isSuspended: Boolean(storedUser?.suspendedAt)
  };
}
