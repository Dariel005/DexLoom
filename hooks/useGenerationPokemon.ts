"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { generationPokemonQueryOptions } from "@/lib/pokemon-query-options";
import { GENERATION_PAGE_SIZE } from "@/lib/pokeapi";
import { type GenerationKey } from "@/types/pokemon";

export function useGenerationPokemon(
  generation: GenerationKey,
  pageSize = GENERATION_PAGE_SIZE
) {
  const query = useInfiniteQuery(generationPokemonQueryOptions(generation, pageSize));

  const pokemon = useMemo(
    () => query.data?.pages.flatMap((page) => page.results) ?? [],
    [query.data]
  );

  return {
    ...query,
    pokemon
  };
}
