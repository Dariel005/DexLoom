import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/auth-session";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import { getSocialFeedPageForUser, touchSocialPresence } from "@/lib/social-service";
import { parsePaginationParams } from "@/lib/social-validation";

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
  const { limit, cursor } = parsePaginationParams(searchParams, { limit: 20 });
  const page = await getSocialFeedPageForUser(user.id, {
    limit,
    cursor
  });
  return NextResponse.json(page);
}
