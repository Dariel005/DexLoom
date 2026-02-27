export type GenerationKey =
  | "gen1"
  | "gen2"
  | "gen3"
  | "gen4"
  | "gen5"
  | "gen6"
  | "gen7"
  | "gen8"
  | "gen9";

export interface PokemonGeneration {
  key: GenerationKey;
  label: string;
  region: string;
  startId: number;
  endId: number;
}

export interface PokemonStat {
  name: string;
  baseStat: number;
}

export interface PokemonDetailStat extends PokemonStat {
  effort: number;
}

export interface PokemonSprites {
  officialArtwork: string | null;
  officialArtworkShiny: string | null;
  home: string | null;
  homeShiny: string | null;
  frontDefault: string | null;
  frontShiny: string | null;
}

export interface PokemonSpriteEntry {
  label: string;
  url: string;
}

export interface EvolutionStage {
  id: number;
  name: string;
  sprite: string | null;
  trigger: string | null;
  minLevel: number | null;
  item: string | null;
  heldItem: string | null;
  minHappiness: number | null;
}

export interface PokemonEvolutionChain {
  stages: EvolutionStage[];
}

export interface PokemonAbilityInfo {
  name: string;
  slot: number;
  isHidden: boolean;
  shortEffect: string | null;
  effect: string | null;
  generation: string | null;
}

export interface PokemonMoveInfo {
  name: string;
  levelLearnedAt: number | null;
  learnMethods: string[];
  versionGroups: string[];
}

export interface PokemonHeldItemInfo {
  name: string;
  rarity: number | null;
  versions: string[];
}

export interface PokemonEncounterInfo {
  area: string;
  versions: string[];
}

export interface PokemonPokedexNumber {
  dex: string;
  number: number;
}

export interface PokemonLocalizedName {
  language: string;
  name: string;
}

export interface PokemonVarietyInfo {
  name: string;
  isDefault: boolean;
}

export interface PokemonFlavorEntry {
  version: string;
  text: string;
}

export interface PokemonGameIndexInfo {
  version: string;
  gameIndex: number;
}

export interface PokemonTypeEffectiveness {
  fourTimesWeak: string[];
  doubleWeak: string[];
  neutral: string[];
  halfResistant: string[];
  quarterResistant: string[];
  immune: string[];
}

export interface PokemonListEntry {
  id: number;
  name: string;
  displayName: string;
  artwork: string | null;
  homeSprite: string | null;
  types: string[];
  generation: string;
  generationKey: GenerationKey;
  attack: number;
}

export interface PokemonSearchIndexEntry {
  id: number;
  name: string;
  displayName: string;
  generation: string;
  generationKey: GenerationKey;
}

export interface PokemonGenerationPage {
  generation: PokemonGeneration;
  page: number;
  pageSize: number;
  hasMore: boolean;
  results: PokemonListEntry[];
}

export interface PokemonDetail {
  id: number;
  name: string;
  speciesName: string;
  description: string;
  flavorEntries: PokemonFlavorEntry[];
  genus: string;
  generation: string;
  generationKey: GenerationKey;
  habitat: string | null;
  color: string | null;
  shape: string | null;
  evolvesFrom: string | null;
  isBaby: boolean;
  isLegendary: boolean;
  isMythical: boolean;
  hasGenderDifferences: boolean;
  forms: string[];
  varieties: PokemonVarietyInfo[];
  names: PokemonLocalizedName[];
  pokedexNumbers: PokemonPokedexNumber[];
  gameIndices: PokemonGameIndexInfo[];
  height: number;
  weight: number;
  baseExperience: number | null;
  captureRate: number;
  baseHappiness: number;
  hatchCounter: number;
  genderRate: number;
  eggGroups: string[];
  growthRate: string | null;
  evYield: Array<{
    stat: string;
    value: number;
  }>;
  types: string[];
  typeEffectiveness: PokemonTypeEffectiveness;
  abilities: PokemonAbilityInfo[];
  moves: PokemonMoveInfo[];
  movesCount: number;
  heldItems: PokemonHeldItemInfo[];
  encounters: PokemonEncounterInfo[];
  stats: PokemonDetailStat[];
  baseStatTotal: number;
  sprites: PokemonSprites;
  spriteGallery: PokemonSpriteEntry[];
  cryUrl: string | null;
  evolutionChain: PokemonEvolutionChain;
}

export interface PokemonFilters {
  query: string;
  id: string;
  type: PokemonTypeFilter;
  generation: PokemonGenerationFilter;
  minAttack: number | "";
}

export type PokemonTypeFilter = "all" | string;
export type PokemonGenerationFilter = GenerationKey | "all";
