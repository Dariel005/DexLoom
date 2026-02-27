import { cache } from "react";
import { getGenerationByKey, getGenerationByPokemonId } from "@/lib/generations";
import { formatLabel } from "@/lib/utils";
import {
  type PokemonItemDetail,
  type PokemonItemIndexEntry
} from "@/types/item";
import {
  type PokemonAbilityDetail,
  type PokemonAbilityIndexEntry,
  type PokemonMoveDetail,
  type PokemonMoveIndexEntry,
  type PokemonTypeDetail,
  type PokemonTypeIndexEntry
} from "@/types/encyclopedia";
import {
  type EvolutionStage,
  type GenerationKey,
  type PokemonAbilityInfo,
  type PokemonDetail,
  type PokemonEncounterInfo,
  type PokemonEvolutionChain,
  type PokemonFlavorEntry,
  type PokemonGameIndexInfo,
  type PokemonGenerationPage,
  type PokemonHeldItemInfo,
  type PokemonListEntry,
  type PokemonLocalizedName,
  type PokemonMoveInfo,
  type PokemonPokedexNumber,
  type PokemonSearchIndexEntry,
  type PokemonSpriteEntry,
  type PokemonTypeEffectiveness,
  type PokemonVarietyInfo
} from "@/types/pokemon";

const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";
const REQUEST_TIMEOUT_MS = 12_000;
const REVALIDATE_DEFAULT_SECONDS = 60 * 30;
const REVALIDATE_INDEX_SECONDS = 60 * 60 * 24;
const REVALIDATE_REFERENCE_SECONDS = 60 * 60 * 24 * 7;

export const GENERATION_PAGE_SIZE = 24;

const ALL_TYPE_NAMES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy"
] as const;

interface RequestOptions {
  revalidate?: number;
  tags?: string[];
}

interface PokemonApiErrorOptions {
  endpoint: string;
  status?: number;
  cause?: unknown;
}

interface NamedApiResource {
  name: string;
  url: string;
}

interface PokeApiSprites {
  [key: string]: unknown;
  front_default: string | null;
  front_shiny?: string | null;
  other?: {
    home?: {
      front_default: string | null;
      front_shiny?: string | null;
    };
    "official-artwork"?: {
      front_default: string | null;
      front_shiny?: string | null;
    };
  };
}

interface PokeApiPokemonResponse {
  id: number;
  name: string;
  order: number;
  base_experience: number | null;
  height: number;
  weight: number;
  types: Array<{
    slot: number;
    type: NamedApiResource;
  }>;
  abilities: Array<{
    ability: NamedApiResource;
    is_hidden: boolean;
    slot: number;
  }>;
  stats: Array<{
    base_stat: number;
    effort: number;
    stat: NamedApiResource;
  }>;
  sprites: PokeApiSprites;
  cries: {
    latest: string | null;
    legacy: string | null;
  };
  species: NamedApiResource;
  forms: NamedApiResource[];
  moves: Array<{
    move: NamedApiResource;
    version_group_details: Array<{
      level_learned_at: number;
      move_learn_method: NamedApiResource;
      version_group: NamedApiResource;
    }>;
  }>;
  held_items: Array<{
    item: NamedApiResource;
    version_details: Array<{
      rarity: number;
      version: NamedApiResource;
    }>;
  }>;
  game_indices: Array<{
    game_index: number;
    version: NamedApiResource;
  }>;
  location_area_encounters: string;
}

interface PokeApiPokemonSpeciesResponse {
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
    version: NamedApiResource;
  }>;
  genera: Array<{
    genus: string;
    language: { name: string };
  }>;
  names: Array<{
    name: string;
    language: { name: string };
  }>;
  generation: NamedApiResource;
  habitat: NamedApiResource | null;
  evolution_chain: {
    url: string;
  };
  color: NamedApiResource | null;
  shape: NamedApiResource | null;
  growth_rate: NamedApiResource | null;
  evolves_from_species: NamedApiResource | null;
  varieties: Array<{
    is_default: boolean;
    pokemon: NamedApiResource;
  }>;
  pokedex_numbers: Array<{
    entry_number: number;
    pokedex: NamedApiResource;
  }>;
  egg_groups: NamedApiResource[];
  gender_rate: number;
  hatch_counter: number;
  base_happiness: number;
  capture_rate: number;
  has_gender_differences: boolean;
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
}

interface PokeApiListResponse {
  results: Array<{
    name: string;
    url: string;
  }>;
}

interface PokeApiEvolutionDetail {
  min_level: number | null;
  trigger: { name: string } | null;
  item: { name: string } | null;
  held_item: { name: string } | null;
  min_happiness: number | null;
}

interface PokeApiEvolutionChainLink {
  species: NamedApiResource;
  evolution_details: PokeApiEvolutionDetail[];
  evolves_to: PokeApiEvolutionChainLink[];
}

interface PokeApiEvolutionChainResponse {
  chain: PokeApiEvolutionChainLink;
}

interface PokeApiAbilityResponse {
  generation: NamedApiResource;
  effect_entries: Array<{
    effect: string;
    short_effect: string;
    language: { name: string };
  }>;
}

interface PokeApiAbilityDetailResponse {
  id: number;
  name: string;
  generation: NamedApiResource;
  is_main_series: boolean;
  effect_entries: Array<{
    effect: string;
    short_effect: string;
    language: { name: string };
  }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
    version_group: NamedApiResource;
  }>;
  pokemon: Array<{
    is_hidden: boolean;
    slot: number;
    pokemon: NamedApiResource;
  }>;
}

interface PokeApiTypeResponse {
  name: string;
  damage_relations: {
    double_damage_from: NamedApiResource[];
    half_damage_from: NamedApiResource[];
    no_damage_from: NamedApiResource[];
  };
}

interface PokeApiTypeDetailResponse {
  id: number;
  name: string;
  generation: NamedApiResource;
  damage_relations: {
    double_damage_to: NamedApiResource[];
    half_damage_to: NamedApiResource[];
    no_damage_to: NamedApiResource[];
    double_damage_from: NamedApiResource[];
    half_damage_from: NamedApiResource[];
    no_damage_from: NamedApiResource[];
  };
  moves: NamedApiResource[];
  pokemon: Array<{
    slot: number;
    pokemon: NamedApiResource;
  }>;
}

interface PokeApiMoveDetailResponse {
  id: number;
  name: string;
  accuracy: number | null;
  effect_chance: number | null;
  pp: number | null;
  priority: number;
  power: number | null;
  damage_class: NamedApiResource | null;
  generation: NamedApiResource | null;
  target: NamedApiResource | null;
  type: NamedApiResource | null;
  effect_entries: Array<{
    effect: string;
    short_effect: string;
    language: { name: string };
  }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
    version_group: NamedApiResource;
  }>;
  learned_by_pokemon: NamedApiResource[];
}

interface PokeApiEncounterResponse {
  location_area: NamedApiResource;
  version_details: Array<{
    version: NamedApiResource;
  }>;
}

interface PokeApiItemCategoryResponse {
  id: number;
  name: string;
  pocket: NamedApiResource;
  items: NamedApiResource[];
}

interface PokeApiItemResponse {
  id: number;
  name: string;
  cost: number;
  fling_power: number | null;
  fling_effect: NamedApiResource | null;
  attributes: NamedApiResource[];
  category: NamedApiResource;
  effect_entries: Array<{
    effect: string;
    short_effect: string;
    language: { name: string };
  }>;
  flavor_text_entries: Array<{
    text: string;
    language: { name: string };
    version_group: NamedApiResource;
  }>;
  names: Array<{
    name: string;
    language: { name: string };
  }>;
  game_indices: Array<{
    game_index: number;
    generation: NamedApiResource;
  }>;
  held_by_pokemon: Array<{
    pokemon: NamedApiResource;
    version_details: Array<{
      rarity: number;
      version: NamedApiResource;
    }>;
  }>;
  machines: Array<{
    machine: NamedApiResource;
    version_group: NamedApiResource;
  }>;
  sprites: {
    default: string | null;
  };
}

export class PokemonApiError extends Error {
  endpoint: string;
  status?: number;

  constructor(message: string, options: PokemonApiErrorOptions) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = "PokemonApiError";
    this.endpoint = options.endpoint;
    this.status = options.status;
  }
}

function resolveEndpoint(endpoint: string) {
  return endpoint.startsWith("http")
    ? endpoint
    : `${POKEAPI_BASE_URL}${endpoint}`;
}

function normalizeText(value: string) {
  return value.replace(/[\f\n\r]+/g, " ").replace(/\s+/g, " ").trim();
}

function extractIdFromUrl(url: string) {
  const match = url.match(/\/(\d+)\/?$/);
  if (!match?.[1]) {
    throw new PokemonApiError("Unable to extract Pokemon id from URL.", {
      endpoint: url
    });
  }
  return Number(match[1]);
}

function buildOfficialArtworkUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function buildItemSpriteUrl(itemName: string) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemName}.png`;
}

function buildItemSpriteHdUrl(itemName: string) {
  // Dream-world item sprites are incomplete and frequently 404.
  // Use the canonical item sprite path as the primary artwork URL.
  return buildItemSpriteUrl(itemName);
}

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

function formatResourceName(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  return formatLabel(value);
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function mapNamedResources(resources: NamedApiResource[]) {
  return uniqueSorted(resources.map((resource) => formatLabel(resource.name)));
}

async function requestJson<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = resolveEndpoint(endpoint);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: {
        revalidate: options.revalidate ?? REVALIDATE_DEFAULT_SECONDS,
        tags: options.tags
      }
    });

    if (!response.ok) {
      throw new PokemonApiError(`PokeAPI request failed (${response.status}).`, {
        endpoint: url,
        status: response.status
      });
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof PokemonApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new PokemonApiError("PokeAPI request timed out.", {
        endpoint: url,
        cause: error
      });
    }

    throw new PokemonApiError("Unexpected PokeAPI request error.", {
      endpoint: url,
      cause: error
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
) {
  const output = new Array<R>(items.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) {
        return;
      }
      output[index] = await mapper(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(Math.max(concurrency, 1), items.length) }, () => worker())
  );
  return output;
}

function mapPokemonToListEntry(pokemon: PokeApiPokemonResponse): PokemonListEntry {
  const generation = getGenerationByPokemonId(pokemon.id);
  const attack =
    pokemon.stats.find((stat) => stat.stat.name === "attack")?.base_stat ?? 0;

  return {
    id: pokemon.id,
    name: pokemon.name,
    displayName: formatLabel(pokemon.name),
    artwork:
      pokemon.sprites.other?.["official-artwork"]?.front_default ??
      buildOfficialArtworkUrl(pokemon.id),
    homeSprite: pokemon.sprites.other?.home?.front_default ?? null,
    types: pokemon.types
      .slice()
      .sort((a, b) => a.slot - b.slot)
      .map((entry) => formatLabel(entry.type.name)),
    generation: `${generation.label} (${generation.region})`,
    generationKey: generation.key,
    attack
  };
}

function parseEvolutionChain(chain: PokeApiEvolutionChainLink): PokemonEvolutionChain {
  const stages: EvolutionStage[] = [];

  const walk = (node: PokeApiEvolutionChainLink, detail?: PokeApiEvolutionDetail) => {
    const id = extractIdFromUrl(node.species.url);
    stages.push({
      id,
      name: formatLabel(node.species.name),
      sprite: buildOfficialArtworkUrl(id),
      trigger: detail?.trigger?.name ? formatLabel(detail.trigger.name) : null,
      minLevel: detail?.min_level ?? null,
      item: detail?.item?.name ? formatLabel(detail.item.name) : null,
      heldItem: detail?.held_item?.name ? formatLabel(detail.held_item.name) : null,
      minHappiness: detail?.min_happiness ?? null
    });

    node.evolves_to.forEach((next) => walk(next, next.evolution_details[0]));
  };

  walk(chain);
  return { stages };
}

function parseFlavorEntries(
  entries: PokeApiPokemonSpeciesResponse["flavor_text_entries"]
): PokemonFlavorEntry[] {
  const seenByVersion = new Map<string, string>();

  entries.forEach((entry) => {
    if (entry.language.name !== "en") {
      return;
    }
    if (seenByVersion.has(entry.version.name)) {
      return;
    }
    seenByVersion.set(entry.version.name, normalizeText(entry.flavor_text));
  });

  return Array.from(seenByVersion.entries())
    .map(([version, text]) => ({
      version: formatLabel(version),
      text
    }))
    .slice(0, 36);
}

function parseNames(entries: PokeApiPokemonSpeciesResponse["names"]): PokemonLocalizedName[] {
  const preferredOrder = [
    "en",
    "ja-Hrkt",
    "roomaji",
    "ja",
    "es",
    "fr",
    "de",
    "it",
    "ko",
    "zh-Hant",
    "zh-Hans"
  ];

  return entries
    .map((entry) => ({
      language: entry.language.name,
      name: entry.name
    }))
    .sort((a, b) => {
      const indexA = preferredOrder.indexOf(a.language);
      const indexB = preferredOrder.indexOf(b.language);
      const rankA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
      const rankB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return a.language.localeCompare(b.language);
    });
}

function parsePokedexNumbers(
  entries: PokeApiPokemonSpeciesResponse["pokedex_numbers"]
): PokemonPokedexNumber[] {
  return entries
    .map((entry) => ({
      dex: formatLabel(entry.pokedex.name),
      number: entry.entry_number
    }))
    .sort((a, b) => a.dex.localeCompare(b.dex));
}

function parseVarieties(
  entries: PokeApiPokemonSpeciesResponse["varieties"]
): PokemonVarietyInfo[] {
  return entries
    .map((entry) => ({
      name: formatLabel(entry.pokemon.name),
      isDefault: entry.is_default
    }))
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name));
}

function parseHeldItems(items: PokeApiPokemonResponse["held_items"]): PokemonHeldItemInfo[] {
  return items.map((entry) => ({
    name: formatLabel(entry.item.name),
    rarity:
      entry.version_details.length > 0
        ? Math.max(...entry.version_details.map((version) => version.rarity))
        : null,
    versions: uniqueSorted(
      entry.version_details.map((detail) => formatLabel(detail.version.name))
    )
  }));
}

function parseGameIndices(
  entries: PokeApiPokemonResponse["game_indices"]
): PokemonGameIndexInfo[] {
  return entries
    .map((entry) => ({
      version: formatLabel(entry.version.name),
      gameIndex: entry.game_index
    }))
    .sort((a, b) => a.gameIndex - b.gameIndex);
}

function parseMoves(moves: PokeApiPokemonResponse["moves"]) {
  const movesByName = new Map<
    string,
    {
      levelLearnedAt: number | null;
      learnMethods: Set<string>;
      versionGroups: Set<string>;
    }
  >();

  moves.forEach((entry) => {
    const moveName = formatLabel(entry.move.name);
    const current = movesByName.get(moveName) ?? {
      levelLearnedAt: null,
      learnMethods: new Set<string>(),
      versionGroups: new Set<string>()
    };

    entry.version_group_details.forEach((detail) => {
      current.learnMethods.add(formatLabel(detail.move_learn_method.name));
      current.versionGroups.add(formatLabel(detail.version_group.name));
      if (detail.level_learned_at > 0) {
        current.levelLearnedAt =
          current.levelLearnedAt === null
            ? detail.level_learned_at
            : Math.min(current.levelLearnedAt, detail.level_learned_at);
      }
    });

    movesByName.set(moveName, current);
  });

  const allMoves: PokemonMoveInfo[] = Array.from(movesByName.entries()).map(
    ([name, details]) => ({
      name,
      levelLearnedAt: details.levelLearnedAt,
      learnMethods: Array.from(details.learnMethods).sort((a, b) => a.localeCompare(b)),
      versionGroups: Array.from(details.versionGroups).sort((a, b) => a.localeCompare(b))
    })
  );

  allMoves.sort((a, b) => {
    if (a.levelLearnedAt === null && b.levelLearnedAt !== null) {
      return 1;
    }
    if (a.levelLearnedAt !== null && b.levelLearnedAt === null) {
      return -1;
    }
    if (a.levelLearnedAt !== null && b.levelLearnedAt !== null && a.levelLearnedAt !== b.levelLearnedAt) {
      return a.levelLearnedAt - b.levelLearnedAt;
    }
    return a.name.localeCompare(b.name);
  });

  return {
    allMoves,
    visibleMoves: allMoves.slice(0, 120)
  };
}

function createTypeEffectiveness(): PokemonTypeEffectiveness {
  return {
    fourTimesWeak: [],
    doubleWeak: [],
    neutral: [],
    halfResistant: [],
    quarterResistant: [],
    immune: []
  };
}

function collectSpriteUrls(
  value: unknown,
  path: string[],
  seen: Set<string>,
  output: PokemonSpriteEntry[]
) {
  if (typeof value === "string") {
    if (!value.startsWith("http") || seen.has(value)) {
      return;
    }
    seen.add(value);
    const label =
      path
        .filter((segment) => !/^\d+$/.test(segment))
        .map((segment) => formatLabel(segment.replace(/_/g, "-")))
        .join(" / ") || "Sprite";
    output.push({ label, url: value });
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      collectSpriteUrls(entry, [...path, String(index)], seen, output)
    );
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
      collectSpriteUrls(nestedValue, [...path, key], seen, output);
    });
  }
}

function buildSpriteGallery(sprites: PokeApiSprites): PokemonSpriteEntry[] {
  const seen = new Set<string>();
  const output: PokemonSpriteEntry[] = [];
  collectSpriteUrls(sprites, [], seen, output);
  return output.sort((a, b) => a.label.localeCompare(b.label)).slice(0, 96);
}

async function fetchAbilityDetails(
  abilities: PokeApiPokemonResponse["abilities"]
): Promise<PokemonAbilityInfo[]> {
  const sortedAbilities = abilities.slice().sort((a, b) => a.slot - b.slot);

  return mapWithConcurrency(sortedAbilities, 3, async (entry) => {
    try {
      const response = await requestJson<PokeApiAbilityResponse>(entry.ability.url, {
        revalidate: REVALIDATE_REFERENCE_SECONDS,
        tags: [`pokemon-ability-${entry.ability.name}`]
      });

      const englishEffect = response.effect_entries.find(
        (effect) => effect.language.name === "en"
      );

      return {
        name: formatLabel(entry.ability.name),
        slot: entry.slot,
        isHidden: entry.is_hidden,
        shortEffect: englishEffect?.short_effect
          ? normalizeText(englishEffect.short_effect)
          : null,
        effect: englishEffect?.effect ? normalizeText(englishEffect.effect) : null,
        generation: formatLabel(response.generation.name)
      };
    } catch {
      return {
        name: formatLabel(entry.ability.name),
        slot: entry.slot,
        isHidden: entry.is_hidden,
        shortEffect: null,
        effect: null,
        generation: null
      };
    }
  });
}

async function fetchTypeEffectiveness(
  types: PokeApiPokemonResponse["types"]
): Promise<PokemonTypeEffectiveness> {
  if (types.length === 0) {
    return createTypeEffectiveness();
  }

  const typeResponses = await mapWithConcurrency(types, 2, async (entry) => {
    try {
      return await requestJson<PokeApiTypeResponse>(entry.type.url, {
        revalidate: REVALIDATE_REFERENCE_SECONDS,
        tags: [`pokemon-type-${entry.type.name}`]
      });
    } catch {
      return null;
    }
  });

  const validResponses = typeResponses.filter(isDefined);
  if (validResponses.length === 0) {
    return createTypeEffectiveness();
  }

  const effectiveness = createTypeEffectiveness();

  ALL_TYPE_NAMES.forEach((defenderType) => {
    let multiplier = 1;

    validResponses.forEach((response) => {
      const relations = response.damage_relations;
      if (relations.no_damage_from.some((entry) => entry.name === defenderType)) {
        multiplier = 0;
        return;
      }
      if (relations.double_damage_from.some((entry) => entry.name === defenderType)) {
        multiplier *= 2;
      }
      if (relations.half_damage_from.some((entry) => entry.name === defenderType)) {
        multiplier *= 0.5;
      }
    });

    const label = formatLabel(defenderType);
    if (multiplier === 0) {
      effectiveness.immune.push(label);
      return;
    }
    if (multiplier >= 4) {
      effectiveness.fourTimesWeak.push(label);
      return;
    }
    if (multiplier > 1) {
      effectiveness.doubleWeak.push(label);
      return;
    }
    if (multiplier <= 0.25) {
      effectiveness.quarterResistant.push(label);
      return;
    }
    if (multiplier < 1) {
      effectiveness.halfResistant.push(label);
      return;
    }
    effectiveness.neutral.push(label);
  });

  return effectiveness;
}

async function fetchPokemonEncounters(
  endpoint: string
): Promise<PokemonEncounterInfo[]> {
  if (!endpoint) {
    return [];
  }

  try {
    const data = await requestJson<PokeApiEncounterResponse[]>(endpoint, {
      revalidate: REVALIDATE_REFERENCE_SECONDS,
      tags: ["pokemon-encounters"]
    });

    return data
      .map((entry) => ({
        area: formatLabel(entry.location_area.name),
        versions: uniqueSorted(
          entry.version_details.map((detail) => formatLabel(detail.version.name))
        )
      }))
      .sort((a, b) => a.area.localeCompare(b.area))
      .slice(0, 32);
  } catch {
    return [];
  }
}

async function fetchPokemonEntity(identifier: string | number) {
  return requestJson<PokeApiPokemonResponse>(`/pokemon/${String(identifier).toLowerCase()}`, {
    tags: [`pokemon-${identifier}`]
  });
}

async function fetchItemCategoryEntity(identifier: string) {
  return requestJson<PokeApiItemCategoryResponse>(
    `/item-category/${String(identifier).toLowerCase()}`,
    {
      revalidate: REVALIDATE_REFERENCE_SECONDS,
      tags: [`pokemon-item-category-${identifier}`]
    }
  );
}

function mapItemCategoryEntryToIndexItem(
  category: Pick<PokeApiItemCategoryResponse, "name" | "pocket">,
  itemResource: NamedApiResource
): PokemonItemIndexEntry {
  return {
    id: extractIdFromUrl(itemResource.url),
    name: itemResource.name,
    displayName: formatLabel(itemResource.name),
    spriteHdUrl: buildItemSpriteHdUrl(itemResource.name),
    spriteUrl: buildItemSpriteUrl(itemResource.name),
    category: formatLabel(category.name),
    categoryKey: category.name,
    pocket: formatLabel(category.pocket.name),
    pocketKey: category.pocket.name
  };
}

export function isPokemonNotFoundError(error: unknown) {
  return error instanceof PokemonApiError && error.status === 404;
}

export const fetchPokemonSummary = cache(async (identifier: string | number) => {
  const pokemon = await fetchPokemonEntity(identifier);
  return mapPokemonToListEntry(pokemon);
});

export const fetchPokemonGenerationPage = cache(
  async (
    generationKey: GenerationKey,
    page: number,
    pageSize = GENERATION_PAGE_SIZE
  ): Promise<PokemonGenerationPage> => {
    const generation = getGenerationByKey(generationKey);
    const safePage = Math.max(page, 0);
    const startId = generation.startId + safePage * pageSize;

    if (startId > generation.endId) {
      return {
        generation,
        page: safePage,
        pageSize,
        hasMore: false,
        results: []
      };
    }

    const limit = Math.min(pageSize, generation.endId - startId + 1);
    const ids = Array.from({ length: limit }, (_, index) => startId + index);

    const results = await mapWithConcurrency(ids, 8, async (id) => {
      try {
        return await fetchPokemonSummary(id);
      } catch {
        return null;
      }
    });

    return {
      generation,
      page: safePage,
      pageSize,
      hasMore: startId + limit - 1 < generation.endId,
      results: results.filter(isDefined)
    };
  }
);

export const fetchPokemonData = cache(
  async (identifier: string | number): Promise<PokemonDetail> => {
    const pokemon = await fetchPokemonEntity(identifier);

    const speciesPromise = requestJson<PokeApiPokemonSpeciesResponse>(pokemon.species.url, {
      tags: [`pokemon-species-${pokemon.id}`]
    });
    const abilityDetailsPromise = fetchAbilityDetails(pokemon.abilities);
    const typeEffectivenessPromise = fetchTypeEffectiveness(pokemon.types);
    const encountersPromise = fetchPokemonEncounters(pokemon.location_area_encounters);

    const species = await speciesPromise;

    let evolutionChain: PokemonEvolutionChain = { stages: [] };
    try {
      const chainResponse = await requestJson<PokeApiEvolutionChainResponse>(
        species.evolution_chain.url,
        { tags: [`pokemon-evolution-${pokemon.id}`] }
      );
      evolutionChain = parseEvolutionChain(chainResponse.chain);
    } catch {
      evolutionChain = { stages: [] };
    }

    const [abilities, typeEffectiveness, encounters] = await Promise.all([
      abilityDetailsPromise,
      typeEffectivenessPromise,
      encountersPromise
    ]);

    const generation = getGenerationByPokemonId(pokemon.id);
    const flavorEntries = parseFlavorEntries(species.flavor_text_entries);
    const englishDescription =
      flavorEntries[0]?.text ?? "No description available.";
    const englishGenus =
      species.genera.find((entry) => entry.language.name === "en")?.genus ??
      "Unknown species";

    const stats = pokemon.stats.map((entry) => ({
      name: formatLabel(entry.stat.name),
      baseStat: entry.base_stat,
      effort: entry.effort
    }));
    const baseStatTotal = stats.reduce((total, stat) => total + stat.baseStat, 0);

    const evYield = stats
      .filter((stat) => stat.effort > 0)
      .map((stat) => ({
        stat: stat.name,
        value: stat.effort
      }));

    const { allMoves, visibleMoves } = parseMoves(pokemon.moves);

    return {
      id: pokemon.id,
      name: formatLabel(pokemon.name),
      speciesName: formatLabel(pokemon.species.name),
      description: englishDescription,
      flavorEntries,
      genus: normalizeText(englishGenus),
      generation: `${generation.label} (${generation.region})`,
      generationKey: generation.key,
      habitat: formatResourceName(species.habitat?.name),
      color: formatResourceName(species.color?.name),
      shape: formatResourceName(species.shape?.name),
      evolvesFrom: formatResourceName(species.evolves_from_species?.name),
      isBaby: species.is_baby,
      isLegendary: species.is_legendary,
      isMythical: species.is_mythical,
      hasGenderDifferences: species.has_gender_differences,
      forms: pokemon.forms.map((entry) => formatLabel(entry.name)),
      varieties: parseVarieties(species.varieties),
      names: parseNames(species.names),
      pokedexNumbers: parsePokedexNumbers(species.pokedex_numbers),
      gameIndices: parseGameIndices(pokemon.game_indices),
      height: pokemon.height / 10,
      weight: pokemon.weight / 10,
      baseExperience: pokemon.base_experience,
      captureRate: species.capture_rate,
      baseHappiness: species.base_happiness,
      hatchCounter: species.hatch_counter,
      genderRate: species.gender_rate,
      eggGroups: species.egg_groups.map((entry) => formatLabel(entry.name)),
      growthRate: formatResourceName(species.growth_rate?.name),
      evYield,
      types: pokemon.types
        .slice()
        .sort((a, b) => a.slot - b.slot)
        .map((entry) => formatLabel(entry.type.name)),
      typeEffectiveness,
      abilities,
      moves: visibleMoves,
      movesCount: allMoves.length,
      heldItems: parseHeldItems(pokemon.held_items),
      encounters,
      stats,
      baseStatTotal,
      sprites: {
        officialArtwork:
          pokemon.sprites.other?.["official-artwork"]?.front_default ??
          buildOfficialArtworkUrl(pokemon.id),
        officialArtworkShiny:
          pokemon.sprites.other?.["official-artwork"]?.front_shiny ?? null,
        home: pokemon.sprites.other?.home?.front_default ?? null,
        homeShiny: pokemon.sprites.other?.home?.front_shiny ?? null,
        frontDefault: pokemon.sprites.front_default,
        frontShiny: pokemon.sprites.front_shiny ?? null
      },
      spriteGallery: buildSpriteGallery(pokemon.sprites),
      cryUrl: pokemon.cries.latest ?? pokemon.cries.legacy ?? null,
      evolutionChain
    };
  }
);

export const fetchPokemonIndex = cache(async (limit = 151): Promise<PokemonListEntry[]> => {
  const safeLimit = Math.min(Math.max(limit, 1), 1025);
  const ids = Array.from({ length: safeLimit }, (_, index) => index + 1);

  const entries = await mapWithConcurrency(ids, 10, async (id) => {
    try {
      return await fetchPokemonSummary(id);
    } catch {
      return null;
    }
  });

  return entries.filter(isDefined).sort((a, b) => a.id - b.id);
});

export const fetchPokemonSearchIndex = cache(
  async (): Promise<PokemonSearchIndexEntry[]> => {
    const list = await requestJson<PokeApiListResponse>("/pokemon?offset=0&limit=1025", {
      revalidate: REVALIDATE_INDEX_SECONDS,
      tags: ["pokemon-search-index"]
    });

    return list.results
      .map((entry) => {
        const id = extractIdFromUrl(entry.url);
        const generation = getGenerationByPokemonId(id);
        return {
          id,
          name: entry.name,
          displayName: formatLabel(entry.name),
          generation: `${generation.label} (${generation.region})`,
          generationKey: generation.key
        };
      })
      .sort((a, b) => a.id - b.id);
  }
);

export const fetchPokemonItemIndex = cache(
  async (): Promise<PokemonItemIndexEntry[]> => {
    const categoryList = await requestJson<PokeApiListResponse>(
      "/item-category?offset=0&limit=128",
      {
        revalidate: REVALIDATE_INDEX_SECONDS,
        tags: ["pokemon-item-index"]
      }
    );

    const categories = await mapWithConcurrency(
      categoryList.results,
      4,
      async (entry) => {
        try {
          return await requestJson<PokeApiItemCategoryResponse>(entry.url, {
            revalidate: REVALIDATE_REFERENCE_SECONDS,
            tags: [`pokemon-item-category-${entry.name}`]
          });
        } catch {
          return null;
        }
      }
    );

    const dedupedItems = new Map<number, PokemonItemIndexEntry>();

    categories.filter(isDefined).forEach((category) => {
      category.items.forEach((itemResource) => {
        try {
          const item = mapItemCategoryEntryToIndexItem(category, itemResource);
          if (!dedupedItems.has(item.id)) {
            dedupedItems.set(item.id, item);
          }
        } catch {
          // Ignore malformed item URLs from third-party mirrors.
        }
      });
    });

    return Array.from(dedupedItems.values()).sort((a, b) => a.id - b.id);
  }
);

export const fetchPokemonItemDetail = cache(
  async (identifier: string | number): Promise<PokemonItemDetail> => {
    const item = await requestJson<PokeApiItemResponse>(
      `/item/${String(identifier).toLowerCase()}`,
      {
        revalidate: REVALIDATE_REFERENCE_SECONDS,
        tags: [`pokemon-item-${identifier}`]
      }
    );

    const category = await fetchItemCategoryEntity(item.category.name);

    const englishName =
      item.names.find((entry) => entry.language.name === "en")?.name ??
      formatLabel(item.name);
    const englishEffectEntry = item.effect_entries.find(
      (entry) => entry.language.name === "en"
    );
    const englishFlavorText =
      item.flavor_text_entries.find((entry) => entry.language.name === "en")?.text ??
      null;
    const availabilityGenerations = uniqueSorted(
      item.game_indices.map((entry) => formatLabel(entry.generation.name))
    );
    const availabilityVersions = uniqueSorted(
      item.held_by_pokemon.flatMap((entry) =>
        entry.version_details.map((detail) => formatLabel(detail.version.name))
      )
    );
    const heldByPokemon = item.held_by_pokemon
      .map((entry) => ({
        name: formatLabel(entry.pokemon.name),
        rarity:
          entry.version_details.length > 0
            ? Math.max(...entry.version_details.map((detail) => detail.rarity))
            : null,
        versions: uniqueSorted(
          entry.version_details.map((detail) => formatLabel(detail.version.name))
        )
      }))
      .sort((a, b) => {
        const rarityA = a.rarity ?? -1;
        const rarityB = b.rarity ?? -1;
        if (rarityA !== rarityB) {
          return rarityB - rarityA;
        }
        return a.name.localeCompare(b.name);
      })
      .slice(0, 10);
    const machineVersionGroups = uniqueSorted(
      item.machines.map((machine) => formatLabel(machine.version_group.name))
    );

    return {
      id: item.id,
      name: item.name,
      displayName: englishName,
      category: formatLabel(item.category.name),
      categoryKey: item.category.name,
      pocket: formatLabel(category.pocket.name),
      pocketKey: category.pocket.name,
      cost: item.cost,
      flingPower: item.fling_power,
      flingEffect: item.fling_effect?.name ? formatLabel(item.fling_effect.name) : null,
      attributes: item.attributes
        .map((entry) => formatLabel(entry.name))
        .sort((a, b) => a.localeCompare(b)),
      shortEffect: englishEffectEntry?.short_effect
        ? normalizeText(englishEffectEntry.short_effect)
        : null,
      effect: englishEffectEntry?.effect ? normalizeText(englishEffectEntry.effect) : null,
      flavorText: englishFlavorText ? normalizeText(englishFlavorText) : null,
      availabilityGenerations,
      availabilityVersions,
      heldByPokemon,
      machineVersionGroups,
      spriteHdUrl: buildItemSpriteHdUrl(item.name),
      spriteUrl: item.sprites.default ?? null
    };
  }
);

export const fetchPokemonMoveIndex = cache(
  async (): Promise<PokemonMoveIndexEntry[]> => {
    const list = await requestJson<PokeApiListResponse>("/move?offset=0&limit=2000", {
      revalidate: REVALIDATE_INDEX_SECONDS,
      tags: ["pokemon-move-index"]
    });

    return list.results
      .map((entry) => ({
        id: extractIdFromUrl(entry.url),
        name: entry.name,
        displayName: formatLabel(entry.name)
      }))
      .sort((a, b) => a.id - b.id);
  }
);

export const fetchPokemonMoveDetail = cache(
  async (identifier: string | number): Promise<PokemonMoveDetail> => {
    const move = await requestJson<PokeApiMoveDetailResponse>(
      `/move/${String(identifier).toLowerCase()}`,
      {
        revalidate: REVALIDATE_REFERENCE_SECONDS,
        tags: [`pokemon-move-${identifier}`]
      }
    );

    const englishEffect = move.effect_entries.find((entry) => entry.language.name === "en");
    const englishFlavor = move.flavor_text_entries.find(
      (entry) => entry.language.name === "en"
    );

    return {
      id: move.id,
      name: move.name,
      displayName: formatLabel(move.name),
      generation: formatResourceName(move.generation?.name),
      type: formatResourceName(move.type?.name),
      damageClass: formatResourceName(move.damage_class?.name),
      power: move.power,
      accuracy: move.accuracy,
      pp: move.pp,
      priority: move.priority,
      target: formatResourceName(move.target?.name),
      effectChance: move.effect_chance,
      shortEffect: englishEffect?.short_effect ? normalizeText(englishEffect.short_effect) : null,
      effect: englishEffect?.effect ? normalizeText(englishEffect.effect) : null,
      flavorText: englishFlavor?.flavor_text ? normalizeText(englishFlavor.flavor_text) : null,
      learnedByPokemonCount: move.learned_by_pokemon.length,
      learnedByPokemon: uniqueSorted(
        move.learned_by_pokemon.map((entry) => formatLabel(entry.name))
      ).slice(0, 36)
    };
  }
);

export const fetchPokemonAbilityIndex = cache(
  async (): Promise<PokemonAbilityIndexEntry[]> => {
    const list = await requestJson<PokeApiListResponse>("/ability?offset=0&limit=600", {
      revalidate: REVALIDATE_INDEX_SECONDS,
      tags: ["pokemon-ability-index"]
    });

    const entries = list.results
      .map((entry) => ({
        id: extractIdFromUrl(entry.url),
        name: entry.name,
        displayName: formatLabel(entry.name),
        isMainSeries: extractIdFromUrl(entry.url) <= 500
      }))
      .filter((entry) => entry.id <= 10_000)
      .sort((a, b) => a.id - b.id);

    // Keep only main PokeAPI abilities range to avoid odd placeholders.
    return entries.filter((entry) => entry.id <= 500);
  }
);

export const fetchPokemonAbilityDetail = cache(
  async (identifier: string | number): Promise<PokemonAbilityDetail> => {
    const ability = await requestJson<PokeApiAbilityDetailResponse>(
      `/ability/${String(identifier).toLowerCase()}`,
      {
        revalidate: REVALIDATE_REFERENCE_SECONDS,
        tags: [`pokemon-ability-${identifier}`]
      }
    );

    const englishEffect = ability.effect_entries.find((entry) => entry.language.name === "en");
    const englishFlavor = ability.flavor_text_entries.find(
      (entry) => entry.language.name === "en"
    );
    const pokemonSample = ability.pokemon
      .map((entry) => ({
        name: formatLabel(entry.pokemon.name),
        isHidden: entry.is_hidden,
        slot: entry.slot
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 36);

    return {
      id: ability.id,
      name: ability.name,
      displayName: formatLabel(ability.name),
      generation: formatResourceName(ability.generation.name),
      isMainSeries: ability.is_main_series,
      shortEffect: englishEffect?.short_effect ? normalizeText(englishEffect.short_effect) : null,
      effect: englishEffect?.effect ? normalizeText(englishEffect.effect) : null,
      flavorText: englishFlavor?.flavor_text ? normalizeText(englishFlavor.flavor_text) : null,
      pokemonCount: ability.pokemon.length,
      pokemonSample
    };
  }
);

export const fetchPokemonTypeIndex = cache(
  async (): Promise<PokemonTypeIndexEntry[]> => {
    const typeDetails = await mapWithConcurrency(Array.from(ALL_TYPE_NAMES), 4, async (name) => {
      return requestJson<PokeApiTypeDetailResponse>(`/type/${name}`, {
        revalidate: REVALIDATE_REFERENCE_SECONDS,
        tags: [`pokemon-type-${name}`]
      });
    });

    return typeDetails
      .map((type) => ({
        id: type.id,
        name: type.name,
        displayName: formatLabel(type.name)
      }))
      .sort((a, b) => a.id - b.id);
  }
);

export const fetchPokemonTypeDetail = cache(
  async (identifier: string | number): Promise<PokemonTypeDetail> => {
    const type = await requestJson<PokeApiTypeDetailResponse>(
      `/type/${String(identifier).toLowerCase()}`,
      {
        revalidate: REVALIDATE_REFERENCE_SECONDS,
        tags: [`pokemon-type-${identifier}`]
      }
    );

    return {
      id: type.id,
      name: type.name,
      displayName: formatLabel(type.name),
      generation: formatResourceName(type.generation.name),
      doubleDamageTo: mapNamedResources(type.damage_relations.double_damage_to),
      halfDamageTo: mapNamedResources(type.damage_relations.half_damage_to),
      noDamageTo: mapNamedResources(type.damage_relations.no_damage_to),
      doubleDamageFrom: mapNamedResources(type.damage_relations.double_damage_from),
      halfDamageFrom: mapNamedResources(type.damage_relations.half_damage_from),
      noDamageFrom: mapNamedResources(type.damage_relations.no_damage_from),
      moveCount: type.moves.length,
      sampleMoves: uniqueSorted(type.moves.map((entry) => formatLabel(entry.name))).slice(0, 36),
      pokemonCount: type.pokemon.length,
      samplePokemon: type.pokemon
        .map((entry) => ({
          name: formatLabel(entry.pokemon.name),
          slot: entry.slot
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 36)
    };
  }
);

export const POKEDEX_INDEX_LIMIT = 151;
