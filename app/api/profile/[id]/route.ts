import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/auth-session";
import { isCreatorUserId } from "@/lib/creator-profile";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import { getUserProfileForViewer, listPublicFavorites } from "@/lib/profile-service";
import { getBlockRelationForUsers } from "@/lib/social-service";

export const runtime = "nodejs";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: Request, context: RouteContext) {
  if (!isProfileFeatureEnabled()) {
    return NextResponse.json({ message: "Profile feature is disabled." }, { status: 404 });
  }

  const profileId = String(context.params.id ?? "").trim();
  if (!profileId) {
    return NextResponse.json({ message: "Missing profile id." }, { status: 400 });
  }

  const viewer = await getServerAuthUser();
  const { searchParams } = new URL(request.url);
  const includeFavorites = searchParams.get("includeFavorites") === "1";
  const profile = await getUserProfileForViewer({
    profileId,
    viewerId: viewer?.id ?? null
  });

  if (!profile) {
    return NextResponse.json({ message: "Profile not found." }, { status: 404 });
  }
  const profileWithCreatorFlag = {
    ...profile,
    isCreator: await isCreatorUserId(profile.userId)
  };

  if (!includeFavorites) {
    return NextResponse.json(profileWithCreatorFlag);
  }

  const viewerId = viewer?.id ?? null;
  const blockRelation =
    viewerId && viewerId !== profileId
      ? await getBlockRelationForUsers(viewerId, profileId)
      : { isBlocked: false };

  if (blockRelation.isBlocked) {
    return NextResponse.json({
      profile: profileWithCreatorFlag,
      favorites: { items: [], nextCursor: null },
      favoritesHiddenByBlock: true
    });
  }

  const favorites = await listPublicFavorites({
    profileId,
    viewerId,
    limit: 500
  });

  return NextResponse.json({
    profile: profileWithCreatorFlag,
    favorites: favorites ?? { items: [], nextCursor: null },
    favoritesHiddenByBlock: false
  });
}
