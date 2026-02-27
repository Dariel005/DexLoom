import { NextResponse } from "next/server";
import {
  PokemonCardApiError,
  fetchPokemonCardDetail
} from "@/lib/pokemon-cards";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = String(params.id ?? "").trim();

  if (!id) {
    return NextResponse.json({ message: "Missing card id." }, { status: 400 });
  }

  try {
    const data = await fetchPokemonCardDetail(id);
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
        message: "Unable to load Pokemon TCG card detail."
      },
      { status: 500 }
    );
  }
}
