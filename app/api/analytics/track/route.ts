import { NextResponse } from "next/server";
import { recordAnalyticsEvent, type AnalyticsTrackEventInput } from "@/lib/analytics-service";
import { getServerAuthSession } from "@/lib/auth-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid analytics payload." }, { status: 400 });
  }

  const body = (payload ?? {}) as Partial<AnalyticsTrackEventInput>;
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim().toLowerCase() : "";

  if (!sessionId || !["pageview", "heartbeat", "leave"].includes(type)) {
    return NextResponse.json({ message: "Invalid analytics payload." }, { status: 400 });
  }

  const session = await getServerAuthSession();
  await recordAnalyticsEvent(session?.user?.id ?? null, {
    type: type as AnalyticsTrackEventInput["type"],
    sessionId,
    path: body.path ?? null,
    referrer: body.referrer ?? null,
    occurredAt: body.occurredAt ?? null
  });

  return NextResponse.json({ ok: true });
}
