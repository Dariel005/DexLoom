export type PokemonGoActivityCategory =
  | "raids"
  | "battle"
  | "rocket"
  | "research"
  | "events"
  | "exploration"
  | "economy"
  | "social";

export type PokemonGoPriority = "High" | "Medium" | "Low";

export interface PokemonGoFeaturedPokemon {
  name: string;
  dexId: number;
  role: string;
  fastMove: string;
  chargedMove: string;
}

export interface PokemonGoRewardEntry {
  reward: string;
  source: string;
  priority: PokemonGoPriority;
  note: string;
}

export interface PokemonGoActivity {
  id: number;
  slug: string;
  title: string;
  category: PokemonGoActivityCategory;
  categoryLabel: string;
  description: string;
  cadence: string;
  intensity: number;
  idealFor: string[];
  prepChecklist: string[];
  actionLoop: string[];
  proTips: string[];
  commonMistakes: string[];
  rewards: PokemonGoRewardEntry[];
  featuredPokemon: PokemonGoFeaturedPokemon[];
  searchTags: string[];
}

export type PokemonGoItemCategory =
  | "balls"
  | "berries"
  | "healing"
  | "battle"
  | "evolution"
  | "raid"
  | "spawn"
  | "boost"
  | "incubator"
  | "utility"
  | "special";

export type PokemonGoItemRarity = "Common" | "Uncommon" | "Rare" | "Epic";
export type PokemonGoItemAvailability = "Free" | "Premium" | "Both" | "Event";

export interface PokemonGoItem {
  id: number;
  slug: string;
  name: string;
  category: PokemonGoItemCategory;
  categoryLabel: string;
  rarity: PokemonGoItemRarity;
  availability: PokemonGoItemAvailability;
  description: string;
  inGameEffect: string;
  stackCap: string;
  consumable: boolean;
  acquisition: string[];
  bestUseCases: string[];
  relatedSystems: string[];
  pvpRelevance: string;
  raidRelevance: string;
  notes: string[];
  searchTags: string[];
}
