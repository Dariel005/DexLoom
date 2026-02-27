"use client";

import { useMemo } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { type PokemonListEntry } from "@/types/pokemon";

interface UsePokemonSearchResult {
  debouncedQuery: string;
  filteredPokemon: PokemonListEntry[];
}

export function usePokemonSearch(
  pokemon: PokemonListEntry[],
  query: string
): UsePokemonSearchResult {
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const searchablePokemon = useMemo(
    () =>
      pokemon.map((entry) => ({
        entry,
        idText: String(entry.id),
        name: entry.name.toLowerCase(),
        displayName: entry.displayName.toLowerCase()
      })),
    [pokemon]
  );

  const filteredPokemon = useMemo(() => {
    if (!debouncedQuery) {
      return pokemon;
    }

    const normalized = debouncedQuery.toLowerCase();
    const isIdQuery = /^\d+$/.test(normalized);

    if (isIdQuery) {
      return searchablePokemon
        .filter((item) => item.idText.startsWith(normalized))
        .map((item) => item.entry);
    }

    return searchablePokemon
      .filter((item) => {
        return (
          item.name.includes(normalized) ||
          item.displayName.includes(normalized)
        );
      })
      .map((item) => item.entry);
  }, [debouncedQuery, pokemon, searchablePokemon]);

  return {
    debouncedQuery,
    filteredPokemon
  };
}
