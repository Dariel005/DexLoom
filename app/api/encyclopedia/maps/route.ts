import { NextResponse } from "next/server";
import {
  REGION_INTERACTIVE_POINTS,
  REGION_MAPS
} from "@/lib/maps-encyclopedia";

const CACHE_SECONDS = 60 * 60 * 12;

export const runtime = "nodejs";
export const revalidate = CACHE_SECONDS;

export async function GET() {
  return NextResponse.json(
    {
      data: {
        regions: REGION_MAPS,
        interactivePoints: REGION_INTERACTIVE_POINTS
      }
    },
    {
      headers: {
        "Cache-Control": `public, max-age=0, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`
      }
    }
  );
}
