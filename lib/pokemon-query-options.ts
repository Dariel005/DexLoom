import {
  infiniteQueryOptions,
  queryOptions,
  type QueryFunctionContext
} from "@tanstack/react-query";
import {
  fetchPokemonAbilityDetail,
  fetchPokemonAbilityIndex,
  fetchPokemonData,
  fetchPokemonGenerationPage,
  fetchPokemonMoveDetail,
  fetchPokemonMoveIndex,
  fetchPokemonTypeDetail,
  fetchPokemonTypeIndex,
  fetchPokemonItemDetail,
  fetchPokemonItemIndex,
  fetchPokemonSummary,
  GENERATION_PAGE_SIZE
} from "@/lib/pokeapi";
import {
  fetchPokemonCardCatalog,
  fetchPokemonCardDetail,
  fetchPokemonCardIdsByType,
  fetchPokemonCardIndex,
  fetchPokemonCardTypes
} from "@/lib/pokemon-cards";
import {
  type PokemonCardDetail,
  type PokemonCardIndexEntry
} from "@/types/encyclopedia";
import { type GenerationKey } from "@/types/pokemon";

export const pokemonKeys = {
  generation: (generation: GenerationKey, pageSize = GENERATION_PAGE_SIZE) =>
    ["generation-pokemon", generation, pageSize] as const,
  itemIndex: () => ["pokemon-item-index"] as const,
  itemDetail: (id: string | number) => ["pokemon-item-detail", String(id)] as const,
  moveIndex: () => ["pokemon-move-index"] as const,
  moveDetail: (id: string | number) => ["pokemon-move-detail", String(id)] as const,
  abilityIndex: () => ["pokemon-ability-index"] as const,
  abilityDetail: (id: string | number) => ["pokemon-ability-detail", String(id)] as const,
  typeIndex: () => ["pokemon-type-index"] as const,
  typeDetail: (id: string | number) => ["pokemon-type-detail", String(id)] as const,
  cardCatalog: () => ["pokemon-card-catalog"] as const,
  cardIndex: () => ["pokemon-card-index", "v2"] as const,
  cardTypes: () => ["pokemon-card-types"] as const,
  cardTypeIds: (typeName: string) => ["pokemon-card-type-ids", typeName] as const,
  cardDetail: (id: string | number) => ["pokemon-card-detail", String(id)] as const,
  summary: (id: string | number) => ["pokemon-summary", String(id)] as const,
  detail: (id: string | number) => ["pokemon-detail", String(id)] as const
};

type GenerationQueryKey = ReturnType<typeof pokemonKeys.generation>;

async function fetchCardApi<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Pokemon TCG API proxy failed (${response.status})`);
  }

  const payload = (await response.json()) as { data?: T };
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    throw new Error("Pokemon TCG API proxy returned invalid payload.");
  }

  return payload.data as T;
}

export function generationPokemonQueryOptions(
  generation: GenerationKey,
  pageSize = GENERATION_PAGE_SIZE
) {
  return infiniteQueryOptions({
    queryKey: pokemonKeys.generation(generation, pageSize),
    initialPageParam: 0,
    queryFn: ({ pageParam }: QueryFunctionContext<GenerationQueryKey, number>) =>
      fetchPokemonGenerationPage(generation, pageParam, pageSize),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined
  });
}

export function pokemonDetailQueryOptions(id: string | number) {
  return queryOptions({
    queryKey: pokemonKeys.detail(id),
    queryFn: () => fetchPokemonData(id),
    enabled: Boolean(id)
  });
}

export function pokemonSummaryQueryOptions(id: string | number) {
  return queryOptions({
    queryKey: pokemonKeys.summary(id),
    queryFn: () => fetchPokemonSummary(id),
    staleTime: 1000 * 60 * 60 * 6,
    gcTime: 1000 * 60 * 60 * 24
  });
}

export function pokemonItemIndexQueryOptions() {
  return queryOptions({
    queryKey: pokemonKeys.itemIndex(),
    queryFn: () => fetchPokemonItemIndex(),
    staleTime: 1000 * 60 * 60 * 12,
    gcTime: 1000 * 60 * 60 * 24
  });
}

export function pokemonItemDetailQueryOptions(id: string | number) {
  return queryOptions({
    queryKey: pokemonKeys.itemDetail(id),
    queryFn: () => fetchPokemonItemDetail(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 60 * 12,
    gcTime: 1000 * 60 * 60 * 24
  });
}

export function pokemonMoveIndexQueryOptions() {
  return queryOptions({
    queryKey: pokemonKeys.moveIndex(),
    queryFn: () => fetchPokemonMoveIndex(),
    staleTime: 1000 * 60 * 60 * 12,
    gcTime: 1000 * 60 * 60 * 24
  });
}

export function pokemonMoveDetailQueryOptions(id: string | number) {
  return queryOptions({
    queryKey: pokemonKeys.moveDetail(id),
    queryFn: () => fetchPokemonMoveDetail(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 60 * 12,
    gcTime: 1000 * 60 * 60 * 24
  });
}

export function pokemonAbilityIndexQueryOptions() {
  return queryOptions({
    queryKey: pokemonKeys.abilityIndex(),
    queryFn: () => fetchPokemonAbilityIndex(),
    staleTime: 1000 * 60 * 60 * 12,
    gcTime: 1000 * 60 * 60 * 24
  });
}

export function pokemonAbilityDetailQueryOptions(id: string | number) {
  return queryOptions({
    queryKey: pokemonKeys.abilityDetail(id),
    queryFn: () => fetchPokemonAbilityDetail(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 60 * 12,
    gcTime: 1000 * 60 * 60 * 24
  });
}

export function pokemonTypeIndexQueryOptions() {
  return queryOptions({
    queryKey: pokemonKeys.typeIndex(),
    queryFn: () => fetchPokemonTypeIndex(),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 3
  });
}

export function pokemonTypeDetailQueryOptions(id: string | number) {
  return queryOptions({
    queryKey: pokemonKeys.typeDetail(id),
    queryFn: () => fetchPokemonTypeDetail(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 3
  });
}

export function pokemonCardIndexQueryOptions() {
  return queryOptions({
    queryKey: pokemonKeys.cardIndex(),
    queryFn: () =>
      typeof window === "undefined"
        ? fetchPokemonCardIndex()
        : fetchCardApi<PokemonCardIndexEntry[]>("/api/pokemon/tcg?view=index"),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 6
  });
}

export function pokemonCardCatalogQueryOptions() {
  return queryOptions({
    queryKey: pokemonKeys.cardCatalog(),
    queryFn: () =>
      typeof window === "undefined"
        ? fetchPokemonCardCatalog()
        : fetchCardApi<PokemonCardDetail[]>("/api/pokemon/tcg?view=catalog"),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 6
  });
}

export function pokemonCardTypesQueryOptions() {
  return queryOptions({
    queryKey: pokemonKeys.cardTypes(),
    queryFn: () =>
      typeof window === "undefined"
        ? fetchPokemonCardTypes()
        : fetchCardApi<string[]>("/api/pokemon/tcg?view=types"),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 3
  });
}

export function pokemonCardTypeIdsQueryOptions(typeName: string) {
  const safeTypeName = String(typeName ?? "").trim();
  return queryOptions({
    queryKey: pokemonKeys.cardTypeIds(safeTypeName),
    queryFn: () =>
      typeof window === "undefined"
        ? fetchPokemonCardIdsByType(safeTypeName)
        : fetchCardApi<string[]>(
            `/api/pokemon/tcg?view=type-ids&type=${encodeURIComponent(safeTypeName)}`
          ),
    enabled: Boolean(safeTypeName) && safeTypeName !== "all",
    staleTime: 1000 * 60 * 60 * 6,
    gcTime: 1000 * 60 * 60 * 24
  });
}

export function pokemonCardDetailQueryOptions(id: string | number) {
  return queryOptions({
    queryKey: pokemonKeys.cardDetail(id),
    queryFn: () =>
      typeof window === "undefined"
        ? fetchPokemonCardDetail(id)
        : fetchCardApi<PokemonCardDetail>(`/api/pokemon/tcg/${encodeURIComponent(String(id))}`),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 6
  });
}
