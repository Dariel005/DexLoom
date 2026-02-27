export interface PokemonMoveIndexEntry {
  id: number;
  name: string;
  displayName: string;
}

export interface PokemonMoveDetail {
  id: number;
  name: string;
  displayName: string;
  generation: string | null;
  type: string | null;
  damageClass: string | null;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  priority: number;
  target: string | null;
  effectChance: number | null;
  shortEffect: string | null;
  effect: string | null;
  flavorText: string | null;
  learnedByPokemonCount: number;
  learnedByPokemon: string[];
}

export interface PokemonAbilityIndexEntry {
  id: number;
  name: string;
  displayName: string;
  isMainSeries: boolean;
}

export interface PokemonAbilityPokemonEntry {
  name: string;
  isHidden: boolean;
  slot: number;
}

export interface PokemonAbilityDetail {
  id: number;
  name: string;
  displayName: string;
  generation: string | null;
  isMainSeries: boolean;
  shortEffect: string | null;
  effect: string | null;
  flavorText: string | null;
  pokemonCount: number;
  pokemonSample: PokemonAbilityPokemonEntry[];
}

export interface PokemonTypeIndexEntry {
  id: number;
  name: string;
  displayName: string;
}

export interface PokemonTypePokemonEntry {
  name: string;
  slot: number;
}

export interface PokemonTypeDetail {
  id: number;
  name: string;
  displayName: string;
  generation: string | null;
  doubleDamageTo: string[];
  halfDamageTo: string[];
  noDamageTo: string[];
  doubleDamageFrom: string[];
  halfDamageFrom: string[];
  noDamageFrom: string[];
  moveCount: number;
  sampleMoves: string[];
  pokemonCount: number;
  samplePokemon: PokemonTypePokemonEntry[];
}

export interface PokemonCardIndexEntry {
  id: string;
  name: string;
  displayName: string;
  supertype: string;
  subtypes: string[];
  hp: number | null;
  types: string[];
  setName: string;
  setSeries: string;
  setReleaseDate: string | null;
  rarity: string | null;
  artist: string | null;
  nationalPokedexNumbers: number[];
  imageSmall: string | null;
  imageLarge: string | null;
  number: string;
  regulationMark: string | null;
  stage: string | null;
  evolvesFrom: string | null;
  attacksCount: number;
  abilitiesCount: number;
  rulesCount: number;
  marketPrice: number | null;
  marketSource: "tcgplayer" | "cardmarket" | null;
}

export interface PokemonCardAbilityEntry {
  name: string;
  type: string | null;
  text: string;
}

export interface PokemonCardAttackEntry {
  name: string;
  cost: string[];
  damage: string | null;
  text: string | null;
  convertedEnergyCost: number | null;
}

export interface PokemonCardWeaknessEntry {
  type: string;
  value: string;
}

export interface PokemonCardPriceSnapshot {
  market: "tcgplayer" | "cardmarket";
  low: number | null;
  mid: number | null;
  high: number | null;
  trend: number | null;
  averageSell: number | null;
}

export interface PokemonCardDetail extends PokemonCardIndexEntry {
  flavorText: string | null;
  rules: string[];
  abilityEntries: PokemonCardAbilityEntry[];
  attackEntries: PokemonCardAttackEntry[];
  weaknesses: PokemonCardWeaknessEntry[];
  resistances: PokemonCardWeaknessEntry[];
  retreatCost: string[];
  convertedRetreatCost: number | null;
  legalityStandard: string | null;
  legalityExpanded: string | null;
  legalityUnlimited: string | null;
  setPrintedTotal: number | null;
  setTotal: number | null;
  setSymbolUrl: string | null;
  setLogoUrl: string | null;
  tcgplayerUrl: string | null;
  cardmarketUrl: string | null;
  priceSnapshots: PokemonCardPriceSnapshot[];
  marketLastUpdatedAt: string | null;
}
