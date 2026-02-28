import { NextResponse } from "next/server";
import { jsonErrorResponse } from "@/lib/api-error-response";
import { getServerAuthUser } from "@/lib/auth-session";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import {
  listSocialReportsForModerator,
  reviewSocialReport,
  touchSocialPresence
} from "@/lib/social-service";
import {
  parseSocialReportListParams,
  parseSocialReportReviewPayload
} from "@/lib/social-validation";

export const runtime = "nodejs";

function forbidden() {
  return NextResponse.json({ message: "Forbidden." }, { status: 403 });
}

export async function GET(request: Request) {
  if (!isProfileFeatureEnabled()) {
    return NextResponse.json({ message: "Profile feature is disabled." }, { status: 404 });
  }

  const user = await getServerAuthUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!user.permissions.reviewReports) {
    return forbidden();
  }

  await touchSocialPresence(user.id);

  const { searchParams } = new URL(request.url);
  const params = parseSocialReportListParams(searchParams);

  try {
    const reports = await listSocialReportsForModerator(user.id, params);
    return NextResponse.json(reports);
  } catch (error) {
    return jsonErrorResponse(error, "Unable to load moderation reports.", 503);
  }
}

export async function PATCH(request: Request) {
  if (!isProfileFeatureEnabled()) {
    return NextResponse.json({ message: "Profile feature is disabled." }, { status: 404 });
  }

  const user = await getServerAuthUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!user.permissions.reviewReports) {
    return forbidden();
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
    parsed = parseSocialReportReviewPayload(payload);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid report review payload." },
      { status: 400 }
    );
  }

  try {
    const report = await reviewSocialReport(user.id, parsed);
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    return jsonErrorResponse(error, "Unable to review report.", 400);
  }
}
