import { type PokemonDetail, type PokemonListEntry, type PokemonMoveInfo } from "@/types/pokemon";

export const ALL_TYPES = [
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

export type CompareFocus = "general" | "offense" | "defense" | "speed";

export interface TeamTypeRow {
  type: string;
  weak: number;
  resist: number;
  immune: number;
  score: number;
}

export function normalizeName(value: string) {
  return value.toLowerCase().trim();
}

export function formatOptionLabel(entry: PokemonListEntry) {
  return `#${entry.id.toString().padStart(4, "0")} ${entry.displayName}`;
}

export function getStat(detail: PokemonDetail, statName: string) {
  const normalizedStatName = normalizeName(statName);
  return (
    detail.stats.find((stat) => normalizeName(stat.name) === normalizedStatName)?.baseStat ?? 0
  );
}

export function inferRole(detail: PokemonDetail) {
  const hp = getStat(detail, "hp");
  const attack = getStat(detail, "attack");
  const spAttack = getStat(detail, "special attack");
  const defense = getStat(detail, "defense");
  const spDefense = getStat(detail, "special defense");
  const speed = getStat(detail, "speed");

  const offense = attack + spAttack + speed;
  const defenseTotal = hp + defense + spDefense;

  if (speed >= 115 && offense >= defenseTotal) {
    return "Fast Sweeper";
  }
  if (defenseTotal >= offense + 40) {
    return "Tank / Wall";
  }
  if (spAttack >= attack + 20) {
    return "Special Attacker";
  }
  if (attack >= spAttack + 20) {
    return "Physical Attacker";
  }
  return "Balanced";
}

export function getFocusScore(detail: PokemonDetail, focus: CompareFocus) {
  const hp = getStat(detail, "hp");
  const attack = getStat(detail, "attack");
  const spAttack = getStat(detail, "special attack");
  const defense = getStat(detail, "defense");
  const spDefense = getStat(detail, "special defense");
  const speed = getStat(detail, "speed");

  if (focus === "offense") {
    return attack * 1.4 + spAttack * 1.4 + speed * 1.2;
  }
  if (focus === "defense") {
    return hp * 1.2 + defense * 1.4 + spDefense * 1.4;
  }
  if (focus === "speed") {
    return speed * 2 + attack + spAttack;
  }
  return detail.baseStatTotal;
}

function getTypeSets(detail: PokemonDetail) {
  const weak = new Set(
    [...detail.typeEffectiveness.fourTimesWeak, ...detail.typeEffectiveness.doubleWeak].map(
      normalizeName
    )
  );
  const resist = new Set(
    [...detail.typeEffectiveness.halfResistant, ...detail.typeEffectiveness.quarterResistant].map(
      normalizeName
    )
  );
  const immune = new Set(detail.typeEffectiveness.immune.map(normalizeName));

  return {
    weak,
    resist,
    immune
  };
}

export function buildTeamTypeRows(team: PokemonDetail[]): TeamTypeRow[] {
  return ALL_TYPES.map((type) => {
    const normalizedType = normalizeName(type);
    let weak = 0;
    let resist = 0;
    let immune = 0;

    team.forEach((member) => {
      const sets = getTypeSets(member);
      if (sets.immune.has(normalizedType)) {
        immune += 1;
        return;
      }
      if (sets.weak.has(normalizedType)) {
        weak += 1;
      }
      if (sets.resist.has(normalizedType)) {
        resist += 1;
      }
    });

    const score = resist + immune * 2 - weak * 2;
    return {
      type,
      weak,
      resist,
      immune,
      score
    };
  });
}

function uniqueMoves(moves: PokemonMoveInfo[]) {
  const seen = new Set<string>();
  return moves.filter((move) => {
    const key = normalizeName(move.name);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function buildQuickMovePlan(moves: PokemonMoveInfo[]) {
  const levelMoves = moves
    .filter((move) => move.levelLearnedAt !== null && move.levelLearnedAt <= 40)
    .slice(0, 6);
  const machineMoves = moves
    .filter((move) =>
      move.learnMethods.some((method) => normalizeName(method).includes("machine"))
    )
    .slice(0, 4);
  const tutorMoves = moves
    .filter((move) =>
      move.learnMethods.some((method) => normalizeName(method).includes("tutor"))
    )
    .slice(0, 3);
  const eggMoves = moves
    .filter((move) => move.learnMethods.some((method) => normalizeName(method).includes("egg")))
    .slice(0, 3);

  return uniqueMoves([...levelMoves, ...machineMoves, ...tutorMoves, ...eggMoves]).slice(0, 12);
}
