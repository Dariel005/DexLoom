import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/auth-session";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import {
  listUserFavorites,
  removeUserFavorite,
  upsertUserFavorite
} from "@/lib/profile-service";
import { recordFavoriteAddedActivity } from "@/lib/social-service";
import {
  parseFavoriteDeletePayload,
  parseFavoritesListParams,
  parseFavoriteUpsertPayload
} from "@/lib/profile-validation";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
}

export async function GET(request: Request) {
  if (!isProfileFeatureEnabled()) {
    return NextResponse.json({ message: "Profile feature is disabled." }, { status: 404 });
  }

  const user = await getServerAuthUser();
  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const params = parseFavoritesListParams(searchParams);
  try {
    const favorites = await listUserFavorites({
      userId: user.id,
      entityType: params.entityType,
      cursor: params.cursor,
      limit: params.limit
    });
    return NextResponse.json(favorites);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load favorites." },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  if (!isProfileFeatureEnabled()) {
    return NextResponse.json({ message: "Profile feature is disabled." }, { status: 404 });
  }

  const user = await getServerAuthUser();
  if (!user) {
    return unauthorized();
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseFavoriteUpsertPayload(payload);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid favorite payload." },
      { status: 400 }
    );
  }

  try {
    const result = await upsertUserFavorite(user.id, parsed);
    if (result.created) {
      await recordFavoriteAddedActivity({
        actorUserId: user.id,
        entityType: result.record.entityType,
        entityId: result.record.entityId,
        title: result.record.title,
        href: result.record.href
      });
    }
    return NextResponse.json(result.record, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to persist favorite." },
      { status: 503 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!isProfileFeatureEnabled()) {
    return NextResponse.json({ message: "Profile feature is disabled." }, { status: 404 });
  }

  const user = await getServerAuthUser();
  if (!user) {
    return unauthorized();
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseFavoriteDeletePayload(payload);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid delete payload." },
      { status: 400 }
    );
  }

  try {
    const result = await removeUserFavorite(user.id, parsed.entityType, parsed.entityId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to delete favorite." },
      { status: 503 }
    );
  }
}
