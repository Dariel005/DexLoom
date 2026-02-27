"use client";

import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePokedexStore } from "@/store/pokedex-store";
import { type PokemonGenerationFilter } from "@/types/pokemon";
import { useShallow } from "zustand/react/shallow";

interface FilterOption<T extends string = string> {
  value: T;
  label: string;
}

interface PokemonSearchFiltersProps {
  availableTypes: FilterOption[];
  availableGenerations: FilterOption<PokemonGenerationFilter>[];
}

export function PokemonSearchFilters({
  availableTypes,
  availableGenerations
}: PokemonSearchFiltersProps) {
  const { filters, setFilter, resetFilters } = usePokedexStore(
    useShallow((state) => ({
      filters: state.filters,
      setFilter: state.setFilter,
      resetFilters: state.resetFilters
    }))
  );

  const minAttack = useMemo(
    () => (typeof filters.minAttack === "number" ? filters.minAttack : 0),
    [filters.minAttack]
  );
  const [queryInput, setQueryInput] = useState(filters.query);
  const [idInput, setIdInput] = useState(filters.id);
  const debouncedQueryInput = useDebouncedValue(queryInput, 170);
  const debouncedIdInput = useDebouncedValue(idInput, 170);

  useEffect(() => {
    setQueryInput(filters.query);
  }, [filters.query]);

  useEffect(() => {
    setIdInput(filters.id);
  }, [filters.id]);

  useEffect(() => {
    if (debouncedQueryInput === filters.query) {
      return;
    }
    setFilter("query", debouncedQueryInput);
  }, [debouncedQueryInput, filters.query, setFilter]);

  useEffect(() => {
    const sanitizedId = debouncedIdInput.replace(/[^\d]/g, "");
    if (sanitizedId === filters.id) {
      return;
    }
    setFilter("id", sanitizedId);
  }, [debouncedIdInput, filters.id, setFilter]);

  return (
    <section className="space-y-4 rounded-2xl border border-black/25 bg-black/10 p-4">
      <div className="pixel-font text-[10px] uppercase tracking-wider text-black/70">
        Advanced Search
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="pixel-font text-[9px] uppercase tracking-wide text-black/70">
            Name
          </span>
          <input
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="charizard"
            className="search-theme-control w-full rounded-xl border border-black/25 bg-white/65 px-3 py-2 text-sm outline-none"
          />
        </label>

        <label className="space-y-1.5">
          <span className="pixel-font text-[9px] uppercase tracking-wide text-black/70">
            National ID
          </span>
          <input
            value={idInput}
            onChange={(event) => setIdInput(event.target.value.replace(/[^\d]/g, ""))}
            placeholder="006"
            className="search-theme-control w-full rounded-xl border border-black/25 bg-white/65 px-3 py-2 text-sm outline-none"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="pixel-font text-[9px] uppercase tracking-wide text-black/70">
            Type
          </span>
          <select
            value={filters.type}
            onChange={(event) => setFilter("type", event.target.value)}
            className="search-theme-control w-full rounded-xl border border-black/25 bg-white/65 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All Types</option>
            {availableTypes.map((typeOption) => (
              <option key={typeOption.value} value={typeOption.value}>
                {typeOption.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="pixel-font text-[9px] uppercase tracking-wide text-black/70">
            Generation
          </span>
          <select
            value={filters.generation}
            onChange={(event) =>
              setFilter("generation", event.target.value as PokemonGenerationFilter)
            }
            className="search-theme-control w-full rounded-xl border border-black/25 bg-white/65 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All Generations</option>
            {availableGenerations.map((generationOption) => (
              <option key={generationOption.value} value={generationOption.value}>
                {generationOption.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="pixel-font text-[9px] uppercase tracking-wide text-black/70">
          Base Attack {minAttack > 0 ? `(>= ${minAttack})` : "(any)"}
        </span>
        <input
          type="range"
          min={0}
          max={180}
          step={5}
          value={minAttack}
          onChange={(event) => {
            const value = Number(event.target.value);
            setFilter("minAttack", value === 0 ? "" : value);
          }}
          className="search-theme-range w-full"
        />
      </label>

      <button
        type="button"
        className="search-theme-reset-btn pixel-font rounded-xl border px-3 py-2 text-[10px] uppercase tracking-wide transition hover:brightness-95"
        onClick={() => {
          resetFilters();
          setQueryInput("");
          setIdInput("");
        }}
      >
        Reset filters
      </button>
    </section>
  );
}

