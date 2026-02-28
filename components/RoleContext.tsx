"use client";

import { createContext, useContext } from "react";
import { useSession } from "next-auth/react";
import { getRolePermissions, type RolePermissions, type UserRole } from "@/lib/roles";

interface RoleContextValue {
  status: "loading" | "authenticated" | "unauthenticated";
  userId: string | null;
  role: UserRole;
  permissions: RolePermissions;
  isCreator: boolean;
  suspendedAt: string | null;
}

const defaultPermissions = getRolePermissions("member");

const RoleContext = createContext<RoleContextValue>({
  status: "loading",
  userId: null,
  role: "member",
  permissions: defaultPermissions,
  isCreator: false,
  suspendedAt: null
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const role =
    session?.user?.role ??
    (session?.user?.isCreator === true ? "creator" : "member");

  return (
    <RoleContext.Provider
      value={{
        status:
          status === "loading"
            ? "loading"
            : session?.user?.id
              ? "authenticated"
              : "unauthenticated",
        userId: session?.user?.id ?? null,
        role,
        permissions: session?.user?.permissions ?? getRolePermissions(role),
        isCreator: session?.user?.isCreator === true,
        suspendedAt: session?.user?.suspendedAt ?? null
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}

interface RoleGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAdmin?: boolean;
  requireModeration?: boolean;
}

export function RoleGate({
  children,
  fallback = null,
  requireAdmin = false,
  requireModeration = false
}: RoleGateProps) {
  const { permissions } = useRole();
  const canRender =
    (!requireAdmin || permissions.accessAdmin) &&
    (!requireModeration || permissions.reviewReports);

  return canRender ? <>{children}</> : <>{fallback}</>;
}
