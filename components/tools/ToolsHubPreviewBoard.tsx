"use client";

import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { TOOL_DEFINITIONS, type ToolDefinition } from "@/lib/tools-directory";
import { cn } from "@/lib/utils";
import { usePokedexStore } from "@/store/pokedex-store";
import { useSoundStore } from "@/store/sound-store";
import { useToolsWorkbenchStore } from "@/store/tools-workbench-store";
import { useShallow } from "zustand/react/shallow";

interface ToolsHubPreviewBoardProps {
  candidateCount: number;
}

function formatPokemonRef(id: number | null) {
  if (!id) {
    return "Not selected";
  }
  return `#${id.toString().padStart(4, "0")}`;
}

function toneClass(tool: ToolDefinition) {
  if (tool.tone === "emerald") {
    return "tools-card-tone-emerald";
  }
  if (tool.tone === "cyan") {
    return "tools-card-tone-cyan";
  }
  if (tool.tone === "amber") {
    return "tools-card-tone-amber";
  }
  if (tool.tone === "violet") {
    return "tools-card-tone-violet";
  }
  return "tools-card-tone-rose";
}

export function ToolsHubPreviewBoard({ candidateCount }: ToolsHubPreviewBoardProps) {
  const { selectedPokemonId, filters } = usePokedexStore(
    useShallow((state) => ({
      selectedPokemonId: state.selectedPokemonId,
      filters: state.filters
    }))
  );
  const {
    compareAId,
    compareBId,
    compareFocus,
    teamIds,
    plannerPokemonId,
    plannerQuery,
    plannerMethodFilter
  } = useToolsWorkbenchStore(
    useShallow((state) => ({
      compareAId: state.compareAId,
      compareBId: state.compareBId,
      compareFocus: state.compareFocus,
      teamIds: state.teamIds,
      plannerPokemonId: state.plannerPokemonId,
      plannerQuery: state.plannerQuery,
      plannerMethodFilter: state.plannerMethodFilter
    }))
  );
  const soundEnabled = useSoundStore((state) => state.enabled);
  const soundVolume = useSoundStore((state) => state.volume);

  return (
    <section className="tools-preview-board rounded-2xl border border-black/20 bg-white/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/72">
          Tools Mission Board
        </p>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-md border border-black/20 bg-white/72 px-2 py-1 text-xs text-black/72">
            {candidateCount} indexed options
          </span>
          <span className="rounded-md border border-black/20 bg-white/72 px-2 py-1 text-xs text-black/72">
            Active selected: {formatPokemonRef(selectedPokemonId)}
          </span>
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        {TOOL_DEFINITIONS.map((tool) => (
          <article
            key={tool.slug}
            className={cn(
              "tools-preview-card rounded-xl border border-black/20 p-3",
              toneClass(tool)
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-black/62">
                  {tool.navLabel}
                </p>
                <h2 className="pixel-font mt-1 text-[11px] uppercase tracking-[0.12em] text-black/84">
                  {tool.title}
                </h2>
              </div>
              <RouteTransitionLink
                href={tool.href}
                className="tools-open-link rounded-md border border-black/25 bg-white/78 px-2.5 py-1 text-xs text-black/78"
              >
                Open
              </RouteTransitionLink>
            </div>

            <p className="mt-2 text-xs text-black/74">{tool.objective}</p>

            <div className="mt-2 space-y-1.5 text-xs text-black/72">
              {tool.slug === "filters" ? (
                <>
                  <p>Query: {filters.query.trim() || "none"}</p>
                  <p>Dex ID: {filters.id.trim() || "none"}</p>
                  <p>
                    Type: {filters.type} | Gen: {filters.generation} | Min ATK:{" "}
                    {filters.minAttack || "none"}
                  </p>
                </>
              ) : null}

              {tool.slug === "comparator" ? (
                <>
                  <p>A: {formatPokemonRef(compareAId)}</p>
                  <p>B: {formatPokemonRef(compareBId)}</p>
                  <p>Focus: {compareFocus}</p>
                </>
              ) : null}

              {tool.slug === "team-builder" ? (
                <>
                  <p>Team slots used: {teamIds.length}/6</p>
                  <p>
                    Members:{" "}
                    {teamIds.length > 0
                      ? teamIds
                          .slice(0, 4)
                          .map((id) => formatPokemonRef(id))
                          .join(", ")
                      : "none"}
                  </p>
                </>
              ) : null}

              {tool.slug === "move-planner" ? (
                <>
                  <p>Pokemon: {formatPokemonRef(plannerPokemonId)}</p>
                  <p>Method: {plannerMethodFilter}</p>
                  <p>Query: {plannerQuery.trim() || "none"}</p>
                </>
              ) : null}

              {tool.slug === "audio" ? (
                <>
                  <p>Sound: {soundEnabled ? "enabled" : "disabled"}</p>
                  <p>Volume: {Math.round(soundVolume * 100)}%</p>
                </>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

