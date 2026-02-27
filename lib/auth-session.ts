import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function getServerAuthSession() {
  return getServerSession(authOptions);
}

export async function getServerAuthUser() {
  const session = await getServerAuthSession();
  const user = session?.user;
  if (!user?.id) {
    return null;
  }

  return {
    id: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
    provider: user.provider ?? null
  };
}
