"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { EncyclopediaDataTable } from "@/components/EncyclopediaDataTable";
import { ExplorerDetailSection, ExplorerEmptyState, ExplorerPagination, ExplorerSearchBar } from "@/components/explorer";
import { FavoriteStarButton } from "@/components/FavoriteStarButton";
import { PokedexFrame } from "@/components/PokedexFrame";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { VirtualizedStack } from "@/components/VirtualizedStack";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUiTone } from "@/hooks/useUiTone";
import {
  pokemonAbilityDetailQueryOptions,
  pokemonAbilityIndexQueryOptions
} from "@/lib/pokemon-query-options";
import { cn } from "@/lib/utils";

const ABILITIES_PER_PAGE = 42;
const ABILITY_ROW_HEIGHT = 60;

type AbilitySortMode = "id-asc" | "id-desc" | "name-asc";

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function sanitizeSort(value: string): AbilitySortMode {
  if (value === "id-desc" || value === "name-asc") {
    return value;
  }
  return "id-asc";
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function buildAbilityMonogram(name: string) {
  const alphanumeric = name.replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (alphanumeric.length >= 2) {
    return alphanumeric.slice(0, 2);
  }
  if (alphanumeric.length === 1) {
    return `${alphanumeric}A`;
  }
  return "AB";
}

function buildAbilityPalette(name: string, isMainSeries: boolean) {
  const hue = hashString(name) % 360;
  const saturation = isMainSeries ? 66 : 52;
  const lightness = isMainSeries ? 48 : 42;
  const accent = `hsl(${hue} ${saturation}% ${lightness}%)`;
  const glow = `hsl(${hue} ${Math.min(saturation + 8, 90)}% 74%)`;
  const soft = `hsla(${hue} ${Math.max(saturation - 12, 30)}% 88% / 0.92)`;

  return { accent, glow, soft };
}

function AbilityIcon({
  name,
  isMainSeries,
  size = "sm"
}: {
  name: string;
  isMainSeries: boolean;
  size?: "sm" | "lg";
}) {
  const monogram = buildAbilityMonogram(name);
  const palette = buildAbilityPalette(name, isMainSeries);

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]",
        size === "lg" ? "h-14 w-14 text-[11px]" : "h-8 w-8 text-[8px]"
      )}
      style={{
        borderColor: palette.accent,
        background: `radial-gradient(circle at 22% 18%, rgba(255,255,255,0.92), ${palette.soft})`,
        boxShadow: `0 0 0 1px ${palette.accent}, 0 8px 14px ${palette.glow}`
      }}
    >
      <span className="pixel-font uppercase tracking-[0.08em] text-black/80">{monogram}</span>
    </span>
  );
}

function classifyAbilityTier(pokemonCount: number, isMainSeries: boolean) {
  let score = 0;
  if (pokemonCount >= 60) {
    score += 3;
  } else if (pokemonCount >= 30) {
    score += 2;
  } else if (pokemonCount >= 15) {
    score += 1;
  }
  if (isMainSeries) {
    score += 1;
  }

  if (score >= 4) {
    return { label: "S", color: "#157347", bg: "rgba(21, 115, 71, 0.14)" };
  }
  if (score >= 3) {
    return { label: "A", color: "#1f6feb", bg: "rgba(31, 111, 235, 0.14)" };
  }
  if (score >= 2) {
    return { label: "B", color: "#a15c00", bg: "rgba(161, 92, 0, 0.14)" };
  }
  return { label: "C", color: "#7a4f9a", bg: "rgba(122, 79, 154, 0.14)" };
}

/* DetailSection replaced by ExplorerDetailSection from @/components/explorer */

export function AbilitiesExplorer() {
  const playUiTone = useUiTone();
  const [searchInput, setSearchInput] = useState("");
  const [sortMode, setSortMode] = useState<AbilitySortMode>("id-asc");
  const [page, setPage] = useState(1);
  const [selectedAbilityId, setSelectedAbilityId] = useState<number | null>(null);
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

  const handleSelectAbility = useCallback(
    (abilityId: number) => {
      setSelectedAbilityId((current) => {
        playUiTone(current === abilityId ? "switch" : "select");
        return abilityId;
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

  const handleNextPage = useCallback(() => {
    setPage((current) => {
      const next = Math.min(totalPagesRef.current, current + 1);
      if (next !== current) {
        playUiTone("switch");
      }
      return next;
    });
  }, [playUiTone]);

  const indexQuery = useQuery(pokemonAbilityIndexQueryOptions());
  const abilities = useMemo(() => indexQuery.data ?? [], [indexQuery.data]);

  const filteredAbilities = useMemo(() => {
    const query = normalize(debouncedSearch);
    const result = abilities.filter((ability) => {
      if (!query) {
        return true;
      }
      return (
        normalize(ability.name).includes(query) ||
        normalize(ability.displayName).includes(query) ||
        String(ability.id).startsWith(query)
      );
    });

    if (sortMode === "id-desc") {
      return result.slice().sort((a, b) => b.id - a.id);
    }
    if (sortMode === "name-asc") {
      return result.slice().sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    return result.slice().sort((a, b) => a.id - b.id);
  }, [abilities, debouncedSearch, sortMode]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filteredAbilities.length / ABILITIES_PER_PAGE));
  const totalPagesRef = useRef(totalPages);
  totalPagesRef.current = totalPages;
  const safePage = Math.min(page, totalPages);
  const pagedAbilities = useMemo(
    () => filteredAbilities.slice((safePage - 1) * ABILITIES_PER_PAGE, safePage * ABILITIES_PER_PAGE),
    [filteredAbilities, safePage]
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
    if (filteredAbilities.length === 0) {
      setSelectedAbilityId(null);
      return;
    }
    if (selectedAbilityId && filteredAbilities.some((ability) => ability.id === selectedAbilityId)) {
      return;
    }
    setSelectedAbilityId(pagedAbilities[0]?.id ?? filteredAbilities[0]?.id ?? null);
  }, [filteredAbilities, pagedAbilities, selectedAbilityId]);

  const detailQuery = useQuery({
    ...pokemonAbilityDetailQueryOptions(selectedAbilityId ?? ""),
    enabled: Boolean(selectedAbilityId),
    placeholderData: keepPreviousData
  });
  const selectedAbility = detailQuery.data ?? null;
  const abilityTier = useMemo(
    () =>
      selectedAbility
        ? classifyAbilityTier(selectedAbility.pokemonCount, selectedAbility.isMainSeries)
        : null,
    [selectedAbility]
  );

  const frameStatus = useMemo(() => {
    if (indexQuery.isError || detailQuery.isError) {
      return "error" as const;
    }
    if (indexQuery.isLoading || (detailQuery.isLoading && Boolean(selectedAbilityId))) {
      return "loading" as const;
    }
    return "success" as const;
  }, [detailQuery.isError, detailQuery.isLoading, indexQuery.isError, indexQuery.isLoading, selectedAbilityId]);

  const leftPanel = (
    <section className="space-y-4">
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
          Ability Explorer
        </p>

        <ExplorerSearchBar
          id="abilities-search"
          value={searchInput}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          placeholder="Search abilities..."
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

        <p className="mt-2 text-xs text-black/60">
          Visible: {filteredAbilities.length} | Total: {abilities.length}
        </p>
      </div>

      <section className="rounded-2xl border border-black/20 bg-white/55 p-3">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Ability Catalog
        </p>
        {indexQuery.isLoading ? (
          <div className="pokemon-scrollbar mt-3 h-[58vh] min-h-[360px] max-h-[86vh] sm:h-[64vh] sm:min-h-[520px] sm:max-h-[88vh] lg:h-[72vh] lg:min-h-[760px] lg:max-h-[900px] overflow-y-scroll pr-1">
            <div className="space-y-2">
              {Array.from({ length: 14 }).map((_, index) => (
                <div
                  key={`ability-skeleton-${index}`}
                  className="animate-pulse rounded-lg bg-black/10"
                  style={{ height: `${ABILITY_ROW_HEIGHT}px` }}
                />
              ))}
            </div>
          </div>
        ) : null}

        {!indexQuery.isLoading && pagedAbilities.length === 0 ? (
          <div className="pokemon-scrollbar mt-3 h-[58vh] min-h-[360px] max-h-[86vh] sm:h-[64vh] sm:min-h-[520px] sm:max-h-[88vh] lg:h-[72vh] lg:min-h-[760px] lg:max-h-[900px] overflow-y-scroll pr-1">
            <ExplorerEmptyState message="No abilities found with this filter." />
          </div>
        ) : null}

        {pagedAbilities.length > 0 ? (
          <VirtualizedStack
            items={pagedAbilities}
            itemKey={(ability) => ability.id}
            itemHeight={ABILITY_ROW_HEIGHT}
            gap={6}
            overscan={8}
            className="pokemon-scrollbar mt-3 h-[58vh] min-h-[360px] max-h-[86vh] sm:h-[64vh] sm:min-h-[520px] sm:max-h-[88vh] lg:h-[72vh] lg:min-h-[760px] lg:max-h-[900px] overflow-y-scroll pr-1"
            renderItem={(ability) => {
              const isSelected = ability.id === selectedAbilityId;

              return (
                <button
                  type="button"
                  onClick={() => handleSelectAbility(ability.id)}
                  className={cn(
                    "h-full w-full rounded-lg border px-3 py-2 text-left transition",
                    isSelected
                      ? "border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-black/85 pokedex-accent-glow"
                      : "border-black/20 bg-white/70 text-black/75 hover:bg-white"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <AbilityIcon
                        name={ability.displayName}
                        isMainSeries={ability.isMainSeries}
                      />
                      <div className="min-w-0">
                        <p className="pixel-font text-[9px] uppercase tracking-[0.13em]">
                          #{ability.id.toString().padStart(4, "0")}
                        </p>
                        <p className="pixel-font truncate text-[10px] uppercase tracking-[0.12em]">
                          {ability.displayName}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] text-black/55">
                      {ability.isMainSeries ? "Main Series" : "Special"}
                    </span>
                  </div>
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
    <section className="space-y-4">
      <div className="rounded-2xl border border-black/20 bg-white/55 p-4 min-h-[420px] sm:min-h-[560px] lg:min-h-[760px]">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Ability Details
        </p>

        {detailQuery.isLoading ? (
          <div className="mt-3 space-y-3">
            <div className="h-6 w-2/3 animate-pulse rounded bg-black/10" />
            <div className="h-24 animate-pulse rounded-xl bg-black/10" />
            <div className="h-28 animate-pulse rounded-xl bg-black/10" />
            <div className="h-24 animate-pulse rounded-xl bg-black/10" />
          </div>
        ) : null}

        {!detailQuery.isLoading && !selectedAbility ? (
          <p className="mt-3 rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-4 text-sm text-black/65">
            Select an ability to open full detail data.
          </p>
        ) : null}

        {selectedAbility ? (
          <div className="mt-3 space-y-4">
            <div className="rounded-2xl border border-black/20 bg-[linear-gradient(145deg,rgba(248,251,248,0.9),rgba(232,239,233,0.82))] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AbilityIcon
                    name={selectedAbility.displayName}
                    isMainSeries={selectedAbility.isMainSeries}
                    size="lg"
                  />
                  <div>
                    <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/60">
                      Ability #{selectedAbility.id.toString().padStart(4, "0")}
                    </p>
                    <h1 className="pixel-font mt-1 text-[14px] uppercase tracking-wide text-black/85">
                      {selectedAbility.displayName}
                    </h1>
                    <p className="mt-1 text-sm text-black/65">
                      {selectedAbility.generation ?? "Unknown generation"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <RouteTransitionLink
                    href={`/abilities/${selectedAbility.id}`}
                    className="gbc-nav-link rounded-md border border-black/20 bg-white/80 px-2 py-1 text-xs text-black/75"
                  >
                    Open entry
                  </RouteTransitionLink>
                  <FavoriteStarButton
                    favorite={{
                      entityType: "ability",
                      entityId: String(selectedAbility.id),
                      title: selectedAbility.displayName,
                      href: `/abilities/${selectedAbility.id}`,
                      subtitle: selectedAbility.generation ?? "Ability entry",
                      tags: [
                        "ability",
                        selectedAbility.isMainSeries ? "main-series" : "special"
                      ]
                    }}
                  />
                  <span className="rounded-md border border-black/20 bg-white/75 px-2 py-1 text-xs">
                    {selectedAbility.isMainSeries ? "Main series" : "Special ability"}
                  </span>
                  {abilityTier ? (
                    <span
                      className="rounded-md border px-2 py-1 text-xs"
                      style={{
                        borderColor: abilityTier.color,
                        color: abilityTier.color,
                        backgroundColor: abilityTier.bg
                      }}
                    >
                      Tier {abilityTier.label}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <ExplorerDetailSection title="Effect Notes" subtitle="Official behavior and practical wording.">
              <p className="text-sm text-black/80">
                {selectedAbility.shortEffect ??
                  selectedAbility.effect ??
                  selectedAbility.flavorText ??
                  "No English effect entry available."}
              </p>
              {selectedAbility.effect && selectedAbility.effect !== selectedAbility.shortEffect ? (
                <p className="mt-2 text-sm text-black/70">{selectedAbility.effect}</p>
              ) : null}
            </ExplorerDetailSection>

            <ExplorerDetailSection title="Meta Snapshot" subtitle="Adoption and distribution overview.">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                  Pokemon with this ability: {selectedAbility.pokemonCount}
                </p>
                <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
                  Main series support: {selectedAbility.isMainSeries ? "Yes" : "No"}
                </p>
              </div>
            </ExplorerDetailSection>

            <ExplorerDetailSection
              title="Pokemon Sample"
              subtitle={`Sample list (${selectedAbility.pokemonSample.length}/${selectedAbility.pokemonCount}).`}
            >
              <EncyclopediaDataTable
                rows={selectedAbility.pokemonSample}
                rowKey={(entry, index) => `${entry.name}-${entry.slot}-${index}`}
                columns={[
                  {
                    key: "name",
                    header: "Pokemon",
                    render: (entry) => entry.name
                  },
                  {
                    key: "slot",
                    header: "Slot",
                    render: (entry) => entry.slot
                  },
                  {
                    key: "hidden",
                    header: "Hidden",
                    render: (entry) => (entry.isHidden ? "Yes" : "No")
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
      title="Pokemon Abilities Encyclopedia"
      status={frameStatus}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
    />
  );
}


