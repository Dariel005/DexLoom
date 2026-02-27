import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/auth-session";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import { getSocialHubPayload, touchSocialPresence } from "@/lib/social-service";
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
  const feedParams = parsePaginationParams(
    new URLSearchParams([
      ["limit", searchParams.get("feedLimit") ?? searchParams.get("limit") ?? ""],
      ["cursor", searchParams.get("feedCursor") ?? searchParams.get("cursor") ?? ""]
    ]),
    { limit: 20 }
  );
  const friendsParams = parsePaginationParams(
    new URLSearchParams([
      ["limit", searchParams.get("friendsLimit") ?? ""],
      ["cursor", searchParams.get("friendsCursor") ?? ""]
    ]),
    { limit: 20 }
  );
  const incomingParams = parsePaginationParams(
    new URLSearchParams([
      ["limit", searchParams.get("incomingLimit") ?? ""],
      ["cursor", searchParams.get("incomingCursor") ?? ""]
    ]),
    { limit: 20 }
  );
  const outgoingParams = parsePaginationParams(
    new URLSearchParams([
      ["limit", searchParams.get("outgoingLimit") ?? ""],
      ["cursor", searchParams.get("outgoingCursor") ?? ""]
    ]),
    { limit: 20 }
  );

  const hub = await getSocialHubPayload(user.id, {
    feedLimit: feedParams.limit,
    feedCursor: feedParams.cursor,
    friendsLimit: friendsParams.limit,
    friendsCursor: friendsParams.cursor,
    incomingLimit: incomingParams.limit,
    incomingCursor: incomingParams.cursor,
    outgoingLimit: outgoingParams.limit,
    outgoingCursor: outgoingParams.cursor
  });
  return NextResponse.json(hub);
}
