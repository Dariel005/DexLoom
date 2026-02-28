import { type DefaultSession } from "next-auth";
import { type JWT as DefaultJWT } from "next-auth/jwt";
import type { RolePermissions, UserRole } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      provider: string | null;
      isCreator: boolean;
      role: UserRole;
      permissions: RolePermissions;
      suspendedAt: string | null;
    };
  }

  interface User {
    id: string;
    provider?: string | null;
    isCreator?: boolean;
    role?: UserRole;
    suspendedAt?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    uid?: string;
    provider?: string | null;
    isCreator?: boolean;
    role?: UserRole;
    suspendedAt?: string | null;
  }
}
