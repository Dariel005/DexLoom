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

  try {
    const profile = await getOrCreateUserProfile(user.id);
    return NextResponse.json({
      ...profile,
      isCreator: await isCreatorUserId(profile.userId)
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load profile." },
      { status: 500 }
    );
  }
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

  try {
    const current = await getOrCreateUserProfile(user.id);
    const parsed = parseProfileUpdatePayload(payload, {
      displayName: current.displayName,
      bio: current.bio,
      visibility: current.visibility,
      showFavoritesOnPublic: current.showFavoritesOnPublic
    });
    const profile = await updateUserProfile(user.id, parsed);
    return NextResponse.json({
      ...profile,
      isCreator: await isCreatorUserId(profile.userId)
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update profile." },
      { status: 500 }
    );
  }
}
