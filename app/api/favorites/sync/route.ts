import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/auth-session";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import { syncUserFavorites } from "@/lib/profile-service";
import { recordFavoriteAddedActivity } from "@/lib/social-service";
import { parseFavoritesSyncPayload } from "@/lib/profile-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isProfileFeatureEnabled()) {
    return NextResponse.json({ message: "Profile feature is disabled." }, { status: 404 });
  }

  const user = await getServerAuthUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  const ops = parseFavoritesSyncPayload(payload);
  if (ops.length === 0) {
    return NextResponse.json({ applied: 0, failed: 0, createdRecords: [] });
  }

  const result = await syncUserFavorites(user.id, ops);
  if (result.createdRecords.length > 0) {
    await Promise.all(
      result.createdRecords.map((entry) =>
        recordFavoriteAddedActivity({
          actorUserId: user.id,
          entityType: entry.entityType,
          entityId: entry.entityId,
          title: entry.title,
          href: entry.href
        })
      )
    );
  }
  return NextResponse.json(result);
}
