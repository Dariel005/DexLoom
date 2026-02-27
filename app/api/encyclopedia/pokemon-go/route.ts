import { NextResponse } from "next/server";
import {
  getPokemonGoCategoryOptions,
  POKEMON_GO_ACTIVITIES
} from "@/lib/pokemon-go-encyclopedia";
import {
  getPokemonGoItemCategoryOptions,
  POKEMON_GO_ITEMS
} from "@/lib/pokemon-go-items";

const CACHE_SECONDS = 60 * 60 * 12;

export const runtime = "nodejs";
export const revalidate = CACHE_SECONDS;

export async function GET() {
  return NextResponse.json(
    {
      data: {
        activities: POKEMON_GO_ACTIVITIES,
        activityCategories: getPokemonGoCategoryOptions(),
        items: POKEMON_GO_ITEMS,
        itemCategories: getPokemonGoItemCategoryOptions()
      }
    },
    {
      headers: {
        "Cache-Control": `public, max-age=0, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`
      }
    }
  );
}
