import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/auth-session";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import { touchSocialPresence } from "@/lib/social-service";

export const runtime = "nodejs";

export async function POST() {
  if (!isProfileFeatureEnabled()) {
    return NextResponse.json({ message: "Profile feature is disabled." }, { status: 404 });
  }

  const user = await getServerAuthUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const record = await touchSocialPresence(user.id);
  return NextResponse.json({ ok: true, lastActiveAt: record.lastActiveAt });
}
