import {
  ALL_TYPES,
  buildQuickMovePlan,
  getStat,
  normalizeName
} from "@/lib/pokedex-pro-tools";
import { type PokemonDetail } from "@/types/pokemon";

export const TEAM_BUILDER_STORAGE_KEY = "bga.team-builder.state.v1";
export const TEAM_BUILDER_SIZE = 6;
export const TEAM_BUILDER_BANK_LIMIT = 10;
export const TEAM_BUILDER_MAX_EV_PER_STAT = 252;
export const TEAM_BUILDER_MAX_EV_TOTAL = 510;
export const TEAM_BUILDER_MAX_IV = 31;
export const TEAM_BUILDER_LEVEL = 50;

export const TEAM_BUILDER_STAT_KEYS = [
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed"
] as const;

export type TeamBuilderStatKey = (typeof TEAM_BUILDER_STAT_KEYS)[number];

export interface TeamBuilderNature {
  key: string;
  label: string;
  increase: TeamBuilderStatKey | null;
  decrease: TeamBuilderStatKey | null;
}

export interface TeamBuilderStatSpread {
  hp: number;
  attack: number;
  defense: number;
  "special-attack": number;
  "special-defense": number;
  speed: number;
}

export interface TeamBuilderSlot {
  pokemonId: number;
  itemName: string;
  abilityName: string;
  teraType: string;
  nature: string;
  moves: string[];
  evs: TeamBuilderStatSpread;
  ivs: TeamBuilderStatSpread;
}

export interface TeamBuilderSavedTeam {
  id: string;
  name: string;
  updatedAt: string;
  slots: Array<TeamBuilderSlot | null>;
}

export interface PersistedTeamBuilderState {
  version: 1;
  draftName: string;
  activeTeamId: string | null;
  draftSlots: Array<TeamBuilderSlot | null>;
  savedTeams: TeamBuilderSavedTeam[];
}

export interface TeamBuilderStoredRecord {
  userId: string;
  state: PersistedTeamBuilderState;
  updatedAt: string;
}

export const TEAM_BUILDER_STAT_LABELS: Record<TeamBuilderStatKey, string> = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  "special-attack": "SPA",
  "special-defense": "SPD",
  speed: "SPE"
};

export const TEAM_BUILDER_TYPE_COLORS: Record<string, string> = {
  normal: "#a8a77a",
  fire: "#ee8130",
  water: "#6390f0",
  electric: "#f7d02c",
  grass: "#7ac74c",
  ice: "#96d9d6",
  fighting: "#c22e28",
  poison: "#a33ea1",
  ground: "#e2bf65",
  flying: "#a98ff3",
  psychic: "#f95587",
  bug: "#a6b91a",
  rock: "#b6a136",
  ghost: "#735797",
  dragon: "#6f35fc",
  dark: "#705746",
  steel: "#b7b7ce",
  fairy: "#d685ad"
};

const TEAM_BUILDER_NATURE_DATA: TeamBuilderNature[] = [
  { key: "hardy", label: "Hardy", increase: null, decrease: null },
  { key: "lonely", label: "Lonely", increase: "attack", decrease: "defense" },
  { key: "brave", label: "Brave", increase: "attack", decrease: "speed" },
  {
    key: "adamant",
    label: "Adamant",
    increase: "attack",
    decrease: "special-attack"
  },
  {
    key: "naughty",
    label: "Naughty",
    increase: "attack",
    decrease: "special-defense"
  },
  { key: "bold", label: "Bold", increase: "defense", decrease: "attack" },
  { key: "docile", label: "Docile", increase: null, decrease: null },
  {
    key: "relaxed",
    label: "Relaxed",
    increase: "defense",
    decrease: "speed"
  },
  {
    key: "impish",
    label: "Impish",
    increase: "defense",
    decrease: "special-attack"
  },
  {
    key: "lax",
    label: "Lax",
    increase: "defense",
    decrease: "special-defense"
  },
  { key: "timid", label: "Timid", increase: "speed", decrease: "attack" },
  {
    key: "hasty",
    label: "Hasty",
    increase: "speed",
    decrease: "defense"
  },
  { key: "serious", label: "Serious", increase: null, decrease: null },
  {
    key: "jolly",
    label: "Jolly",
    increase: "speed",
    decrease: "special-attack"
  },
  {
    key: "naive",
    label: "Naive",
    increase: "speed",
    decrease: "special-defense"
  },
  {
    key: "modest",
    label: "Modest",
    increase: "special-attack",
    decrease: "attack"
  },
  {
    key: "mild",
    label: "Mild",
    increase: "special-attack",
    decrease: "defense"
  },
  {
    key: "quiet",
    label: "Quiet",
    increase: "special-attack",
    decrease: "speed"
  },
  { key: "bashful", label: "Bashful", increase: null, decrease: null },
  {
    key: "rash",
    label: "Rash",
    increase: "special-attack",
    decrease: "special-defense"
  },
  {
    key: "calm",
    label: "Calm",
    increase: "special-defense",
    decrease: "attack"
  },
  {
    key: "gentle",
    label: "Gentle",
    increase: "special-defense",
    decrease: "defense"
  },
  {
    key: "sassy",
    label: "Sassy",
    increase: "special-defense",
    decrease: "speed"
  },
  {
    key: "careful",
    label: "Careful",
    increase: "special-defense",
    decrease: "special-attack"
  },
  { key: "quirky", label: "Quirky", increase: null, decrease: null }
];

const EMPTY_STATE: PersistedTeamBuilderState = {
  version: 1,
  draftName: "BOX 01",
  activeTeamId: null,
  draftSlots: createEmptyTeamBuilderSlots(),
  savedTeams: []
};

export const TEAM_BUILDER_NATURES = TEAM_BUILDER_NATURE_DATA;

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function createStatSpread(defaultValue: number): TeamBuilderStatSpread {
  return {
    hp: defaultValue,
    attack: defaultValue,
    defense: defaultValue,
    "special-attack": defaultValue,
    "special-defense": defaultValue,
    speed: defaultValue
  };
}

export function createTeamBuilderSlot(pokemonId: number): TeamBuilderSlot {
  return {
    pokemonId,
    itemName: "",
    abilityName: "",
    teraType: "",
    nature: "hardy",
    moves: Array.from({ length: 4 }, () => ""),
    evs: createStatSpread(0),
    ivs: createStatSpread(TEAM_BUILDER_MAX_IV)
  };
}

export function cloneTeamBuilderSlot(slot: TeamBuilderSlot): TeamBuilderSlot {
  return {
    ...slot,
    moves: slot.moves.slice(0, 4),
    evs: { ...slot.evs },
    ivs: { ...slot.ivs }
  };
}

export function createEmptyTeamBuilderSlots(): Array<TeamBuilderSlot | null> {
  return Array.from({ length: TEAM_BUILDER_SIZE }, () => null);
}

function normalizeStatSpread(
  value: unknown,
  fallback: number,
  maxValue: number
): TeamBuilderStatSpread {
  if (!isRecord(value)) {
    return createStatSpread(fallback);
  }

  return {
    hp: clampNumber(Number(value.hp ?? fallback), 0, maxValue),
    attack: clampNumber(Number(value.attack ?? fallback), 0, maxValue),
    defense: clampNumber(Number(value.defense ?? fallback), 0, maxValue),
    "special-attack": clampNumber(Number(value["special-attack"] ?? fallback), 0, maxValue),
    "special-defense": clampNumber(Number(value["special-defense"] ?? fallback), 0, maxValue),
    speed: clampNumber(Number(value.speed ?? fallback), 0, maxValue)
  };
}

function normalizeTeamBuilderSlot(value: unknown): TeamBuilderSlot | null {
  if (!isRecord(value)) {
    return null;
  }

  const pokemonId = Number(value.pokemonId);
  if (!Number.isFinite(pokemonId) || pokemonId <= 0) {
    return null;
  }

  const moves = Array.isArray(value.moves)
    ? value.moves.slice(0, 4).map((entry) => sanitizeText(entry))
    : [];

  while (moves.length < 4) {
    moves.push("");
  }

  return {
    pokemonId,
    itemName: sanitizeText(value.itemName),
    abilityName: sanitizeText(value.abilityName),
    teraType: sanitizeText(value.teraType),
    nature: sanitizeText(value.nature) || "hardy",
    moves,
    evs: normalizeStatSpread(value.evs, 0, TEAM_BUILDER_MAX_EV_PER_STAT),
    ivs: normalizeStatSpread(value.ivs, TEAM_BUILDER_MAX_IV, TEAM_BUILDER_MAX_IV)
  };
}

function normalizeSavedTeam(value: unknown): TeamBuilderSavedTeam | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = sanitizeText(value.id);
  if (!id) {
    return null;
  }

  const slots = Array.isArray(value.slots)
    ? value.slots.slice(0, TEAM_BUILDER_SIZE).map(normalizeTeamBuilderSlot)
    : createEmptyTeamBuilderSlots();

  while (slots.length < TEAM_BUILDER_SIZE) {
    slots.push(null);
  }

  return {
    id,
    name: sanitizeText(value.name) || "BOX 01",
    updatedAt: sanitizeText(value.updatedAt) || new Date().toISOString(),
    slots
  };
}

export function normalizePersistedTeamBuilderState(
  value: unknown
): PersistedTeamBuilderState {
  if (!isRecord(value) || value.version !== 1) {
    return {
      ...EMPTY_STATE,
      draftSlots: createEmptyTeamBuilderSlots(),
      savedTeams: []
    };
  }

  const draftSlots = Array.isArray(value.draftSlots)
    ? value.draftSlots.slice(0, TEAM_BUILDER_SIZE).map(normalizeTeamBuilderSlot)
    : createEmptyTeamBuilderSlots();

  while (draftSlots.length < TEAM_BUILDER_SIZE) {
    draftSlots.push(null);
  }

  return {
    version: 1,
    draftName: sanitizeText(value.draftName) || "BOX 01",
    activeTeamId: sanitizeText(value.activeTeamId) || null,
    draftSlots,
    savedTeams: Array.isArray(value.savedTeams)
      ? value.savedTeams
          .map(normalizeSavedTeam)
          .filter((team): team is TeamBuilderSavedTeam => team !== null)
          .slice(0, TEAM_BUILDER_BANK_LIMIT)
      : []
  };
}

export function createEmptyPersistedTeamBuilderState(): PersistedTeamBuilderState {
  return {
    ...EMPTY_STATE,
    draftSlots: createEmptyTeamBuilderSlots(),
    savedTeams: []
  };
}

export function normalizeTeamBuilderStoredRecord(
  value: unknown
): TeamBuilderStoredRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const userId = sanitizeText(value.userId);
  if (!userId) {
    return null;
  }

  return {
    userId,
    state: normalizePersistedTeamBuilderState(value.state),
    updatedAt: sanitizeText(value.updatedAt) || new Date().toISOString()
  };
}

export function hasMeaningfulTeamBuilderState(state: PersistedTeamBuilderState) {
  return (
    state.savedTeams.length > 0 ||
    state.draftSlots.some((slot) => slot !== null) ||
    state.activeTeamId !== null ||
    state.draftName.trim() !== "BOX 01"
  );
}

export function loadTeamBuilderState() {
  if (typeof window === "undefined") {
    return createEmptyPersistedTeamBuilderState();
  }

  try {
    const raw = window.localStorage.getItem(TEAM_BUILDER_STORAGE_KEY);
    if (!raw) {
      return createEmptyPersistedTeamBuilderState();
    }

    return normalizePersistedTeamBuilderState(JSON.parse(raw));
  } catch {
    return createEmptyPersistedTeamBuilderState();
  }
}

export function saveTeamBuilderState(value: PersistedTeamBuilderState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(TEAM_BUILDER_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage write failures in prototype mode.
  }
}

export function buildTeamBuilderSpriteUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function buildTeamBuilderArtworkUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function getTeamBuilderNature(value: string) {
  return (
    TEAM_BUILDER_NATURES.find((nature) => nature.key === normalizeName(value)) ??
    TEAM_BUILDER_NATURES[0]
  );
}

export function getNatureModifier(
  natureKey: string,
  statKey: Exclude<TeamBuilderStatKey, "hp">
) {
  const nature = getTeamBuilderNature(natureKey);
  if (nature.increase === statKey) {
    return 1.1;
  }
  if (nature.decrease === statKey) {
    return 0.9;
  }
  return 1;
}

function buildDefaultMoves(detail: PokemonDetail) {
  const quickPlan = buildQuickMovePlan(detail.moves);
  const names = quickPlan.map((move) => move.name).slice(0, 4);

  while (names.length < 4) {
    names.push("");
  }

  return names;
}

export function hydrateTeamBuilderSlot(
  slot: TeamBuilderSlot,
  detail: PokemonDetail
): TeamBuilderSlot {
  const defaultMoves = buildDefaultMoves(detail);

  return {
    ...slot,
    itemName: slot.itemName,
    abilityName: slot.abilityName || detail.abilities[0]?.name || "",
    teraType: slot.teraType || detail.types[0] || "",
    nature: slot.nature || "hardy",
    moves: slot.moves.map((move, index) => move || defaultMoves[index] || ""),
    evs: normalizeStatSpread(slot.evs, 0, TEAM_BUILDER_MAX_EV_PER_STAT),
    ivs: normalizeStatSpread(slot.ivs, TEAM_BUILDER_MAX_IV, TEAM_BUILDER_MAX_IV)
  };
}

export function resolveTeamBuilderSlots(
  slots: Array<TeamBuilderSlot | null>,
  detailsByPokemonId: Map<number, PokemonDetail>
) {
  return slots.map((slot) => {
    if (!slot) {
      return null;
    }
    const detail = detailsByPokemonId.get(slot.pokemonId);
    return detail ? hydrateTeamBuilderSlot(slot, detail) : cloneTeamBuilderSlot(slot);
  });
}

export function getTeamBuilderStatName(statKey: TeamBuilderStatKey) {
  if (statKey === "special-attack") {
    return "special attack";
  }
  if (statKey === "special-defense") {
    return "special defense";
  }
  return statKey;
}

function calculateSingleStat(
  baseStat: number,
  iv: number,
  ev: number,
  isHp: boolean,
  natureModifier: number
) {
  if (isHp) {
    return Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * TEAM_BUILDER_LEVEL) / 100) +
      TEAM_BUILDER_LEVEL +
      10;
  }

  const statValue =
    Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * TEAM_BUILDER_LEVEL) / 100) + 5;
  return Math.floor(statValue * natureModifier);
}

export function calculateBattleStats(
  detail: PokemonDetail,
  slot: TeamBuilderSlot
): TeamBuilderStatSpread {
  return TEAM_BUILDER_STAT_KEYS.reduce((acc, statKey) => {
    const baseStat = getStat(detail, getTeamBuilderStatName(statKey));
    const iv = slot.ivs[statKey];
    const ev = slot.evs[statKey];

    if (statKey === "hp") {
      acc[statKey] = calculateSingleStat(baseStat, iv, ev, true, 1);
      return acc;
    }

    acc[statKey] = calculateSingleStat(
      baseStat,
      iv,
      ev,
      false,
      getNatureModifier(slot.nature, statKey)
    );
    return acc;
  }, createStatSpread(0));
}

export function getTotalEvs(spread: TeamBuilderStatSpread) {
  return TEAM_BUILDER_STAT_KEYS.reduce((total, key) => total + spread[key], 0);
}

export function clampEvForTeamBuilder(
  nextValue: number,
  spread: TeamBuilderStatSpread,
  statKey: TeamBuilderStatKey
) {
  const otherTotal = getTotalEvs(spread) - spread[statKey];
  const cappedValue = clampNumber(nextValue, 0, TEAM_BUILDER_MAX_EV_PER_STAT);
  return clampNumber(cappedValue, 0, Math.max(0, TEAM_BUILDER_MAX_EV_TOTAL - otherTotal));
}

export function buildDefaultDraftName(savedTeamsCount: number) {
  return `BOX ${String(savedTeamsCount + 1).padStart(2, "0")}`;
}

export function buildSavedTeamId() {
  return `team-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildTeamBuilderTypeOptions() {
  return [...ALL_TYPES];
}

export function getFirstEmptySlotIndex(slots: Array<TeamBuilderSlot | null>) {
  return slots.findIndex((slot) => slot === null);
}
