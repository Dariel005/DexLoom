import { NextResponse } from "next/server";
import { jsonErrorResponse } from "@/lib/api-error-response";
import { getServerAuthUser } from "@/lib/auth-session";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import { touchSocialPresence, updateSocialSettings } from "@/lib/social-service";
import { parseSocialSettingsPayload } from "@/lib/social-validation";

export const runtime = "nodejs";

export async function PUT(request: Request) {
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
    parsed = parseSocialSettingsPayload(payload);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid social settings payload." },
      { status: 400 }
    );
  }

  try {
    const settings = await updateSocialSettings(user.id, parsed);
    return NextResponse.json(settings);
  } catch (error) {
    return jsonErrorResponse(error, "Unable to update social settings.", 400);
  }
}
