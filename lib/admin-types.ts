import type { ProfileVisibility } from "@/lib/profile-types";
import type { UserRole } from "@/lib/roles";

export interface AdminTrafficPoint {
  date: string;
  pageViews: number;
  registrations: number;
}

export interface AdminOverviewPayload {
  kpis: {
    totalUsers: number;
    activeUsers: number;
    bounceRate: number;
    avgSessionMinutes: number;
  };
  deltas: {
    activeUsers: number;
    bounceRate: number;
    avgSessionMinutes: number;
    pageViews: number;
  };
  traffic: AdminTrafficPoint[];
  system: {
    responseLatencyMs: number;
    cpuUsagePercent: number;
    memoryUsagePercent: number;
    memoryUsedMb: number;
    memoryTotalMb: number;
    databaseState: "online" | "degraded" | "offline";
    databaseLabel: string;
    databaseDetail: string;
    serverTimestamp: string;
  };
}

export interface AdminUserRow {
  uid: string;
  username: string;
  email: string;
  role: UserRole;
  joinDate: string;
  lastActive: string | null;
  avatarUrl: string | null;
  bio: string;
  visibility: ProfileVisibility;
  showFavoritesOnPublic: boolean;
  provider: string;
  suspendedAt: string | null;
  isCreator: boolean;
}

export interface AdminUsersPayload {
  items: AdminUserRow[];
  totals: {
    total: number;
    suspended: number;
    active: number;
    byRole: Record<UserRole, number>;
  };
}

export interface AdminUserUpdatePayload {
  userId: string;
  email?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string | null;
  role?: UserRole;
  visibility?: ProfileVisibility;
  showFavoritesOnPublic?: boolean;
  suspend?: boolean;
}
