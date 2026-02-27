import { type PokemonStat } from "@/types/pokemon";

interface PokemonStatBarsProps {
  stats: PokemonStat[];
}

function getStatColor(value: number) {
  if (value >= 120) {
    return "bg-emerald-500";
  }
  if (value >= 90) {
    return "bg-electric-yellow";
  }
  if (value >= 60) {
    return "bg-orange-400";
  }
  return "bg-red-400";
}

export function PokemonStatBars({ stats }: PokemonStatBarsProps) {
  return (
    <ul className="space-y-2">
      {stats.map((stat) => {
        const normalized = Math.min((stat.baseStat / 180) * 100, 100);
        return (
          <li key={stat.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-black/70">
              <span className="pixel-font text-[9px] uppercase tracking-wide">{stat.name}</span>
              <span>{stat.baseStat}</span>
            </div>
            <div className="h-2 rounded-full bg-black/10">
              <div
                className={`h-full rounded-full ${getStatColor(stat.baseStat)}`}
                style={{ width: `${normalized}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

