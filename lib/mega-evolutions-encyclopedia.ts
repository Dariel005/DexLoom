import megaEvolutionSeed from "@/data/mega-evolutions-seed.json";

interface MegaEvolutionSeedStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

interface MegaEvolutionSeedEntry {
  slug: string;
  baseSpecies: string;
  megaName: string;
  activationItem: string;
  debutGeneration: string;
  battleRole: string;
  dexNumber: number;
  imageSrc: string;
  imageAlt: string;
  types: string[];
  ability: string;
  stats: MegaEvolutionSeedStats;
}

export interface MegaEvolutionEntry {
  slug: string;
  baseSpecies: string;
  baseDexNumber: number;
  megaName: string;
  activationItem: string;
  debutGeneration: string;
  battleRole: string;
  dexNumber: number;
  imageSrc: string;
  imageAlt: string;
  types: string[];
  ability: string;
  stats: MegaEvolutionSeedStats;
  baseStatTotal: number;
  region: string;
  profileSummary: string;
  searchTokens: string;
}

export interface MegaRoleBreakdownEntry {
  role: string;
  total: number;
  representative: string;
  averageBst: number;
}

export interface MegaTypeCoverageEntry {
  type: string;
  total: number;
  sample: string;
}

export interface MegaStatLeaderEntry {
  metric: string;
  megaName: string;
  value: number;
}

const REGION_BY_BASE_SPECIES: Record<string, string> = {
  Venusaur: "Kanto",
  Charizard: "Kanto",
  Blastoise: "Kanto",
  Beedrill: "Kanto",
  Pidgeot: "Kanto",
  Alakazam: "Kanto",
  Slowbro: "Kanto",
  Gengar: "Kanto",
  Kangaskhan: "Kanto",
  Pinsir: "Kanto",
  Gyarados: "Kanto",
  Aerodactyl: "Kanto",
  Mewtwo: "Kanto",
  Ampharos: "Johto",
  Steelix: "Johto",
  Scizor: "Johto",
  Heracross: "Johto",
  Houndoom: "Johto",
  Tyranitar: "Johto",
  Sceptile: "Hoenn",
  Blaziken: "Hoenn",
  Swampert: "Hoenn",
  Gardevoir: "Hoenn",
  Sableye: "Hoenn",
  Mawile: "Hoenn",
  Aggron: "Hoenn",
  Medicham: "Hoenn",
  Manectric: "Hoenn",
  Sharpedo: "Hoenn",
  Camerupt: "Hoenn",
  Altaria: "Hoenn",
  Banette: "Hoenn",
  Absol: "Hoenn",
  Glalie: "Hoenn",
  Salamence: "Hoenn",
  Metagross: "Hoenn",
  Latias: "Hoenn",
  Latios: "Hoenn",
  Rayquaza: "Hoenn",
  Lopunny: "Sinnoh",
  Garchomp: "Sinnoh",
  Lucario: "Sinnoh",
  Abomasnow: "Sinnoh",
  Gallade: "Sinnoh",
  Audino: "Unova",
  Diancie: "Kalos"
};

const BASE_DEX_BY_SPECIES: Record<string, number> = {
  Venusaur: 3,
  Charizard: 6,
  Blastoise: 9,
  Beedrill: 15,
  Pidgeot: 18,
  Alakazam: 65,
  Slowbro: 80,
  Gengar: 94,
  Kangaskhan: 115,
  Pinsir: 127,
  Gyarados: 130,
  Aerodactyl: 142,
  Mewtwo: 150,
  Ampharos: 181,
  Steelix: 208,
  Scizor: 212,
  Heracross: 214,
  Houndoom: 229,
  Tyranitar: 248,
  Sceptile: 254,
  Blaziken: 257,
  Swampert: 260,
  Gardevoir: 282,
  Sableye: 302,
  Mawile: 303,
  Aggron: 306,
  Medicham: 308,
  Manectric: 310,
  Sharpedo: 319,
  Camerupt: 323,
  Altaria: 334,
  Banette: 354,
  Absol: 359,
  Glalie: 362,
  Salamence: 373,
  Metagross: 376,
  Latias: 380,
  Latios: 381,
  Rayquaza: 384,
  Lopunny: 428,
  Garchomp: 445,
  Lucario: 448,
  Abomasnow: 460,
  Gallade: 475,
  Audino: 531,
  Diancie: 719
};

const FEATURED_MEGA_SLUGS = [
  "charizard-mega-x",
  "charizard-mega-y",
  "gengar-mega",
  "mawile-mega",
  "swampert-mega",
  "rayquaza-mega"
];

function formatToken(token: string) {
  return token
    .split("-")
    .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1))
    .join(" ");
}

const RAW_MEGA_EVOLUTIONS = megaEvolutionSeed as MegaEvolutionSeedEntry[];

export const MEGA_EVOLUTION_INDEX: MegaEvolutionEntry[] = RAW_MEGA_EVOLUTIONS
  .map((entry) => {
    const stats = entry.stats;
    const baseStatTotal =
      stats.hp +
      stats.attack +
      stats.defense +
      stats.specialAttack +
      stats.specialDefense +
      stats.speed;

    return {
      ...entry,
      baseDexNumber: BASE_DEX_BY_SPECIES[entry.baseSpecies] ?? entry.dexNumber,
      types: entry.types.map((type) => formatToken(type)),
      ability: formatToken(entry.ability),
      baseStatTotal,
      region: REGION_BY_BASE_SPECIES[entry.baseSpecies] ?? "Unknown",
      profileSummary: `${entry.megaName} is a ${entry.battleRole.toLowerCase()} profile with ${formatToken(entry.ability)} and activation via ${entry.activationItem}.`,
      searchTokens: [
        entry.baseSpecies,
        entry.megaName,
        entry.activationItem,
        entry.battleRole,
        formatToken(entry.ability),
        ...entry.types.map((type) => formatToken(type))
      ]
        .join(" ")
        .toLowerCase()
    };
  })
  .sort((a, b) => a.megaName.localeCompare(b.megaName));

export const MEGA_OVERVIEW_METRICS = {
  totalForms: MEGA_EVOLUTION_INDEX.length,
  uniqueSpecies: new Set(MEGA_EVOLUTION_INDEX.map((entry) => entry.baseSpecies)).size,
  typeCoverage: new Set(MEGA_EVOLUTION_INDEX.flatMap((entry) => entry.types)).size,
  uniqueAbilities: new Set(MEGA_EVOLUTION_INDEX.map((entry) => entry.ability)).size
};

export const MEGA_FEATURED_ENTRIES: MegaEvolutionEntry[] = FEATURED_MEGA_SLUGS.map((slug) =>
  MEGA_EVOLUTION_INDEX.find((entry) => entry.slug === slug)
).filter((entry): entry is MegaEvolutionEntry => Boolean(entry));

export const MEGA_ROLE_BREAKDOWN: MegaRoleBreakdownEntry[] = Array.from(
  MEGA_EVOLUTION_INDEX.reduce((map, entry) => {
    const current = map.get(entry.battleRole) ?? {
      total: 0,
      representative: entry.megaName,
      representativeBst: entry.baseStatTotal,
      bstAccumulator: 0
    };
    current.total += 1;
    current.bstAccumulator += entry.baseStatTotal;
    if (entry.baseStatTotal > current.representativeBst) {
      current.representative = entry.megaName;
      current.representativeBst = entry.baseStatTotal;
    }
    map.set(entry.battleRole, current);
    return map;
  }, new Map<string, { total: number; representative: string; representativeBst: number; bstAccumulator: number }>())
)
  .map(([role, value]) => ({
    role,
    total: value.total,
    representative: value.representative,
    averageBst: Math.round(value.bstAccumulator / value.total)
  }))
  .sort((a, b) => b.total - a.total || a.role.localeCompare(b.role));

export const MEGA_TYPE_COVERAGE: MegaTypeCoverageEntry[] = Array.from(
  MEGA_EVOLUTION_INDEX.reduce((map, entry) => {
    entry.types.forEach((type) => {
      const current = map.get(type) ?? { total: 0, sample: [] as string[] };
      current.total += 1;
      if (current.sample.length < 3) {
        current.sample.push(entry.megaName);
      }
      map.set(type, current);
    });
    return map;
  }, new Map<string, { total: number; sample: string[] }>())
)
  .map(([type, value]) => ({
    type,
    total: value.total,
    sample: value.sample.join(", ")
  }))
  .sort((a, b) => b.total - a.total || a.type.localeCompare(b.type));

function findMaxEntry(metric: keyof MegaEvolutionSeedStats) {
  return MEGA_EVOLUTION_INDEX.reduce((leader, entry) => {
    if (!leader || entry.stats[metric] > leader.stats[metric]) {
      return entry;
    }
    return leader;
  }, null as MegaEvolutionEntry | null);
}

const speedLeader = findMaxEntry("speed");
const attackLeader = findMaxEntry("attack");
const specialAttackLeader = findMaxEntry("specialAttack");
const physicalDefenseLeader = findMaxEntry("defense");
const specialDefenseLeader = findMaxEntry("specialDefense");
const bstLeader = MEGA_EVOLUTION_INDEX.reduce((leader, entry) => {
  if (!leader || entry.baseStatTotal > leader.baseStatTotal) {
    return entry;
  }
  return leader;
}, null as MegaEvolutionEntry | null);

export const MEGA_STAT_LEADERS: MegaStatLeaderEntry[] = [
  speedLeader
    ? { metric: "Top Speed", megaName: speedLeader.megaName, value: speedLeader.stats.speed }
    : null,
  attackLeader
    ? { metric: "Top Attack", megaName: attackLeader.megaName, value: attackLeader.stats.attack }
    : null,
  specialAttackLeader
    ? {
        metric: "Top Sp. Attack",
        megaName: specialAttackLeader.megaName,
        value: specialAttackLeader.stats.specialAttack
      }
    : null,
  physicalDefenseLeader
    ? {
        metric: "Top Defense",
        megaName: physicalDefenseLeader.megaName,
        value: physicalDefenseLeader.stats.defense
      }
    : null,
  specialDefenseLeader
    ? {
        metric: "Top Sp. Defense",
        megaName: specialDefenseLeader.megaName,
        value: specialDefenseLeader.stats.specialDefense
      }
    : null,
  bstLeader
    ? { metric: "Top BST", megaName: bstLeader.megaName, value: bstLeader.baseStatTotal }
    : null
].filter((entry): entry is MegaStatLeaderEntry => Boolean(entry));

const MEGA_BY_SLUG = new Map(MEGA_EVOLUTION_INDEX.map((entry) => [entry.slug, entry]));

export function getMegaEvolutionBySlug(slug: string) {
  return MEGA_BY_SLUG.get(slug) ?? null;
}
