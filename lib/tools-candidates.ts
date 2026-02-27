import { cache } from "react";
import { fetchPokemonSearchIndex } from "@/lib/pokeapi";
import { type PokemonListEntry } from "@/types/pokemon";

export const loadToolCandidatePokemon = cache(
  async (): Promise<PokemonListEntry[]> => {
    try {
      const searchIndex = await fetchPokemonSearchIndex();

      return searchIndex.map((entry) => ({
        id: entry.id,
        name: entry.name,
        displayName: entry.displayName,
        artwork: null,
        homeSprite: null,
        types: [],
        generation: entry.generation,
        generationKey: entry.generationKey,
        attack: 0
      }));
    } catch {
      return [];
    }
  }
);

