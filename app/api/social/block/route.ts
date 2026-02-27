import { NextResponse } from "next/server";
import { jsonErrorResponse } from "@/lib/api-error-response";
import { getServerAuthUser } from "@/lib/auth-session";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import { blockUser, getSocialHubPayload, touchSocialPresence, unblockUser } from "@/lib/social-service";
import { parseSocialBlockPayload } from "@/lib/social-validation";

export const runtime = "nodejs";

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
    parsed = parseSocialBlockPayload(payload);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid social block payload." },
      { status: 400 }
    );
  }

  try {
    const relation =
      parsed.action === "block"
        ? await blockUser(user.id, parsed.targetUserId)
        : await unblockUser(user.id, parsed.targetUserId);

    const hub = await getSocialHubPayload(user.id);
    return NextResponse.json({ ok: true, relation, hub });
  } catch (error) {
    return jsonErrorResponse(error, "Unable to update block list.", 400);
  }
}
