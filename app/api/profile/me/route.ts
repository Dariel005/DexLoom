import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/auth-session";
import { isCreatorUserId } from "@/lib/creator-profile";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import { getOrCreateUserProfile, updateUserProfile } from "@/lib/profile-service";
import { parseProfileUpdatePayload } from "@/lib/profile-validation";

export const runtime = "nodejs";

function forbiddenResponse() {
  return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
}

export async function GET() {
  if (!isProfileFeatureEnabled()) {
    return NextResponse.json({ message: "Profile feature is disabled." }, { status: 404 });
  }

  const user = await getServerAuthUser();
  if (!user) {
    return forbiddenResponse();
  }

  const profile = await getOrCreateUserProfile(user.id);
  return NextResponse.json({
    ...profile,
    isCreator: await isCreatorUserId(profile.userId)
  });
}

export async function PUT(request: Request) {
  if (!isProfileFeatureEnabled()) {
    return NextResponse.json({ message: "Profile feature is disabled." }, { status: 404 });
  }

  const user = await getServerAuthUser();
  if (!user) {
    return forbiddenResponse();
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = parseProfileUpdatePayload(payload);
  const profile = await updateUserProfile(user.id, parsed);
  return NextResponse.json({
    ...profile,
    isCreator: await isCreatorUserId(profile.userId)
  });
}
