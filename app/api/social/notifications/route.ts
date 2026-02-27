import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/auth-session";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import { getSocialNotificationsForUser, touchSocialPresence, updateSocialNotificationState } from "@/lib/social-service";
import { parseSocialNotificationListParams, parseSocialNotificationPayload } from "@/lib/social-validation";

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
  const params = parseSocialNotificationListParams(searchParams);
  const notifications = await getSocialNotificationsForUser(user.id, params);
  return NextResponse.json(notifications);
}

export async function POST(request: Request) {
  if (!isProfileFeatureEnabled()) {
    return NextResponse.json({ message: "Profile feature is disabled." }, { status: 404 });
  }

  const user = await getServerAuthUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
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
    parsed = parseSocialNotificationPayload(payload);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid notification payload." },
      { status: 400 }
    );
  }

  const result = await updateSocialNotificationState(user.id, parsed);
  return NextResponse.json(result);
}
