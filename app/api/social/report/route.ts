import { NextResponse } from "next/server";
import { jsonErrorResponse } from "@/lib/api-error-response";
import { getServerAuthUser } from "@/lib/auth-session";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import { reportUser, touchSocialPresence } from "@/lib/social-service";
import { parseSocialReportPayload } from "@/lib/social-validation";

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
    parsed = parseSocialReportPayload(payload);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid report payload." },
      { status: 400 }
    );
  }

  try {
    const report = await reportUser(user.id, parsed);
    return NextResponse.json({ ok: true, reportId: report.id, createdAt: report.createdAt });
  } catch (error) {
    return jsonErrorResponse(error, "Unable to submit report.", 400);
  }
}
