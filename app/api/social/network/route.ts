import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/auth-session";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import { getFriendNetworkSectionPage, touchSocialPresence } from "@/lib/social-service";
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
  const sectionRaw = String(searchParams.get("section") ?? "friends").trim().toLowerCase();
  const section =
    sectionRaw === "friends" || sectionRaw === "incoming" || sectionRaw === "outgoing"
      ? sectionRaw
      : null;
  if (!section) {
    return NextResponse.json({ message: "Invalid network section." }, { status: 400 });
  }

  const { limit, cursor } = parsePaginationParams(searchParams, { limit: 20 });
  const page = await getFriendNetworkSectionPage(user.id, section, {
    limit,
    cursor
  });
  return NextResponse.json({
    section,
    ...page
  });
}
