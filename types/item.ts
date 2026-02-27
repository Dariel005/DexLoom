export interface PokemonItemIndexEntry {
  id: number;
  name: string;
  displayName: string;
  spriteHdUrl: string;
  spriteUrl: string;
  category: string;
  categoryKey: string;
  pocket: string;
  pocketKey: string;
}

export interface PokemonItemHeldByEntry {
  name: string;
  rarity: number | null;
  versions: string[];
}

export interface PokemonItemDetail {
  id: number;
  name: string;
  displayName: string;
  category: string;
  categoryKey: string;
  pocket: string;
  pocketKey: string;
  cost: number;
  flingPower: number | null;
  flingEffect: string | null;
  attributes: string[];
  shortEffect: string | null;
  effect: string | null;
  flavorText: string | null;
  availabilityGenerations: string[];
  availabilityVersions: string[];
  heldByPokemon: PokemonItemHeldByEntry[];
  machineVersionGroups: string[];
  spriteHdUrl: string;
  spriteUrl: string | null;
}
