export type GenerationFilterKey =
  | "all"
  | "gen1"
  | "gen2"
  | "gen3"
  | "gen4"
  | "gen5"
  | "gen6"
  | "gen7"
  | "gen8"
  | "gen9";

export const GENERATION_FILTER_OPTIONS: Array<{
  key: GenerationFilterKey;
  label: string;
  generation: number | null;
}> = [
  { key: "all", label: "All Generations", generation: null },
  { key: "gen1", label: "Gen 1", generation: 1 },
  { key: "gen2", label: "Gen 2", generation: 2 },
  { key: "gen3", label: "Gen 3", generation: 3 },
  { key: "gen4", label: "Gen 4", generation: 4 },
  { key: "gen5", label: "Gen 5", generation: 5 },
  { key: "gen6", label: "Gen 6", generation: 6 },
  { key: "gen7", label: "Gen 7", generation: 7 },
  { key: "gen8", label: "Gen 8", generation: 8 },
  { key: "gen9", label: "Gen 9", generation: 9 }
];

const GENERATION_KEYWORDS: Array<{ generation: number; keywords: string[] }> = [
  {
    generation: 9,
    keywords: ["scarlet violet", "teal mask", "indigo disk"]
  },
  {
    generation: 8,
    keywords: ["sword shield", "brilliant diamond", "shining pearl", "legends arceus"]
  },
  {
    generation: 7,
    keywords: ["sun moon", "ultra sun", "ultra moon", "lets go pikachu", "lets go eevee"]
  },
  {
    generation: 6,
    keywords: ["x y", "omega ruby", "alpha sapphire"]
  },
  {
    generation: 5,
    keywords: ["black white", "black 2", "white 2"]
  },
  {
    generation: 4,
    keywords: ["diamond pearl", "platinum", "heartgold", "soulsilver"]
  },
  {
    generation: 3,
    keywords: ["ruby sapphire", "emerald", "firered", "leafgreen", "colosseum", "xd", "channel"]
  },
  {
    generation: 2,
    keywords: ["gold silver", "crystal"]
  },
  {
    generation: 1,
    keywords: ["red blue", "yellow", "stadium"]
  }
];

const GENERATION_BY_SINGLE_VERSION: Record<string, number> = {
  red: 1,
  blue: 1,
  yellow: 1,
  gold: 2,
  silver: 2,
  crystal: 2,
  ruby: 3,
  sapphire: 3,
  emerald: 3,
  firered: 3,
  leafgreen: 3,
  diamond: 4,
  pearl: 4,
  platinum: 4,
  heartgold: 4,
  soulsilver: 4,
  black: 5,
  white: 5,
  x: 6,
  y: 6,
  sun: 7,
  moon: 7,
  ultra: 7,
  sword: 8,
  shield: 8,
  brilliant: 8,
  scarlet: 9,
  violet: 9
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function inferGenerationFromVersionLabel(versionLabel: string) {
  const normalizedLabel = normalize(versionLabel);
  if (!normalizedLabel) {
    return null;
  }

  const keywordMatch = GENERATION_KEYWORDS.find((entry) =>
    entry.keywords.some((keyword) => normalizedLabel.includes(keyword))
  );

  if (keywordMatch) {
    return keywordMatch.generation;
  }

  const tokens = normalizedLabel.split(" ");
  for (const token of tokens) {
    const exact = GENERATION_BY_SINGLE_VERSION[token];
    if (exact) {
      return exact;
    }
  }

  return null;
}

export function toGenerationFilterKey(generation: number | null): GenerationFilterKey {
  if (generation === null || generation < 1 || generation > 9) {
    return "all";
  }
  return `gen${generation}` as GenerationFilterKey;
}

