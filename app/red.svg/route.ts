import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET(request: Request) {
  const base = new URL(request.url);
  return NextResponse.redirect(new URL("/images/characters/red.svg", base), 308);
}
