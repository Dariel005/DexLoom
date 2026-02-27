import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/auth-session";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import { lookupFriendCandidateByUserId, touchSocialPresence } from "@/lib/social-service";
import { parseFriendStatusParams } from "@/lib/social-validation";

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

  let target;
  try {
    target = parseFriendStatusParams(searchParams);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid lookup parameters." },
      { status: 400 }
    );
  }

  try {
    const item = await lookupFriendCandidateByUserId(user.id, target.userId);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to resolve trainer invite." },
      { status: 400 }
    );
  }
}
