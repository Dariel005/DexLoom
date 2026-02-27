import { NextResponse } from "next/server";
import {
  PokemonCardApiError,
  fetchPokemonCardIdsByType,
  fetchPokemonCardCatalog,
  fetchPokemonCardIndex,
  fetchPokemonCardTypes
} from "@/lib/pokemon-cards";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");

  try {
    if (view === "index") {
      const index = await fetchPokemonCardIndex();
      const data = index.map((entry) => ({
        id: entry.id,
        name: entry.name,
        displayName: entry.displayName,
        supertype: entry.supertype,
        types: entry.types,
        setName: entry.setName,
        setSeries: entry.setSeries,
        setReleaseDate: entry.setReleaseDate,
        artist: entry.artist,
        nationalPokedexNumbers: entry.nationalPokedexNumbers,
        imageSmall: entry.imageSmall,
        imageLarge: entry.imageLarge,
        number: entry.number
      }));
      return NextResponse.json(
        { data },
        {
          headers: {
            "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600"
          }
        }
      );
    }

    if (view === "types") {
      const data = await fetchPokemonCardTypes();
      return NextResponse.json({ data });
    }

    if (view === "type-ids") {
      const type = searchParams.get("type") ?? "";
      const data = await fetchPokemonCardIdsByType(type);
      return NextResponse.json({ data });
    }

    const data = await fetchPokemonCardCatalog();
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof PokemonCardApiError) {
      return NextResponse.json(
        {
          message: error.message,
          endpoint: error.endpoint
        },
        { status: error.status ?? 502 }
      );
    }

    return NextResponse.json(
      {
        message: "Unable to load Pokemon TCG data."
      },
      { status: 500 }
    );
  }
}
