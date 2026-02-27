"use client";

import Image from "next/image";
import Link from "next/link";
import { m } from "framer-motion";
import { formatLabel } from "@/lib/utils";
import { type EvolutionStage } from "@/types/pokemon";

interface EvolutionChainProps {
  stages: EvolutionStage[];
}

function getDefaultSpriteUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function getConditionTags(stage: EvolutionStage) {
  const tags: string[] = [];

  if (stage.trigger) {
    tags.push(`Trigger: ${formatLabel(stage.trigger)}`);
  }
  if (stage.minLevel) {
    tags.push(`Level ${stage.minLevel}+`);
  }
  if (stage.item) {
    tags.push(`Use ${formatLabel(stage.item)}`);
  }
  if (stage.heldItem) {
    tags.push(`Hold ${formatLabel(stage.heldItem)}`);
  }
  if (stage.minHappiness) {
    tags.push(`Friendship ${stage.minHappiness}+`);
  }

  return tags;
}

function getPrimaryCondition(stage: EvolutionStage) {
  if (stage.minLevel) {
    return `Level ${stage.minLevel}`;
  }
  if (stage.item) {
    return `Use ${formatLabel(stage.item)}`;
  }
  if (stage.minHappiness) {
    return `Friendship ${stage.minHappiness}+`;
  }
  if (stage.heldItem) {
    return `Hold ${formatLabel(stage.heldItem)}`;
  }
  if (stage.trigger) {
    return formatLabel(stage.trigger);
  }
  return "Special condition";
}

function getStageLabel(index: number, total: number) {
  if (index === 0) {
    return "Base Form";
  }
  if (index === total - 1) {
    return "Final Form";
  }
  return `Stage ${index + 1}`;
}

export function EvolutionChain({ stages }: EvolutionChainProps) {
  if (stages.length === 0) {
    return (
      <div className="rounded-xl border border-black/20 bg-white/55 p-4">
        <p className="text-sm text-black/70">Evolution data is currently unavailable.</p>
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {stages.map((stage, index) => {
        const conditionTags = getConditionTags(stage);
        const stageLabel = getStageLabel(index, stages.length);
        const nextStage = stages[index + 1] ?? null;
        const nextCondition = nextStage ? getPrimaryCondition(nextStage) : null;

        return (
          <li key={`${stage.id}-${index}`} className="space-y-2">
            <m.article
              className="relative overflow-hidden rounded-2xl border border-black/20 bg-white/70 p-3"
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, delay: index * 0.06 }}
            >
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-pokedex-red/50 to-black/20" />

              <div className="grid gap-3 sm:grid-cols-[76px_1fr_auto] sm:items-center">
                <Link
                  href={`/pokemon/${stage.id}`}
                  className="group grid grid-cols-[76px_1fr] items-center gap-3 rounded-xl border border-transparent px-1 py-1 transition hover:border-pokedex-red/35 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pokedex-red/35 sm:col-span-2"
                >
                  <div className="relative h-16 w-16 justify-self-start rounded-xl border border-black/15 bg-white/75 p-1">
                    <Image
                      src={stage.sprite ?? getDefaultSpriteUrl(stage.id)}
                      alt={stage.name}
                      fill
                      loading="lazy"
                      sizes="64px"
                      className="object-contain"
                    />
                  </div>

                  <div>
                    <p className="pixel-font text-[10px] uppercase tracking-wide text-black/65">
                      #{stage.id.toString().padStart(4, "0")}
                    </p>
                    <p className="pixel-font mt-1 text-[12px] uppercase tracking-wide text-black/85 transition group-hover:text-pokedex-red">
                      {stage.name}
                    </p>
                    <p className="mt-1 text-[11px] text-black/55 group-hover:text-black/70">
                      Open full info
                    </p>
                  </div>
                </Link>

                <span className="pixel-font inline-flex h-fit rounded-full border border-black/20 bg-black/5 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-black/70">
                  {stageLabel}
                </span>
              </div>

              {index > 0 ? (
                <div className="mt-3 rounded-xl border border-black/15 bg-white/75 p-2.5">
                  <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65">
                    How to evolve
                  </p>
                  {conditionTags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {conditionTags.map((tag) => (
                        <span
                          key={`${stage.id}-${tag}`}
                          className="rounded-md border border-black/20 bg-black/5 px-2 py-1 text-[11px] text-black/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-black/65">
                      No detailed condition data available.
                    </p>
                  )}
                </div>
              ) : null}
            </m.article>

            {nextStage ? (
              <m.div
                className="flex items-center justify-center gap-2 py-1"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 + 0.05 }}
              >
                <span className="h-px w-8 bg-black/20" />
                <Link
                  href={`/pokemon/${nextStage.id}`}
                  className="rounded-full border border-black/20 bg-white/75 px-3 py-1 text-xs text-black/70 transition hover:border-pokedex-red/45 hover:bg-pokedex-red/10 hover:text-pokedex-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pokedex-red/35"
                >
                  Next form: {nextStage.name} ({nextCondition})
                </Link>
                <span className="h-px w-8 bg-black/20" />
              </m.div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

