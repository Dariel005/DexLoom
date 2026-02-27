"use client";

import { m } from "framer-motion";
import { type PokemonStat } from "@/types/pokemon";

interface StatChartProps {
  stats: PokemonStat[];
}

function getBattleStatColor(value: number) {
  if (value >= 130) {
    return "#16a34a";
  }
  if (value >= 100) {
    return "#65a30d";
  }
  if (value >= 70) {
    return "#eab308";
  }
  if (value >= 45) {
    return "#f97316";
  }
  return "#ef4444";
}

function getBattleTier(value: number) {
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

export function StatChart({ stats }: StatChartProps) {
  return (
    <div className="space-y-2.5">
      {stats.map((stat, index) => {
        const progress = Math.min((stat.baseStat / 255) * 100, 100);
        const color = getBattleStatColor(stat.baseStat);
        const tier = getBattleTier(stat.baseStat);
        return (
          <div key={stat.name}>
            <div className="mb-1 flex items-center justify-between text-[11px] text-black/65">
              <span className="pixel-font text-[9px] uppercase tracking-wide">{stat.name}</span>
              <div className="flex items-center gap-1.5">
                <span>{stat.baseStat}</span>
                <span className="pixel-font rounded border border-black/15 bg-white/65 px-1 py-0.5 text-[8px] uppercase leading-none">
                  {tier}
                </span>
              </div>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full border border-black/15 bg-black/10">
              <m.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}77`
                }}
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.45, delay: index * 0.04, ease: "easeOut" }}
              />
              <div className="pointer-events-none absolute inset-0 rounded-full [background:repeating-linear-gradient(to_right,rgba(255,255,255,0.28)_0,rgba(255,255,255,0.28)_1px,transparent_1px,transparent_12px)]" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
