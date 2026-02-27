import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/auth-session";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import { searchFriendCandidates, touchSocialPresence } from "@/lib/social-service";
import { parseFriendSearchParams } from "@/lib/social-validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isProfileFeatureEnabled()) {
    return NextResponse.json({ message: "Profile feature is disabled." }, { status: 404 });
  }

  const user = await getServerAuthUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  await touchSocialPresence(user.id);

  const { searchParams } = new URL(request.url);
  const { query, limit } = parseFriendSearchParams(searchParams);
  const items = await searchFriendCandidates(user.id, query, limit);
  return NextResponse.json({ items });
}
