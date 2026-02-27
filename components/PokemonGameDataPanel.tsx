"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GENERATION_FILTER_OPTIONS,
  type GenerationFilterKey,
  inferGenerationFromVersionLabel,
  toGenerationFilterKey
} from "@/lib/game-generation";
import { cn } from "@/lib/utils";
import {
  type PokemonDetailStat,
  type PokemonGameIndexInfo,
  type PokemonMoveInfo
} from "@/types/pokemon";

const MOVE_PAGE_SIZE = 18;
const INDEX_PAGE_SIZE = 16;

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function toGenerationNumber(filter: GenerationFilterKey) {
  if (filter === "all") {
    return null;
  }
  return Number.parseInt(filter.replace("gen", ""), 10);
}

function getStatTier(value: number) {
  if (value >= 130) {
    return "S";
  }
  if (value >= 100) {
    return "A";
  }
  if (value >= 70) {
    return "B";
  }
  if (value >= 45) {
    return "C";
  }
  return "D";
}

function PaginationControls({
  page,
  totalPages,
  onPrev,
  onNext
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={onPrev}
        disabled={page <= 1}
        className="rounded-lg border border-black/20 bg-white/75 px-2.5 py-1 text-xs text-black/70 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-xs text-black/65">
        Page {page} / {Math.max(totalPages, 1)}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className="rounded-lg border border-black/20 bg-white/75 px-2.5 py-1 text-xs text-black/70 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

interface PokemonGameDataPanelProps {
  defaultGenerationKey: string;
  stats: PokemonDetailStat[];
  moves: PokemonMoveInfo[];
  movesCount: number;
  gameIndices: PokemonGameIndexInfo[];
}

export function PokemonGameDataPanel({
  defaultGenerationKey,
  stats,
  moves,
  movesCount,
  gameIndices
}: PokemonGameDataPanelProps) {
  const [generationFilter, setGenerationFilter] = useState<GenerationFilterKey>(() => {
    const parsed = Number.parseInt(defaultGenerationKey.replace("gen", ""), 10);
    return toGenerationFilterKey(Number.isNaN(parsed) ? null : parsed);
  });
  const [versionFilter, setVersionFilter] = useState("all");
  const [movePage, setMovePage] = useState(1);
  const [indexPage, setIndexPage] = useState(1);

  const allVersionGroups = useMemo(
    () =>
      Array.from(new Set(moves.flatMap((move) => move.versionGroups)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [moves]
  );

  const filteredVersionGroups = useMemo(() => {
    const selectedGeneration = toGenerationNumber(generationFilter);
    if (!selectedGeneration) {
      return allVersionGroups;
    }
    return allVersionGroups.filter(
      (versionGroup) => inferGenerationFromVersionLabel(versionGroup) === selectedGeneration
    );
  }, [allVersionGroups, generationFilter]);

  useEffect(() => {
    if (versionFilter === "all") {
      return;
    }
    if (!filteredVersionGroups.includes(versionFilter)) {
      setVersionFilter("all");
    }
  }, [filteredVersionGroups, versionFilter]);

  const filteredMoves = useMemo(() => {
    const selectedGeneration = toGenerationNumber(generationFilter);
    return moves.filter((move) => {
      const matchesGeneration =
        selectedGeneration === null ||
        move.versionGroups.some(
          (versionGroup) => inferGenerationFromVersionLabel(versionGroup) === selectedGeneration
        );
      const matchesVersion =
        versionFilter === "all" ||
        move.versionGroups.some((versionGroup) => normalize(versionGroup) === normalize(versionFilter));
      return matchesGeneration && matchesVersion;
    });
  }, [generationFilter, moves, versionFilter]);

  const filteredGameIndices = useMemo(() => {
    const selectedGeneration = toGenerationNumber(generationFilter);
    if (selectedGeneration === null) {
      return gameIndices;
    }
    return gameIndices.filter(
      (entry) => inferGenerationFromVersionLabel(entry.version) === selectedGeneration
    );
  }, [gameIndices, generationFilter]);

  useEffect(() => {
    setMovePage(1);
  }, [generationFilter, versionFilter]);

  useEffect(() => {
    setIndexPage(1);
  }, [generationFilter]);

  const totalMovePages = Math.max(1, Math.ceil(filteredMoves.length / MOVE_PAGE_SIZE));
  const pagedMoves = filteredMoves.slice(
    (movePage - 1) * MOVE_PAGE_SIZE,
    movePage * MOVE_PAGE_SIZE
  );

  const totalIndexPages = Math.max(1, Math.ceil(filteredGameIndices.length / INDEX_PAGE_SIZE));
  const pagedGameIndices = filteredGameIndices.slice(
    (indexPage - 1) * INDEX_PAGE_SIZE,
    indexPage * INDEX_PAGE_SIZE
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="space-y-1">
          <span className="text-xs text-black/65">Generation filter</span>
          <select
            value={generationFilter}
            onChange={(event) => setGenerationFilter(event.target.value as GenerationFilterKey)}
            className="w-full rounded-lg border border-black/20 bg-white/75 px-2.5 py-2 text-sm text-black/80"
          >
            {GENERATION_FILTER_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs text-black/65">Game/version group</span>
          <select
            value={versionFilter}
            onChange={(event) => setVersionFilter(event.target.value)}
            className="w-full rounded-lg border border-black/20 bg-white/75 px-2.5 py-2 text-sm text-black/80"
          >
            <option value="all">All version groups</option>
            {filteredVersionGroups.map((versionGroup) => (
              <option key={versionGroup} value={versionGroup}>
                {versionGroup}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-xs text-black/70">
          Showing {filteredMoves.length} / {movesCount} moves
        </div>
      </div>

      <section className="space-y-2 rounded-xl border border-black/20 bg-white/45 p-3">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Base Stats (Battle Table)
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="flex items-center justify-between rounded-lg border border-black/15 bg-white/70 px-3 py-2 text-sm text-black/80"
            >
              <span className="pixel-font text-[10px] uppercase tracking-[0.14em]">
                {stat.name}
              </span>
              <span className="font-semibold">
                {stat.baseStat}
                <span className="ml-2 rounded border border-black/20 bg-black/5 px-1 py-0.5 text-[10px]">
                  {getStatTier(stat.baseStat)}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2 rounded-xl border border-black/20 bg-white/45 p-3">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Moves by Generation/Game
        </p>

        <div className="space-y-2 md:hidden">
          {pagedMoves.length > 0 ? (
            pagedMoves.map((move) => (
              <article
                key={`${move.name}-${move.levelLearnedAt ?? "na"}`}
                className="rounded-lg border border-black/15 bg-white/75 p-3"
              >
                <p className="text-sm font-semibold text-black/85">{move.name}</p>
                <p className="mt-1 text-xs text-black/70">
                  Lv: {move.levelLearnedAt ?? "-"}
                </p>
                <p className="mt-1 text-xs text-black/70">
                  Method: {move.learnMethods.join(", ")}
                </p>
                <p className="mt-1 text-xs text-black/65">
                  Versions: {move.versionGroups.slice(0, 4).join(", ")}
                  {move.versionGroups.length > 4 ? "..." : ""}
                </p>
              </article>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-black/25 bg-white/65 px-3 py-2 text-sm text-black/65">
              No moves match this generation/game filter.
            </p>
          )}
        </div>

        <div className="hidden md:block">
          <table className="w-full table-fixed text-left text-sm text-black/80">
            <thead className="border-b border-black/15 text-black/70">
              <tr>
                <th className="px-2 py-2">Move</th>
                <th className="w-20 px-2 py-2">Lv.</th>
                <th className="w-44 px-2 py-2">Method</th>
                <th className="px-2 py-2">Version Groups</th>
              </tr>
            </thead>
            <tbody>
              {pagedMoves.length > 0 ? (
                pagedMoves.map((move) => (
                  <tr key={`${move.name}-${move.levelLearnedAt ?? "na"}`} className="border-t border-black/10">
                    <td className="px-2 py-2 font-semibold">{move.name}</td>
                    <td className="px-2 py-2">{move.levelLearnedAt ?? "-"}</td>
                    <td className="px-2 py-2 break-words">{move.learnMethods.join(", ")}</td>
                    <td className="px-2 py-2 break-words">
                      {move.versionGroups.slice(0, 4).join(", ")}
                      {move.versionGroups.length > 4 ? "..." : ""}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-2 py-3 text-sm text-black/65">
                    No moves match this generation/game filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          page={movePage}
          totalPages={totalMovePages}
          onPrev={() => setMovePage((current) => Math.max(1, current - 1))}
          onNext={() =>
            setMovePage((current) => Math.min(totalMovePages, current + 1))
          }
        />
      </section>

      <section className="space-y-2 rounded-xl border border-black/20 bg-white/45 p-3">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Game Indexes by Generation
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          {pagedGameIndices.length > 0 ? (
            pagedGameIndices.map((entry) => (
              <div
                key={`${entry.version}-${entry.gameIndex}`}
                className={cn("rounded-lg border border-black/15 bg-white/75 px-3 py-2 text-sm text-black/80")}
              >
                <p className="font-semibold">{entry.version}</p>
                <p className="mt-0.5 text-xs text-black/65">
                  Index #{entry.gameIndex}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-black/25 bg-white/65 px-3 py-2 text-sm text-black/65 sm:col-span-2">
              No game index records for this generation filter.
            </p>
          )}
        </div>
        <PaginationControls
          page={indexPage}
          totalPages={totalIndexPages}
          onPrev={() => setIndexPage((current) => Math.max(1, current - 1))}
          onNext={() =>
            setIndexPage((current) => Math.min(totalIndexPages, current + 1))
          }
        />
      </section>
    </div>
  );
}



