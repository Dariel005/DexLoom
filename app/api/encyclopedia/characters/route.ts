import { NextResponse } from "next/server";
import { CHARACTER_WIKI_INDEX } from "@/lib/characters-encyclopedia";

const CACHE_SECONDS = 60 * 60 * 12;

export const runtime = "nodejs";
export const revalidate = CACHE_SECONDS;

export async function GET() {
  return NextResponse.json(
    { data: CHARACTER_WIKI_INDEX },
    {
      headers: {
        "Cache-Control": `public, max-age=0, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`
      }
    }
  );
}
