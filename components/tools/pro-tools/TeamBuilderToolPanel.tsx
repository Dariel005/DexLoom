"use client";

import { useQueries } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import {
  ALL_TYPES,
  buildTeamTypeRows,
  formatOptionLabel,
  normalizeName
} from "@/lib/pokedex-pro-tools";
import { pokemonDetailQueryOptions } from "@/lib/pokemon-query-options";
import { cn } from "@/lib/utils";
import { useToolsWorkbenchStore } from "@/store/tools-workbench-store";
import { type PokemonListEntry } from "@/types/pokemon";
import { useShallow } from "zustand/react/shallow";

interface TeamBuilderToolPanelProps {
  candidatePokemon: PokemonListEntry[];
  selectedPokemonId: number | null;
  className?: string;
}

export function TeamBuilderToolPanel({
  candidatePokemon,
  selectedPokemonId,
  className
}: TeamBuilderToolPanelProps) {
  const {
    teamCandidateId,
    teamIds,
    setTeamCandidateId,
    addTeamMember,
    removeTeamMember,
    clearTeam
  } = useToolsWorkbenchStore(
    useShallow((state) => ({
      teamCandidateId: state.teamCandidateId,
      teamIds: state.teamIds,
      setTeamCandidateId: state.setTeamCandidateId,
      addTeamMember: state.addTeamMember,
      removeTeamMember: state.removeTeamMember,
      clearTeam: state.clearTeam
    }))
  );

  const options = useMemo(() => candidatePokemon.slice(0, 480), [candidatePokemon]);

  useEffect(() => {
    if (options.length === 0) {
      return;
    }

    if (teamCandidateId && options.some((entry) => entry.id === teamCandidateId)) {
      return;
    }

    setTeamCandidateId(options[0].id);
  }, [options, setTeamCandidateId, teamCandidateId]);

  const teamQueries = useQueries({
    queries: teamIds.map((id) => ({
      ...pokemonDetailQueryOptions(id),
      enabled: true
    }))
  });

  const teamDetails = useMemo(
    () => teamQueries.flatMap((query) => (query.data ? [query.data] : [])),
    [teamQueries]
  );

  const teamRows = useMemo(() => buildTeamTypeRows(teamDetails), [teamDetails]);

  const criticalTypes = useMemo(
    () =>
      teamRows
        .filter((row) => row.weak >= 2 && row.immune === 0 && row.resist === 0)
        .sort((a, b) => b.weak - a.weak || a.score - b.score)
        .slice(0, 6),
    [teamRows]
  );

  const sturdyTypes = useMemo(
    () =>
      teamRows
        .filter(
          (row) =>
            row.resist + row.immune >= Math.max(2, Math.ceil(teamDetails.length / 2))
        )
        .sort((a, b) => b.resist + b.immune - (a.resist + a.immune))
        .slice(0, 6),
    [teamDetails.length, teamRows]
  );

  const repeatedTypes = useMemo(() => {
    const map = new Map<string, number>();
    teamDetails.forEach((member) => {
      member.types.forEach((type) => {
        const key = normalizeName(type);
        map.set(key, (map.get(key) ?? 0) + 1);
      });
    });

    return Array.from(map.entries())
      .filter(([, count]) => count > 1)
      .map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count
      }))
      .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
  }, [teamDetails]);

  const synergyScore = useMemo(() => {
    if (teamDetails.length === 0) {
      return 0;
    }
    const positives = teamRows.filter((row) => row.score > 0).length;
    const severe = teamRows.filter((row) => row.weak >= 3 && row.immune === 0).length;
    const base = Math.round((positives / ALL_TYPES.length) * 100);
    return Math.max(0, Math.min(100, base - severe * 8));
  }, [teamDetails.length, teamRows]);

  const addCandidateMember = useCallback(() => {
    if (!teamCandidateId) {
      return;
    }
    addTeamMember(teamCandidateId);
  }, [addTeamMember, teamCandidateId]);

  const addSelectedMember = useCallback(() => {
    if (!selectedPokemonId) {
      return;
    }
    addTeamMember(selectedPokemonId);
  }, [addTeamMember, selectedPokemonId]);

  if (options.length === 0) {
    return (
      <div className={cn("rounded-xl border border-black/20 bg-white/72 p-3 text-sm text-black/74", className)}>
        Tool data is temporarily unavailable. Please refresh in a moment.
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        <label className="space-y-1">
          <span className="text-xs text-black/60">Add team member</span>
          <select
            value={teamCandidateId ?? ""}
            onChange={(event) => {
              const value = Number(event.target.value);
              setTeamCandidateId(Number.isFinite(value) ? value : null);
            }}
            className="w-full rounded-lg border border-black/20 bg-white/70 px-2 py-2 text-xs"
          >
            {options.map((entry) => (
              <option key={`team-${entry.id}`} value={entry.id}>
                {formatOptionLabel(entry)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={addCandidateMember}
          className="rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-xs"
        >
          Add
        </button>
        <button
          type="button"
          onClick={addSelectedMember}
          disabled={!selectedPokemonId}
          className="rounded-lg border border-black/20 bg-electric-yellow px-3 py-2 text-xs disabled:opacity-60"
        >
          Add selected
        </button>
        <button
          type="button"
          onClick={clearTeam}
          className="rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-xs"
        >
          Clear
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {teamIds.length > 0 ? (
          teamIds.map((id) => {
            const entry = options.find((option) => option.id === id);
            return (
              <button
                key={`team-chip-${id}`}
                type="button"
                onClick={() => removeTeamMember(id)}
                className="rounded-lg border border-black/20 bg-white/70 px-2 py-1 text-xs"
                title="Remove from team"
              >
                {entry ? entry.displayName : `#${id}`} x
              </button>
            );
          })
        ) : (
          <p className="text-xs text-black/60">No members yet. Add up to 6 Pokemon.</p>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <p className="rounded-lg border border-black/15 bg-white/70 px-3 py-2 text-xs">
          Team size: {teamDetails.length}/6
        </p>
        <p className="rounded-lg border border-black/15 bg-white/70 px-3 py-2 text-xs">
          Synergy score: {synergyScore}/100
        </p>
      </div>

      {teamDetails.length > 0 ? (
        <div className="space-y-2">
          <div className="rounded-lg border border-red-200 bg-red-50 p-2">
            <p className="pixel-font text-[9px] uppercase tracking-wide text-red-700">
              Main Defensive Risks
            </p>
            <p className="mt-1 text-xs text-red-700">
              {criticalTypes.length > 0
                ? criticalTypes.map((row) => `${row.type} (weak ${row.weak})`).join(", ")
                : "No critical defensive hole detected."}
            </p>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2">
            <p className="pixel-font text-[9px] uppercase tracking-wide text-emerald-700">
              Best Covered Attack Types
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              {sturdyTypes.length > 0
                ? sturdyTypes
                    .map((row) => `${row.type} (resist/immune ${row.resist + row.immune})`)
                    .join(", ")
                : "Build coverage not ready yet."}
            </p>
          </div>

          <div className="rounded-lg border border-black/15 bg-white/70 p-2">
            <p className="pixel-font text-[9px] uppercase tracking-wide text-black/65">
              Repeated Team Types
            </p>
            <p className="mt-1 text-xs text-black/65">
              {repeatedTypes.length > 0
                ? repeatedTypes.map((entry) => `${entry.type} x${entry.count}`).join(", ")
                : "No repeated type stack."}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

