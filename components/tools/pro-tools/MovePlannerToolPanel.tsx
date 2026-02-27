"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { EncyclopediaDataTable } from "@/components/EncyclopediaDataTable";
import {
  buildQuickMovePlan,
  formatOptionLabel,
  normalizeName
} from "@/lib/pokedex-pro-tools";
import { pokemonDetailQueryOptions } from "@/lib/pokemon-query-options";
import { cn } from "@/lib/utils";
import { useToolsWorkbenchStore } from "@/store/tools-workbench-store";
import { type PokemonListEntry } from "@/types/pokemon";
import { useShallow } from "zustand/react/shallow";

interface MovePlannerToolPanelProps {
  candidatePokemon: PokemonListEntry[];
  selectedPokemonId: number | null;
  className?: string;
}

export function MovePlannerToolPanel({
  candidatePokemon,
  selectedPokemonId,
  className
}: MovePlannerToolPanelProps) {
  const {
    plannerPokemonId,
    plannerQuery,
    plannerMethodFilter,
    setPlannerPokemonId,
    setPlannerQuery,
    setPlannerMethodFilter
  } = useToolsWorkbenchStore(
    useShallow((state) => ({
      plannerPokemonId: state.plannerPokemonId,
      plannerQuery: state.plannerQuery,
      plannerMethodFilter: state.plannerMethodFilter,
      setPlannerPokemonId: state.setPlannerPokemonId,
      setPlannerQuery: state.setPlannerQuery,
      setPlannerMethodFilter: state.setPlannerMethodFilter
    }))
  );

  const options = useMemo(() => candidatePokemon.slice(0, 480), [candidatePokemon]);

  useEffect(() => {
    if (options.length === 0) {
      return;
    }
    if (plannerPokemonId && options.some((entry) => entry.id === plannerPokemonId)) {
      return;
    }
    if (selectedPokemonId && options.some((entry) => entry.id === selectedPokemonId)) {
      setPlannerPokemonId(selectedPokemonId);
      return;
    }
    setPlannerPokemonId(options[0].id);
  }, [options, plannerPokemonId, selectedPokemonId, setPlannerPokemonId]);

  const plannerQueryResult = useQueries({
    queries: [
      {
        ...pokemonDetailQueryOptions(plannerPokemonId ?? ""),
        enabled: Boolean(plannerPokemonId)
      }
    ]
  });
  const plannerData = plannerQueryResult[0]?.data ?? null;

  const plannerMethods = useMemo(() => {
    if (!plannerData) {
      return [];
    }
    const values = new Set<string>();
    plannerData.moves.forEach((move) => {
      move.learnMethods.forEach((method) => values.add(method));
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [plannerData]);

  const filteredPlannerMoves = useMemo(() => {
    if (!plannerData) {
      return [];
    }

    const normalizedQuery = normalizeName(plannerQuery);
    const normalizedMethod = normalizeName(plannerMethodFilter);

    return plannerData.moves.filter((move) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        normalizeName(move.name).includes(normalizedQuery);
      const matchesMethod =
        normalizedMethod === "all" ||
        move.learnMethods.some((method) => normalizeName(method) === normalizedMethod);
      return matchesQuery && matchesMethod;
    });
  }, [plannerData, plannerMethodFilter, plannerQuery]);

  const quickMovePlan = useMemo(() => {
    if (!plannerData) {
      return [];
    }
    return buildQuickMovePlan(plannerData.moves);
  }, [plannerData]);

  if (options.length === 0) {
    return (
      <div className={cn("rounded-xl border border-black/20 bg-white/72 p-3 text-sm text-black/74", className)}>
        Tool data is temporarily unavailable. Please refresh in a moment.
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs text-black/60">Pokemon</span>
          <select
            value={plannerPokemonId ?? ""}
            onChange={(event) => {
              const value = Number(event.target.value);
              setPlannerPokemonId(Number.isFinite(value) ? value : null);
            }}
            className="w-full rounded-lg border border-black/20 bg-white/70 px-2 py-2 text-xs"
          >
            {options.map((entry) => (
              <option key={`planner-${entry.id}`} value={entry.id}>
                {formatOptionLabel(entry)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-black/60">Method filter</span>
          <select
            value={plannerMethodFilter}
            onChange={(event) => setPlannerMethodFilter(event.target.value)}
            className="w-full rounded-lg border border-black/20 bg-white/70 px-2 py-2 text-xs"
          >
            <option value="all">All methods</option>
            {plannerMethods.map((method) => (
              <option key={`method-${method}`} value={method}>
                {method}
              </option>
            ))}
          </select>
        </label>
      </div>

      <input
        value={plannerQuery}
        onChange={(event) => setPlannerQuery(event.target.value)}
        placeholder="Search move..."
        className="w-full rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-xs"
      />

      {plannerData ? (
        <>
          <div className="rounded-lg border border-black/15 bg-white/70 p-2">
            <p className="pixel-font text-[9px] uppercase tracking-wide text-black/65">
              Quick Learning Plan
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {quickMovePlan.map((move) => (
                <button
                  key={`plan-${move.name}`}
                  type="button"
                  onClick={() => setPlannerQuery(move.name)}
                  className="rounded-md border border-black/20 bg-white px-2 py-1 text-[11px]"
                >
                  {move.name}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-64 overflow-auto">
            <EncyclopediaDataTable
              className="rounded-lg border-black/15 bg-white/60"
              rows={filteredPlannerMoves}
              rowKey={(move, index) => `planner-${move.name}-${move.levelLearnedAt ?? "na"}-${index}`}
              columns={[
                {
                  key: "move",
                  header: "Move",
                  render: (move) => move.name
                },
                {
                  key: "level",
                  header: "Lv.",
                  render: (move) => move.levelLearnedAt ?? "-"
                },
                {
                  key: "methods",
                  header: "Methods",
                  render: (move) => move.learnMethods.join(", ")
                }
              ]}
            />
          </div>

          <p className="text-xs text-black/55">
            Showing {filteredPlannerMoves.length} moves from {plannerData.movesCount} total.
          </p>
        </>
      ) : (
        <p className="text-xs text-black/60">Loading planner data...</p>
      )}
    </div>
  );
}

