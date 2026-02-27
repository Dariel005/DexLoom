"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { TypeBadge } from "@/components/TypeBadge";
import {
  getFocusScore,
  getStat,
  inferRole,
  type CompareFocus,
  formatOptionLabel
} from "@/lib/pokedex-pro-tools";
import { pokemonDetailQueryOptions } from "@/lib/pokemon-query-options";
import { cn } from "@/lib/utils";
import { useToolsWorkbenchStore } from "@/store/tools-workbench-store";
import { type PokemonListEntry } from "@/types/pokemon";
import { useShallow } from "zustand/react/shallow";

interface ComparatorToolPanelProps {
  candidatePokemon: PokemonListEntry[];
  selectedPokemonId: number | null;
  onSelectPokemon: (pokemonId: number) => void;
  className?: string;
}

function CompareRow({
  label,
  valueA,
  valueB,
  isNumeric = false
}: {
  label: string;
  valueA: string | number;
  valueB: string | number;
  isNumeric?: boolean;
}) {
  const numericA = isNumeric ? Number(valueA) : NaN;
  const numericB = isNumeric ? Number(valueB) : NaN;
  const aWins = isNumeric && numericA > numericB;
  const bWins = isNumeric && numericB > numericA;

  return (
    <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-[120px_1fr_1fr]">
      <p className="pixel-font text-[9px] uppercase tracking-wide text-black/65">
        {label}
      </p>
      <p
        className={cn(
          "rounded-lg border border-black/15 bg-white/70 px-2 py-1",
          aWins && "border-emerald-300 bg-emerald-50 text-emerald-700"
        )}
      >
        {valueA}
      </p>
      <p
        className={cn(
          "rounded-lg border border-black/15 bg-white/70 px-2 py-1",
          bWins && "border-emerald-300 bg-emerald-50 text-emerald-700"
        )}
      >
        {valueB}
      </p>
    </div>
  );
}

export function ComparatorToolPanel({
  candidatePokemon,
  selectedPokemonId,
  onSelectPokemon,
  className
}: ComparatorToolPanelProps) {
  const { compareAId, compareBId, compareFocus, setCompareAId, setCompareBId, setCompareFocus } =
    useToolsWorkbenchStore(
      useShallow((state) => ({
        compareAId: state.compareAId,
        compareBId: state.compareBId,
        compareFocus: state.compareFocus,
        setCompareAId: state.setCompareAId,
        setCompareBId: state.setCompareBId,
        setCompareFocus: state.setCompareFocus
      }))
    );

  const options = useMemo(() => candidatePokemon.slice(0, 480), [candidatePokemon]);

  useEffect(() => {
    if (options.length === 0) {
      return;
    }

    if (compareAId && options.some((entry) => entry.id === compareAId)) {
      return;
    }

    if (selectedPokemonId && options.some((entry) => entry.id === selectedPokemonId)) {
      setCompareAId(selectedPokemonId);
      return;
    }

    setCompareAId(options[0].id);
  }, [compareAId, options, selectedPokemonId, setCompareAId]);

  useEffect(() => {
    if (options.length === 0) {
      return;
    }

    const fallback = options.find((entry) => entry.id !== compareAId)?.id ?? options[0].id;
    if (!compareBId || compareBId === compareAId || !options.some((entry) => entry.id === compareBId)) {
      setCompareBId(fallback);
    }
  }, [compareAId, compareBId, options, setCompareBId]);

  const compareQueries = useQueries({
    queries: [compareAId, compareBId].map((id) => ({
      ...pokemonDetailQueryOptions(id ?? ""),
      enabled: Boolean(id)
    }))
  });
  const compareAData = compareQueries[0]?.data ?? null;
  const compareBData = compareQueries[1]?.data ?? null;

  const compareWinner = useMemo(() => {
    if (!compareAData || !compareBData) {
      return null;
    }
    const scoreA = getFocusScore(compareAData, compareFocus);
    const scoreB = getFocusScore(compareBData, compareFocus);

    if (Math.abs(scoreA - scoreB) < 0.1) {
      return "Tie";
    }
    return scoreA > scoreB ? compareAData.name : compareBData.name;
  }, [compareAData, compareBData, compareFocus]);

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
          <span className="text-xs text-black/60">Pokemon A</span>
          <select
            value={compareAId ?? ""}
            onChange={(event) => {
              const value = Number(event.target.value);
              setCompareAId(Number.isFinite(value) ? value : null);
            }}
            className="w-full rounded-lg border border-black/20 bg-white/70 px-2 py-2 text-xs"
          >
            {options.map((entry) => (
              <option key={`a-${entry.id}`} value={entry.id}>
                {formatOptionLabel(entry)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-black/60">Pokemon B</span>
          <select
            value={compareBId ?? ""}
            onChange={(event) => {
              const value = Number(event.target.value);
              setCompareBId(Number.isFinite(value) ? value : null);
            }}
            className="w-full rounded-lg border border-black/20 bg-white/70 px-2 py-2 text-xs"
          >
            {options.map((entry) => (
              <option key={`b-${entry.id}`} value={entry.id}>
                {formatOptionLabel(entry)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-black/60">Comparison Focus</label>
        <select
          value={compareFocus}
          onChange={(event) => setCompareFocus(event.target.value as CompareFocus)}
          className="rounded-lg border border-black/20 bg-white/70 px-2 py-1.5 text-xs"
        >
          <option value="general">General (BST)</option>
          <option value="offense">Offense</option>
          <option value="defense">Defense</option>
          <option value="speed">Speed Control</option>
        </select>
      </div>

      {compareAData && compareBData ? (
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-[120px_1fr_1fr]">
            <p />
            <button
              type="button"
              onClick={() => onSelectPokemon(compareAData.id)}
              className="rounded-lg border border-black/15 bg-white/70 px-2 py-1 text-left"
            >
              {compareAData.name}
            </button>
            <button
              type="button"
              onClick={() => onSelectPokemon(compareBData.id)}
              className="rounded-lg border border-black/15 bg-white/70 px-2 py-1 text-left"
            >
              {compareBData.name}
            </button>
          </div>

          <CompareRow label="Role" valueA={inferRole(compareAData)} valueB={inferRole(compareBData)} />
          <CompareRow
            label="BST"
            valueA={compareAData.baseStatTotal}
            valueB={compareBData.baseStatTotal}
            isNumeric
          />
          <CompareRow
            label="HP"
            valueA={getStat(compareAData, "hp")}
            valueB={getStat(compareBData, "hp")}
            isNumeric
          />
          <CompareRow
            label="Attack"
            valueA={getStat(compareAData, "attack")}
            valueB={getStat(compareBData, "attack")}
            isNumeric
          />
          <CompareRow
            label="Defense"
            valueA={getStat(compareAData, "defense")}
            valueB={getStat(compareBData, "defense")}
            isNumeric
          />
          <CompareRow
            label="Sp. Atk"
            valueA={getStat(compareAData, "special attack")}
            valueB={getStat(compareBData, "special attack")}
            isNumeric
          />
          <CompareRow
            label="Sp. Def"
            valueA={getStat(compareAData, "special defense")}
            valueB={getStat(compareBData, "special defense")}
            isNumeric
          />
          <CompareRow
            label="Speed"
            valueA={getStat(compareAData, "speed")}
            valueB={getStat(compareBData, "speed")}
            isNumeric
          />

          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-[120px_1fr_1fr]">
            <p className="pixel-font text-[9px] uppercase tracking-wide text-black/65">
              Types
            </p>
            <div className="flex flex-wrap gap-1">
              {compareAData.types.map((type) => (
                <TypeBadge key={`a-type-${type}`} type={type} />
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {compareBData.types.map((type) => (
                <TypeBadge key={`b-type-${type}`} type={type} />
              ))}
            </div>
          </div>

          <p className="rounded-lg border border-black/15 bg-white/70 px-2 py-1 text-xs">
            Suggested winner ({compareFocus}):{" "}
            <span className="font-semibold">{compareWinner ?? "Calculating..."}</span>
          </p>
        </div>
      ) : (
        <p className="text-xs text-black/60">Loading comparison data...</p>
      )}
    </div>
  );
}

