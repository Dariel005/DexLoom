import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getResolvedUserAccessState } from "@/lib/role-service";

export async function getServerAuthSession() {
  return getServerSession(authOptions);
}

export async function getServerAuthUser() {
  const session = await getServerAuthSession();
  const user = session?.user;
  if (!user?.id) {
    return null;
  }

  const access = await getResolvedUserAccessState(user.id);
  if (!access || access.suspendedAt) {
    return null;
  }

  return {
    id: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
    provider: user.provider ?? null,
    role: access.role,
    isCreator: access.isCreator,
    permissions: access.permissions,
    suspendedAt: access.suspendedAt
  };
}
