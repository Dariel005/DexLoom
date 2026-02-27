export type PokemonRegionMapKey =
  | "kanto"
  | "johto"
  | "hoenn"
  | "sinnoh"
  | "unova"
  | "kalos"
  | "alola"
  | "galar"
  | "hisui"
  | "paldea";

export interface PokemonRegionMapCity {
  name: string;
  role: string;
  highlight: string;
}

export interface PokemonRegionMapLandmark {
  name: string;
  category: string;
  summary: string;
}

export interface PokemonRegionMapTravelNode {
  method: string;
  coverage: string;
  note: string;
}

export type PokemonRegionMapPointKind = "city" | "landmark" | "league" | "story";

export interface PokemonRegionMapPoint {
  id: string;
  label: string;
  kind: PokemonRegionMapPointKind;
  x: number;
  y: number;
  summary: string;
}

export interface PokemonRegionMapDetail {
  id: number;
  key: PokemonRegionMapKey;
  name: string;
  generationLabel: string;
  eraLabel: string;
  debutGames: string[];
  revisitGames: string[];
  mapImageUrl: string;
  mapImageAlt: string;
  mapImageCredit: string;
  sourceUrl: string;
  professor: string;
  leagueHQ: string;
  champion: string;
  villainTeams: string[];
  starterPokemon: string[];
  pokedexSize: number;
  gymCount: number;
  trialCount: number;
  routeCount: number;
  environmentTags: string[];
  worldStyle: string;
  progressionStyle: string;
  narrativeRole: string;
  animeFocus: string;
  keyCities: PokemonRegionMapCity[];
  landmarks: PokemonRegionMapLandmark[];
  travelNetwork: PokemonRegionMapTravelNode[];
  explorerTips: string[];
  loreHighlights: string[];
  searchTags: string[];
}
