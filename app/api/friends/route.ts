import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/auth-session";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import {
  acceptFriendship,
  cancelFriendRequest,
  getFriendNetworkSnapshot,
  removeFriendship,
  requestFriendship,
  rejectFriendship,
  touchSocialPresence
} from "@/lib/social-service";
import { parseFriendshipActionPayload } from "@/lib/social-validation";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
}

export async function GET() {
  if (!isProfileFeatureEnabled()) {
    return NextResponse.json({ message: "Profile feature is disabled." }, { status: 404 });
  }

  const user = await getServerAuthUser();
  if (!user) {
    return unauthorized();
  }

  await touchSocialPresence(user.id);
  const snapshot = await getFriendNetworkSnapshot(user.id);
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  if (!isProfileFeatureEnabled()) {
    return NextResponse.json({ message: "Profile feature is disabled." }, { status: 404 });
  }

  const user = await getServerAuthUser();
  if (!user) {
    return unauthorized();
  }

  await touchSocialPresence(user.id);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseFriendshipActionPayload(payload);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid friendship payload." },
      { status: 400 }
    );
  }

  try {
    let relation;

    if (parsed.action === "request") {
      relation = await requestFriendship(user.id, parsed.targetUserId ?? "");
    } else if (parsed.action === "accept") {
      relation = await acceptFriendship(user.id, parsed.relationId ?? "");
    } else if (parsed.action === "reject") {
      relation = await rejectFriendship(user.id, parsed.relationId ?? "");
    } else if (parsed.action === "cancel") {
      relation = await cancelFriendRequest(user.id, parsed.relationId ?? "");
    } else {
      relation = await removeFriendship(user.id, parsed.relationId ?? "");
    }

    const snapshot = await getFriendNetworkSnapshot(user.id);
    return NextResponse.json({ ok: true, relation, snapshot });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to process friendship action." },
      { status: 400 }
    );
  }
}
