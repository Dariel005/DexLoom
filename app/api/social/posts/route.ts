import { NextResponse } from "next/server";
import { jsonErrorResponse } from "@/lib/api-error-response";
import { getServerAuthUser } from "@/lib/auth-session";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import {
  createSocialPost,
  deleteSocialPost,
  listSocialPostsForViewer
} from "@/lib/social-content-service";
import { touchSocialPresence } from "@/lib/social-service";
import {
  parseSocialPostCreatePayload,
  parseSocialPostDeletePayload,
  parseSocialPostListParams
} from "@/lib/social-validation";

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

  try {
    const { searchParams } = new URL(request.url);
    const params = parseSocialPostListParams(searchParams);
    const payload = await listSocialPostsForViewer(user.id, {
      ...params,
      allowModerationBypass: user.permissions.moderateContent
    });
    return NextResponse.json(payload);
  } catch (error) {
    return jsonErrorResponse(error, "Unable to load community posts.", 400);
  }
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

  try {
    const parsed = parseSocialPostCreatePayload(payload);
    const post = await createSocialPost(user.id, parsed);
    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch (error) {
    return jsonErrorResponse(error, "Unable to publish post.", 400);
  }
}

export async function DELETE(request: Request) {
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

  try {
    const parsed = parseSocialPostDeletePayload(payload);
    const result = await deleteSocialPost(user.id, {
      ...parsed,
      allowModerationBypass: user.permissions.moderateContent
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonErrorResponse(error, "Unable to delete post.", 400);
  }
}
