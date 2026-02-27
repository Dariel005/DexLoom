"use client";

import { useQuery } from "@tanstack/react-query";
import { pokemonDetailQueryOptions } from "@/lib/pokemon-query-options";

export function usePokemonDetailQuery(identifier: string | number | null) {
  return useQuery({
    ...pokemonDetailQueryOptions(identifier ?? ""),
    enabled: Boolean(identifier)
  });
}
