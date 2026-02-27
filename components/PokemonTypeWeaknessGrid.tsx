import { TypeBadge } from "@/components/TypeBadge";
import { type PokemonTypeEffectiveness } from "@/types/pokemon";

const TYPE_ORDER = [
  "Normal",
  "Fire",
  "Water",
  "Electric",
  "Grass",
  "Ice",
  "Fighting",
  "Poison",
  "Ground",
  "Flying",
  "Psychic",
  "Bug",
  "Rock",
  "Ghost",
  "Dragon",
  "Dark",
  "Steel",
  "Fairy"
] as const;

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function buildMultiplierMap(effectiveness: PokemonTypeEffectiveness) {
  const map = new Map<string, number>();
  TYPE_ORDER.forEach((type) => map.set(normalize(type), 1));

  effectiveness.fourTimesWeak.forEach((type) => map.set(normalize(type), 4));
  effectiveness.doubleWeak.forEach((type) => map.set(normalize(type), 2));
  effectiveness.halfResistant.forEach((type) => map.set(normalize(type), 0.5));
  effectiveness.quarterResistant.forEach((type) => map.set(normalize(type), 0.25));
  effectiveness.immune.forEach((type) => map.set(normalize(type), 0));

  return map;
}

function getMultiplierTone(value: number) {
  if (value >= 4) {
    return "border-red-300 bg-red-50 text-red-700";
  }
  if (value >= 2) {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }
  if (value === 1) {
    return "border-zinc-300 bg-zinc-50 text-zinc-700";
  }
  if (value === 0) {
    return "border-cyan-300 bg-cyan-50 text-cyan-700";
  }
  return "border-emerald-300 bg-emerald-50 text-emerald-700";
}

export function PokemonTypeWeaknessGrid({
  effectiveness
}: {
  effectiveness: PokemonTypeEffectiveness;
}) {
  const multipliers = buildMultiplierMap(effectiveness);

  return (
    <div className="space-y-2">
      <p className="text-sm text-black/70">
        Auto-calculated matchup chart for incoming type damage.
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {TYPE_ORDER.map((type) => {
          const multiplier = multipliers.get(normalize(type)) ?? 1;
          return (
            <div
              key={type}
              className={`rounded-lg border px-2.5 py-2 ${getMultiplierTone(multiplier)}`}
            >
              <div className="flex items-center justify-between gap-2">
                <TypeBadge type={type} className="h-6 px-2.5 text-[8px]" />
                <span className="pixel-font text-[10px] uppercase tracking-[0.12em]">
                  x{multiplier}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



