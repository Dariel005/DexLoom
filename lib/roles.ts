export const USER_ROLE_VALUES = [
  "member",
  "vip",
  "beta_tester",
  "moderator",
  "creator"
] as const;

export type UserRole = (typeof USER_ROLE_VALUES)[number];

export interface RolePermissions {
  accessAdmin: boolean;
  manageUsers: boolean;
  moderateContent: boolean;
  reviewReports: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  member: "Miembro",
  vip: "VIP",
  beta_tester: "Beta Tester",
  moderator: "Moderador",
  creator: "Creador"
};

export const ROLE_BADGE_LABELS: Record<UserRole, string | null> = {
  member: null,
  vip: "VIP",
  beta_tester: "BETA",
  moderator: "Staff",
  creator: "Creator"
};

export function normalizeUserRole(value: unknown, fallback: UserRole = "member"): UserRole {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (USER_ROLE_VALUES.includes(normalized as UserRole)) {
    return normalized as UserRole;
  }
  return fallback;
}

export function getRolePermissions(role: UserRole): RolePermissions {
  if (role === "creator") {
    return {
      accessAdmin: true,
      manageUsers: true,
      moderateContent: true,
      reviewReports: true
    };
  }

  if (role === "moderator") {
    return {
      accessAdmin: false,
      manageUsers: false,
      moderateContent: true,
      reviewReports: true
    };
  }

  return {
    accessAdmin: false,
    manageUsers: false,
    moderateContent: false,
    reviewReports: false
  };
}
