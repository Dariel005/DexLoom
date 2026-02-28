import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/auth-session";
import { saveUserTeamBuilderState, getUserTeamBuilderState } from "@/lib/team-builder-service";
import { normalizePersistedTeamBuilderState } from "@/lib/team-builder";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
}

export async function GET() {
  const user = await getServerAuthUser();
  if (!user) {
    return unauthorized();
  }

  try {
    const state = await getUserTeamBuilderState(user.id);
    return NextResponse.json({ state });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to load team builder state."
      },
      { status: 503 }
    );
  }
}

export async function PUT(request: Request) {
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

  const rawState =
    payload && typeof payload === "object" && "state" in payload
      ? (payload as { state?: unknown }).state
      : payload;

  try {
    const state = normalizePersistedTeamBuilderState(rawState);
    const saved = await saveUserTeamBuilderState(user.id, state);
    return NextResponse.json({ state: saved });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to save team builder state."
      },
      { status: 503 }
    );
  }
}
