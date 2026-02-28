import { NextResponse } from "next/server";
import { jsonErrorResponse } from "@/lib/api-error-response";
import { getServerAuthUser } from "@/lib/auth-session";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import { getOrCreateUserProfile, updateUserProfile } from "@/lib/profile-service";
import { parseProfileUpdatePayload } from "@/lib/profile-validation";
import { enrichProfileWithRole } from "@/lib/role-service";

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
    return NextResponse.json(await enrichProfileWithRole(profile));
  } catch (error) {
    return jsonErrorResponse(error, "Unable to load profile.", 500);
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
    return NextResponse.json(await enrichProfileWithRole(profile));
  } catch (error) {
    return jsonErrorResponse(error, "Unable to update profile.", 500);
  }
}
