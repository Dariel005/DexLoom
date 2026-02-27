"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { pokemonSummaryQueryOptions } from "@/lib/pokemon-query-options";
import { fetchPokemonSearchIndex } from "@/lib/pokeapi";
import { type PokemonListEntry, type PokemonSearchIndexEntry } from "@/types/pokemon";

const MAX_GLOBAL_SEARCH_RESULTS = 96;
const SEARCH_SUMMARY_CONCURRENCY = 8;

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
) {
  if (items.length === 0) {
    return [] as R[];
  }

  const output = new Array<R>(items.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) {
        return;
      }
      output[index] = await mapper(items[index]);
    }
  }

  const workerCount = Math.min(Math.max(concurrency, 1), items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return output;
}

interface PreparedSearchQuery {
  normalized: string;
  compact: string;
  tokens: string[];
  idDigits: string | null;
  idNumber: number | null;
}

interface SearchableIndexEntry {
  id: number;
  idNumber: number;
  idText: string;
  paddedIdText: string;
  normalizedName: string;
  normalizedDisplayName: string;
  compactName: string;
  compactDisplayName: string;
  normalizedGeneration: string;
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2019'`]/g, "")
    .replace(/\u2640/g, " female ")
    .replace(/\u2642/g, " male ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function compactSearchText(value: string) {
  return value.replace(/\s+/g, "");
}

function prepareSearchQuery(query: string): PreparedSearchQuery {
  const normalized = normalizeSearchText(query);
  const compact = compactSearchText(normalized);
  const tokens = normalized ? normalized.split(" ").filter(Boolean) : [];

  const numericMatch = query.trim().match(/^#?\s*(\d{1,5})$/);
  const idDigits = numericMatch?.[1]
    ? String(Number.parseInt(numericMatch[1], 10))
    : null;

  return {
    normalized,
    compact,
    tokens,
    idDigits,
    idNumber: idDigits ? Number(idDigits) : null
  };
}

function createSearchableEntry(entry: PokemonSearchIndexEntry): SearchableIndexEntry {
  const normalizedName = normalizeSearchText(entry.name);
  const normalizedDisplayName = normalizeSearchText(entry.displayName);

  return {
    id: entry.id,
    idNumber: entry.id,
    idText: String(entry.id),
    paddedIdText: String(entry.id).padStart(4, "0"),
    normalizedName,
    normalizedDisplayName,
    compactName: compactSearchText(normalizedName),
    compactDisplayName: compactSearchText(normalizedDisplayName),
    normalizedGeneration: normalizeSearchText(entry.generation)
  };
}

function isSubsequence(needle: string, haystack: string) {
  if (!needle) {
    return true;
  }

  let needleIndex = 0;
  for (let i = 0; i < haystack.length; i += 1) {
    if (haystack[i] === needle[needleIndex]) {
      needleIndex += 1;
      if (needleIndex === needle.length) {
        return true;
      }
    }
  }

  return false;
}

function boundedLevenshtein(a: string, b: string, maxDistance: number) {
  if (a === b) {
    return 0;
  }

  if (Math.abs(a.length - b.length) > maxDistance) {
    return maxDistance + 1;
  }

  const previous = new Array<number>(b.length + 1);
  const current = new Array<number>(b.length + 1);

  for (let j = 0; j <= b.length; j += 1) {
    previous[j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    let rowMin = current[0];

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const deletion = previous[j] + 1;
      const insertion = current[j - 1] + 1;
      const substitution = previous[j - 1] + cost;
      const distance = Math.min(deletion, insertion, substitution);
      current[j] = distance;

      if (distance < rowMin) {
        rowMin = distance;
      }
    }

    if (rowMin > maxDistance) {
      return maxDistance + 1;
    }

    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

function scoreMatch(entry: SearchableIndexEntry, query: PreparedSearchQuery) {
  const { normalized, compact, tokens, idDigits, idNumber } = query;
  let score = 0;

  if (idDigits) {
    if (entry.idNumber === idNumber) {
      score += 1800;
    } else if (entry.idText.startsWith(idDigits)) {
      score += 1300;
    } else if (entry.paddedIdText.startsWith(idDigits)) {
      score += 1200;
    }
  }

  if (!normalized || !compact) {
    return score;
  }

  if (entry.normalizedName === normalized || entry.normalizedDisplayName === normalized) {
    score += 1600;
  } else if (entry.compactName === compact || entry.compactDisplayName === compact) {
    score += 1500;
  }

  if (
    entry.normalizedName.startsWith(normalized) ||
    entry.normalizedDisplayName.startsWith(normalized)
  ) {
    score += 1120;
  } else if (
    entry.compactName.startsWith(compact) ||
    entry.compactDisplayName.startsWith(compact)
  ) {
    score += 1020;
  }

  if (
    entry.normalizedName.includes(` ${normalized}`) ||
    entry.normalizedDisplayName.includes(` ${normalized}`)
  ) {
    score += 930;
  } else if (
    entry.normalizedName.includes(normalized) ||
    entry.normalizedDisplayName.includes(normalized)
  ) {
    score += 820;
  } else if (
    entry.compactName.includes(compact) ||
    entry.compactDisplayName.includes(compact)
  ) {
    score += 760;
  } else if (
    isSubsequence(compact, entry.compactName) ||
    isSubsequence(compact, entry.compactDisplayName)
  ) {
    score += 620;
  }

  if (entry.normalizedGeneration.includes(normalized)) {
    score += 520;
  }

  if (tokens.length > 1) {
    const tokenHits = tokens.filter((token) => {
      if (!token) {
        return false;
      }

      return (
        entry.normalizedName.includes(token) ||
        entry.normalizedDisplayName.includes(token) ||
        entry.normalizedGeneration.includes(token)
      );
    }).length;

    if (tokenHits === tokens.length) {
      score += 560 + tokens.length * 24;
    } else if (tokenHits > 0) {
      score += tokenHits * 85;
    }
  }

  if (compact.length >= 3 && compact.length <= 16) {
    const maxDistance = compact.length <= 5 ? 1 : compact.length <= 9 ? 2 : 3;
    const distance = Math.min(
      boundedLevenshtein(compact, entry.compactName, maxDistance),
      boundedLevenshtein(compact, entry.compactDisplayName, maxDistance)
    );

    if (distance <= maxDistance) {
      score += compact.length <= 5 ? 320 - distance * 110 : 400 - distance * 95;
    }
  }

  return score;
}

export function useGlobalPokemonSearch(query: string) {
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const preparedQuery = useMemo(() => prepareSearchQuery(debouncedQuery), [debouncedQuery]);
  const queryClient = useQueryClient();

  const isSearchActive =
    preparedQuery.normalized.length > 0 || preparedQuery.idDigits !== null;

  const indexQuery = useQuery({
    queryKey: ["pokemon-search-index"],
    queryFn: () => fetchPokemonSearchIndex(),
    staleTime: 1000 * 60 * 60 * 12,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: isSearchActive
  });

  const searchableIndex = useMemo(
    () => (indexQuery.data ?? []).map(createSearchableEntry),
    [indexQuery.data]
  );

  const matchedIds = useMemo(() => {
    if (!isSearchActive) {
      return [];
    }

    const ranked: Array<{ id: number; score: number }> = [];

    searchableIndex.forEach((entry) => {
      const score = scoreMatch(entry, preparedQuery);
      if (score > 0) {
        ranked.push({ id: entry.id, score });
      }
    });

    ranked.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.id - b.id;
    });

    return ranked.map((entry) => entry.id);
  }, [isSearchActive, preparedQuery, searchableIndex]);

  const resultIds = useMemo(
    () => matchedIds.slice(0, MAX_GLOBAL_SEARCH_RESULTS),
    [matchedIds]
  );

  const resultsQuery = useQuery({
    queryKey: [
      "pokemon-global-search",
      preparedQuery.normalized,
      preparedQuery.idDigits,
      resultIds
    ],
    queryFn: async () => {
      const entries = await mapWithConcurrency(
        resultIds,
        SEARCH_SUMMARY_CONCURRENCY,
        async (id) => {
          try {
            return await queryClient.ensureQueryData(pokemonSummaryQueryOptions(id));
          } catch {
            return null;
          }
        }
      );

      return entries.filter(isDefined) as PokemonListEntry[];
    },
    enabled: isSearchActive && resultIds.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 6
  });

  const hasLoadedResults = Boolean(resultsQuery.data && resultsQuery.data.length > 0);
  const isLoading =
    isSearchActive &&
    (indexQuery.isLoading ||
      (!hasLoadedResults &&
        resultIds.length > 0 &&
        (resultsQuery.isLoading || resultsQuery.isFetching)));

  return {
    debouncedQuery,
    isSearchActive,
    isLoading,
    isError: indexQuery.isError || resultsQuery.isError,
    results: resultsQuery.data ?? [],
    totalMatches: matchedIds.length,
    isResultLimited: matchedIds.length > MAX_GLOBAL_SEARCH_RESULTS
  };
}
