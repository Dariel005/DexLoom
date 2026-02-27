import { queryOptions } from "@tanstack/react-query";
import type { CharacterWikiEntry } from "@/lib/characters-encyclopedia";
import type {
  PokemonRegionMapDetail,
  PokemonRegionMapKey,
  PokemonRegionMapPoint
} from "@/types/map";
import type {
  PokemonGoActivity,
  PokemonGoActivityCategory,
  PokemonGoItem,
  PokemonGoItemCategory
} from "@/types/pokemon-go";

interface ApiEnvelope<TData> {
  data?: TData;
}

export interface EncyclopediaOption<TValue extends string = string> {
  value: TValue;
  label: string;
}

export interface MapsEncyclopediaPayload {
  regions: PokemonRegionMapDetail[];
  interactivePoints: Record<PokemonRegionMapKey, PokemonRegionMapPoint[]>;
}

export interface PokemonGoEncyclopediaPayload {
  activities: PokemonGoActivity[];
  activityCategories: EncyclopediaOption<PokemonGoActivityCategory>[];
  items: PokemonGoItem[];
  itemCategories: EncyclopediaOption<PokemonGoItemCategory>[];
}

export interface PokemonGoModulesPayload {
  activities: PokemonGoActivity[];
  activityCategories: EncyclopediaOption<PokemonGoActivityCategory>[];
}

export interface PokemonGoItemsPayload {
  items: PokemonGoItem[];
  itemCategories: EncyclopediaOption<PokemonGoItemCategory>[];
}

async function fetchEncyclopediaApi<TData>(path: string): Promise<TData> {
  const response = await fetch(path, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Encyclopedia API request failed (${response.status})`);
  }

  const payload = (await response.json()) as ApiEnvelope<TData>;
  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    throw new Error("Encyclopedia API response is invalid.");
  }

  return payload.data as TData;
}

export const encyclopediaKeys = {
  characters: () => ["encyclopedia", "characters"] as const,
  maps: () => ["encyclopedia", "maps"] as const,
  pokemonGo: () => ["encyclopedia", "pokemon-go"] as const,
  pokemonGoModules: () => ["encyclopedia", "pokemon-go", "modules"] as const,
  pokemonGoItems: () => ["encyclopedia", "pokemon-go", "items"] as const
};

export function charactersDirectoryQueryOptions() {
  return queryOptions({
    queryKey: encyclopediaKeys.characters(),
    queryFn: () => fetchEncyclopediaApi<CharacterWikiEntry[]>("/api/encyclopedia/characters"),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 3
  });
}

export function mapsEncyclopediaQueryOptions() {
  return queryOptions({
    queryKey: encyclopediaKeys.maps(),
    queryFn: () => fetchEncyclopediaApi<MapsEncyclopediaPayload>("/api/encyclopedia/maps"),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 3
  });
}

export function pokemonGoEncyclopediaQueryOptions() {
  return queryOptions({
    queryKey: encyclopediaKeys.pokemonGo(),
    queryFn: () => fetchEncyclopediaApi<PokemonGoEncyclopediaPayload>("/api/encyclopedia/pokemon-go"),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 3
  });
}

export function pokemonGoModulesQueryOptions() {
  return queryOptions({
    queryKey: encyclopediaKeys.pokemonGoModules(),
    queryFn: () =>
      fetchEncyclopediaApi<PokemonGoModulesPayload>("/api/encyclopedia/pokemon-go/modules"),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 3
  });
}

export function pokemonGoItemsQueryOptions() {
  return queryOptions({
    queryKey: encyclopediaKeys.pokemonGoItems(),
    queryFn: () => fetchEncyclopediaApi<PokemonGoItemsPayload>("/api/encyclopedia/pokemon-go/items"),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 3
  });
}
