"use client";

import { useCallback, useMemo } from "react";
import { useUserFavorites } from "@/hooks/useUserFavorites";

function buildPokemonFallbackImageUrl(pokemonId: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
}

export function useFavoritePokemon() {
  const favorites = useUserFavorites();

  const favoriteIds = useMemo(
    () =>
      favorites.items
        .filter((entry) => entry.entityType === "pokemon")
        .map((entry) => Number(entry.entityId))
        .filter((id) => Number.isInteger(id) && id > 0)
        .sort((a, b) => a - b),
    [favorites.items]
  );

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const isFavorite = useCallback(
    (pokemonId: number) => favoriteSet.has(pokemonId),
    [favoriteSet]
  );

  const toggleFavorite = useCallback(
    (pokemonId: number) => {
      if (!favorites.isAuthenticated) {
        return false;
      }
      const entityId = String(pokemonId);
      return favorites.toggleFavorite({
        entityType: "pokemon",
        entityId,
        title: `Pokemon #${entityId.padStart(4, "0")}`,
        href: `/pokemon/${entityId}`,
        imageUrl: buildPokemonFallbackImageUrl(pokemonId),
        subtitle: "Pokemon entry",
        tags: ["pokemon"]
      });
    },
    [favorites]
  );

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    isAuthenticated: favorites.isAuthenticated,
    isReady: favorites.isReady,
    queueSize: favorites.queueSize
  };
}
