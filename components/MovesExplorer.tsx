"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent
} from "react";
import { EncyclopediaDataTable } from "@/components/EncyclopediaDataTable";
import { ExplorerDetailSection, ExplorerEmptyState, ExplorerPagination, ExplorerSearchBar } from "@/components/explorer";
import { FavoriteStarButton } from "@/components/FavoriteStarButton";
import { PokedexFrame } from "@/components/PokedexFrame";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { TypeBadge } from "@/components/TypeBadge";
import { VirtualizedStack } from "@/components/VirtualizedStack";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUiTone } from "@/hooks/useUiTone";
import {
  pokemonMoveDetailQueryOptions,
  pokemonMoveIndexQueryOptions
} from "@/lib/pokemon-query-options";
import { cn } from "@/lib/utils";

const MOVES_PER_PAGE = 48;

type MoveSortMode = "id-asc" | "id-desc" | "name-asc";
type MoveCatalogDensity = "compact" | "detail";

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function sanitizeSort(value: string): MoveSortMode {
  if (value === "id-desc" || value === "name-asc") {
    return value;
  }
  return "id-asc";
}

function formatBattleMetric(value: number | null, suffix = "") {
  if (value === null) {
    return "N/A";
  }
  return `${value}${suffix}`;
}

function buildMoveTier(power: number | null, accuracy: number | null, priority: number) {
  let score = 0;
  if (power !== null) {
    if (power >= 100) {
      score += 3;
    } else if (power >= 80) {
      score += 2;
    } else if (power >= 60) {
      score += 1;
    }
  }
  if (accuracy !== null) {
    if (accuracy >= 95) {
      score += 2;
    } else if (accuracy >= 80) {
      score += 1;
    }
  }
  if (priority > 0) {
    score += 2;
  }

  if (score >= 6) {
    return { label: "S", color: "#157347", bg: "rgba(21, 115, 71, 0.14)" };
  }
  if (score >= 4) {
    return { label: "A", color: "#1f6feb", bg: "rgba(31, 111, 235, 0.14)" };
  }
  if (score >= 2) {
    return { label: "B", color: "#a15c00", bg: "rgba(161, 92, 0, 0.14)" };
  }
  return { label: "C", color: "#7a4f9a", bg: "rgba(122, 79, 154, 0.14)" };
}

/* DetailSection replaced by ExplorerDetailSection from @/components/explorer */

export function MovesExplorer() {
  const playUiTone = useUiTone();
  const [searchInput, setSearchInput] = useState("");
  const [sortMode, setSortMode] = useState<MoveSortMode>("id-asc");
  const [catalogDensity, setCatalogDensity] = useState<MoveCatalogDensity>("detail");
  const [page, setPage] = useState(1);
  const [selectedMoveId, setSelectedMoveId] = useState<number | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 220);
  const didMountSearchRef = useRef(false);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handleSearchClear = useCallback(() => {
    playUiTone("switch");
    setSearchInput("");
  }, [playUiTone]);

  const handleSortChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      playUiTone("switch");
      setSortMode(sanitizeSort(event.target.value));
    },
    [playUiTone]
  );

  const handleCatalogDensityChange = useCallback(
    (nextDensity: MoveCatalogDensity) => {
      setCatalogDensity((current) => {
        if (current !== nextDensity) {
          playUiTone("switch");
        }
        return nextDensity;
      });
    },
    [playUiTone]
  );

  const handleSelectMove = useCallback(
    (moveId: number) => {
      setSelectedMoveId((current) => {
        playUiTone(current === moveId ? "switch" : "select");
        return moveId;
      });
    },
    [playUiTone]
  );

  const handlePreviousPage = useCallback(() => {
    setPage((current) => {
      const next = Math.max(1, current - 1);
      if (next !== current) {
        playUiTone("switch");
      }
      return next;
    });
  }, [playUiTone]);

  const indexQuery = useQuery(pokemonMoveIndexQueryOptions());
  const moves = useMemo(() => indexQuery.data ?? [], [indexQuery.data]);

  const filteredMoves = useMemo(() => {
    const query = normalize(debouncedSearch);
    const result = moves.filter((move) => {
      if (!query) {
        return true;
      }
      return (
        normalize(move.name).includes(query) ||
        normalize(move.displayName).includes(query) ||
        String(move.id).startsWith(query)
      );
    });

    if (sortMode === "id-desc") {
      return result.slice().sort((a, b) => b.id - a.id);
    }
    if (sortMode === "name-asc") {
      return result.slice().sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    return result.slice().sort((a, b) => a.id - b.id);
  }, [debouncedSearch, moves, sortMode]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filteredMoves.length / MOVES_PER_PAGE));
  const isCompactDensity = catalogDensity === "compact";
  const moveRowHeight = isCompactDensity ? 44 : 52;
  const moveRowGap = isCompactDensity ? 4 : 6;
  const totalPagesRef = useRef(totalPages);
  totalPagesRef.current = totalPages;

  const handleNextPage = useCallback(() => {
    setPage((current) => {
      const next = Math.min(totalPagesRef.current, current + 1);
      if (next !== current) {
        playUiTone("switch");
      }
      return next;
    });
  }, [playUiTone]);

  const safePage = Math.min(page, totalPages);
  const pagedMoves = useMemo(
    () => filteredMoves.slice((safePage - 1) * MOVES_PER_PAGE, safePage * MOVES_PER_PAGE),
    [filteredMoves, safePage]
  );

  useEffect(() => {
    if (safePage !== page) {
      setPage(safePage);
    }
  }, [page, safePage]);

  useEffect(() => {
    if (!didMountSearchRef.current) {
      didMountSearchRef.current = true;
      return;
    }

    if (debouncedSearch.trim().length > 0) {
      playUiTone("scroll");
    }
  }, [debouncedSearch, playUiTone]);

  useEffect(() => {
    if (filteredMoves.length === 0) {
      setSelectedMoveId(null);
      return;
    }
    if (selectedMoveId && filteredMoves.some((move) => move.id === selectedMoveId)) {
      return;
    }
    setSelectedMoveId(pagedMoves[0]?.id ?? filteredMoves[0]?.id ?? null);
  }, [filteredMoves, pagedMoves, selectedMoveId]);

  const detailQuery = useQuery({
    ...pokemonMoveDetailQueryOptions(selectedMoveId ?? ""),
    enabled: Boolean(selectedMoveId),
    placeholderData: keepPreviousData
  });
  const selectedMove = detailQuery.data ?? null;
  const moveTier = useMemo(
    () =>
      selectedMove
        ? buildMoveTier(selectedMove.power, selectedMove.accuracy, selectedMove.priority)
        : null,
    [selectedMove]
  );

  const frameStatus = useMemo(() => {
    if (indexQuery.isError || detailQuery.isError) {
      return "error" as const;
    }
    if (
      indexQuery.isLoading ||
      (detailQuery.isLoading && Boolean(selectedMoveId))
    ) {
      return "loading" as const;
    }
    return "success" as const;
  }, [detailQuery.isError, detailQuery.isLoading, indexQuery.isError, indexQuery.isLoading, selectedMoveId]);

  const leftPanel = (
    <section className="dex-reading-copy space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <RouteTransitionLink
          href="/"
          className="gbc-nav-link pixel-font inline-flex rounded-lg border border-black/25 bg-white/65 px-3 py-2 text-[10px] uppercase tracking-wide text-black/75 transition hover:bg-white"
        >
          Back to Pokedex
        </RouteTransitionLink>
      </div>

      <div className="rounded-2xl border border-black/20 bg-white/55 p-3">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Move Explorer
        </p>

        <ExplorerSearchBar
          id="moves-search"
          value={searchInput}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          placeholder="Search moves..."
          trailing={
            <select
              value={sortMode}
              onChange={handleSortChange}
              className="rounded-lg border border-black/20 bg-white/75 px-2.5 py-2 text-xs text-black/70"
            >
              <option value="id-asc">Dex order</option>
              <option value="id-desc">Reverse dex</option>
              <option value="name-asc">Name A-Z</option>
            </select>
          }
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-black/60">
            Visible: {filteredMoves.length} | Total: {moves.length}
          </p>
          <div className="inline-flex items-center gap-1 rounded-lg border border-black/20 bg-white/70 p-1">
            <button
              type="button"
              onClick={() => handleCatalogDensityChange("compact")}
              className={cn(
                "pixel-font rounded-md px-2 py-1 text-[8px] uppercase tracking-[0.12em] transition",
                isCompactDensity
                  ? "border border-black/30 bg-[var(--theme-accent)] text-white"
                  : "border border-transparent text-black/70 hover:bg-white"
              )}
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => handleCatalogDensityChange("detail")}
              className={cn(
                "pixel-font rounded-md px-2 py-1 text-[8px] uppercase tracking-[0.12em] transition",
                !isCompactDensity
                  ? "border border-black/30 bg-[var(--theme-accent)] text-white"
                  : "border border-transparent text-black/70 hover:bg-white"
              )}
            >
              Detail
            </button>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-black/20 bg-white/55 p-3">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Move Catalog
        </p>
        {indexQuery.isLoading ? (
          <div className="pokemon-scrollbar mt-3 h-[58vh] min-h-[360px] max-h-[86vh] sm:h-[64vh] sm:min-h-[520px] sm:max-h-[88vh] lg:h-[72vh] lg:min-h-[760px] lg:max-h-[900px] overflow-y-scroll pr-1">
            <div className="space-y-2">
              {Array.from({ length: 14 }).map((_, index) => (
                <div
                  key={`move-skeleton-${index}`}
                  className={cn(
                    "animate-pulse rounded-lg bg-black/10",
                    isCompactDensity ? "h-10" : "h-12"
                  )}
                />
              ))}
            </div>
          </div>
        ) : null}

        {!indexQuery.isLoading && pagedMoves.length === 0 ? (
          <div className="pokemon-scrollbar mt-3 h-[58vh] min-h-[360px] max-h-[86vh] sm:h-[64vh] sm:min-h-[520px] sm:max-h-[88vh] lg:h-[72vh] lg:min-h-[760px] lg:max-h-[900px] overflow-y-scroll pr-1">
            <ExplorerEmptyState message="No moves found with this filter." />
          </div>
        ) : null}

        {pagedMoves.length > 0 ? (
          <VirtualizedStack
            items={pagedMoves}
            itemKey={(move) => move.id}
            itemHeight={moveRowHeight}
            gap={moveRowGap}
            overscan={8}
            className="pokemon-scrollbar mt-3 h-[58vh] min-h-[360px] max-h-[86vh] sm:h-[64vh] sm:min-h-[520px] sm:max-h-[88vh] lg:h-[72vh] lg:min-h-[760px] lg:max-h-[900px] overflow-y-scroll pr-1"
            renderItem={(move) => {
              const isSelected = move.id === selectedMoveId;

              return (
                <button
                  type="button"
                  onClick={() => handleSelectMove(move.id)}
                  className={cn(
                    "h-full w-full rounded-lg border text-left transition",
                    isCompactDensity ? "px-2.5 py-1.5" : "px-3 py-2",
                    isSelected
                      ? "border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-black/85 pokedex-accent-glow"
                      : "border-black/20 bg-white/70 text-black/75 hover:bg-white"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "pixel-font uppercase tracking-[0.13em]",
                        isCompactDensity ? "text-[8px]" : "text-[9px]"
                      )}
                    >
                      #{move.id.toString().padStart(4, "0")}
                    </p>
                    {!isCompactDensity ? (
                      <span className="text-[11px] text-black/55">Move</span>
                    ) : null}
                  </div>
                  <p
                    className={cn(
                      "pixel-font mt-1 uppercase tracking-[0.12em]",
                      isCompactDensity ? "line-clamp-1 text-[9px]" : "text-[10px]"
                    )}
                  >
                    {move.displayName}
                  </p>
                </button>
              );
            }}
          />
        ) : null}

        <ExplorerPagination
          currentPage={safePage}
          totalPages={totalPages}
          onPrevious={handlePreviousPage}
          onNext={handleNextPage}
          className="mt-3"
        />
      </section>
    </section>
  );

  const rightPanel = (
    <section className="dex-reading-copy space-y-4">
      <div className="rounded-2xl border border-black/20 bg-white/55 p-4 min-h-[420px] sm:min-h-[560px] lg:min-h-[760px]">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Move Details
        </p>

        {detailQuery.isLoading ? (
          <div className="mt-3 space-y-3">
            <div className="h-6 w-2/3 animate-pulse rounded bg-black/10" />
            <div className="h-24 animate-pulse rounded-xl bg-black/10" />
            <div className="h-28 animate-pulse rounded-xl bg-black/10" />
            <div className="h-24 animate-pulse rounded-xl bg-black/10" />
          </div>
        ) : null}

        {!detailQuery.isLoading && !selectedMove ? (
          <p className="mt-3 rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-4 text-sm text-black/65">
            Select a move to open full detail data.
          </p>
        ) : null}

        {selectedMove ? (
          <div className="mt-3 space-y-4">
            <div
              className="rounded-2xl border p-4"
              style={
                {
                  borderColor: "rgba(0,0,0,0.18)",
                  background:
                    "linear-gradient(145deg, rgba(248,251,248,0.9), rgba(232,239,233,0.82))"
                } as CSSProperties
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/60">
                    Move #{selectedMove.id.toString().padStart(4, "0")}
                  </p>
                  <h1 className="pixel-font mt-1 text-[14px] uppercase tracking-wide text-black/85">
                    {selectedMove.displayName}
                  </h1>
                  <p className="mt-1 text-sm text-black/65">
                    {selectedMove.generation ?? "Unknown generation"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <RouteTransitionLink
                    href={`/moves/${selectedMove.id}`}
                    className="gbc-nav-link rounded-md border border-black/20 bg-white/80 px-2 py-1 text-xs text-black/75"
                  >
                    Open entry
                  </RouteTransitionLink>
                  <FavoriteStarButton
                    favorite={{
                      entityType: "move",
                      entityId: String(selectedMove.id),
                      title: selectedMove.displayName,
                      href: `/moves/${selectedMove.id}`,
                      subtitle: selectedMove.damageClass ?? "Move entry",
                      tags: [
                        "move",
                        selectedMove.type?.toLowerCase() ?? "unknown-type",
                        (selectedMove.damageClass ?? "unknown-class").toLowerCase()
                      ]
                    }}
                  />
                  {selectedMove.type ? (
                    <TypeBadge type={selectedMove.type} className="h-6 min-w-[84px] text-[8px]" />
                  ) : null}
                  <span className="rounded-md border border-black/20 bg-white/75 px-2 py-1 text-xs">
                    {selectedMove.damageClass ?? "Unknown class"}
                  </span>
                  {moveTier ? (
                    <span
                      className="rounded-md border px-2 py-1 text-xs"
                      style={{
                        borderColor: moveTier.color,
                        color: moveTier.color,
                        backgroundColor: moveTier.bg
                      }}
                    >
                      Tier {moveTier.label}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <ExplorerDetailSection title="Battle Metrics" subtitle="Core values used in combat calculations.">
              <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                  Power: {formatBattleMetric(selectedMove.power)}
                </p>
                <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                  Accuracy: {formatBattleMetric(selectedMove.accuracy, "%")}
                </p>
                <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                  PP: {formatBattleMetric(selectedMove.pp)}
                </p>
                <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                  Priority: {selectedMove.priority}
                </p>
                <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                  Effect Chance: {formatBattleMetric(selectedMove.effectChance, "%")}
                </p>
                <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                  Target: {selectedMove.target ?? "Unknown"}
                </p>
              </div>
            </ExplorerDetailSection>

            <ExplorerDetailSection title="Effect Notes" subtitle="Official move behavior in practical terms.">
              <p className="text-sm text-black/80">
                {selectedMove.shortEffect ??
                  selectedMove.effect ??
                  selectedMove.flavorText ??
                  "No English effect entry available."}
              </p>
              {selectedMove.effect && selectedMove.effect !== selectedMove.shortEffect ? (
                <p className="mt-2 text-sm text-black/70">{selectedMove.effect}</p>
              ) : null}
            </ExplorerDetailSection>

            <ExplorerDetailSection
              title="Known Learners"
              subtitle={`Sample list (${selectedMove.learnedByPokemon.length}/${selectedMove.learnedByPokemonCount}).`}
            >
              <EncyclopediaDataTable
                rows={selectedMove.learnedByPokemon}
                rowKey={(pokemonName, index) => `${pokemonName}-${index}`}
                columns={[
                  {
                    key: "pokemon",
                    header: "Pokemon",
                    render: (pokemonName) => pokemonName
                  }
                ]}
              />
            </ExplorerDetailSection>
          </div>
        ) : null}
      </div>
    </section>
  );

  return (
    <PokedexFrame
      title="Pokemon Moves Encyclopedia"
      status={frameStatus}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
    />
  );
}

