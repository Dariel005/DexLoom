import { cache } from "react";
import {
  type PokemonCardAttackEntry,
  type PokemonCardDetail,
  type PokemonCardIndexEntry,
  type PokemonCardPriceSnapshot,
  type PokemonCardWeaknessEntry
} from "@/types/encyclopedia";
import tcgCardsFallbackCatalog from "@/data/tcg-cards-fallback.json";

const POKEMON_TCG_BASE_URL = "https://api.pokemontcg.io/v2";
const TCGDEX_BASE_URL = "https://api.tcgdex.net/v2/en";
const REQUEST_TIMEOUT_MS = 12_000;
const REVALIDATE_INDEX_SECONDS = 60 * 30;
const REVALIDATE_DETAIL_SECONDS = 60 * 60;
const FALLBACK_RELEASE_DATE = "2024-01-01";
const TCGDEX_GLOBAL_CATALOG_SERIES = "TCGdex Global Catalog";
const CATALOG_PAGE_SIZE = 120;
const CATALOG_MAX_PAGES = 4;
const CATALOG_TARGET_SIZE = 320;
const CATALOG_MIN_PRICE_ENTRIES = 24;
const POKEMON_TCG_INDEX_PAGE_SIZE = 250;
const POKEMON_TCG_INDEX_MAX_PAGES = 24;
const POKEMON_TCG_INDEX_MIN_COUNT = 120;
const POKEMON_TCG_INDEX_SELECT_FIELDS = [
  "id",
  "name",
  "supertype",
  "subtypes",
  "hp",
  "types",
  "evolvesFrom",
  "number",
  "artist",
  "rarity",
  "regulationMark",
  "nationalPokedexNumbers",
  "images.small",
  "images.large",
  "set.name",
  "set.series",
  "set.releaseDate"
].join(",");
const TCGDEX_FALLBACK_SET_COUNT = 1;
const TCGDEX_FALLBACK_CARDS_PER_SET = 48;
const TCGDEX_FALLBACK_BATCH_SIZE = 8;
const TCGDEX_CARD_LIST_PAGE_SIZE = 1000;
const TCGDEX_CARD_LIST_MAX_PAGES = 24;
const TCGDEX_CARD_LIST_TARGET_COUNT = 0;
const TCGDEX_TYPE_QUERY_MAX_PAGES = 20;
const CARD_INDEX_RUNTIME_CACHE_TTL_MS = 1000 * 60 * 20;
const FALLBACK_CARD_TYPES = [
  "Colorless",
  "Darkness",
  "Dragon",
  "Fairy",
  "Fighting",
  "Fire",
  "Grass",
  "Lightning",
  "Metal",
  "Psychic",
  "Water"
] as const;

interface PokemonTcgRequestOptions {
  revalidate: number;
}

interface TcgDexCardListQueryOptions {
  maxPages?: number;
  targetCount?: number;
  allowPartialOnError?: boolean;
}

type PokemonTcgplayerPrice = {
  low?: number | string;
  mid?: number | string;
  high?: number | string;
  market?: number | string;
  directLow?: number | string;
};

type PokemonTcgplayerPriceMap = Record<string, PokemonTcgplayerPrice>;

interface PokemonTcgApiCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  evolvesFrom?: string;
  rules?: string[];
  attacks?: Array<{
    name: string;
    cost?: string[];
    convertedEnergyCost?: number;
    damage?: string;
    text?: string;
  }>;
  abilities?: Array<{
    name: string;
    text: string;
    type?: string;
  }>;
  weaknesses?: Array<{
    type: string;
    value: string;
  }>;
  resistances?: Array<{
    type: string;
    value: string;
  }>;
  retreatCost?: string[];
  convertedRetreatCost?: number;
  number: string;
  artist?: string;
  rarity?: string;
  flavorText?: string;
  regulationMark?: string;
  nationalPokedexNumbers?: number[];
  legalities?: {
    unlimited?: string;
    expanded?: string;
    standard?: string;
  };
  images?: {
    small?: string;
    large?: string;
  };
  set?: {
    id?: string;
    name?: string;
    series?: string;
    releaseDate?: string;
    printedTotal?: number;
    total?: number;
    images?: {
      symbol?: string;
      logo?: string;
    };
  };
  tcgplayer?: {
    url?: string;
    updatedAt?: string;
    prices?: PokemonTcgplayerPriceMap;
  };
  cardmarket?: {
    url?: string;
    updatedAt?: string;
    prices?: {
      averageSellPrice?: number | string;
      lowPrice?: number | string;
      trendPrice?: number | string;
      suggestedPrice?: number | string;
      lowPriceExPlus?: number | string;
      reverseHoloSell?: number | string;
      reverseHoloLow?: number | string;
      reverseHoloTrend?: number | string;
      avg1?: number | string;
      avg7?: number | string;
      avg30?: number | string;
      reverseHoloAvg1?: number | string;
      reverseHoloAvg7?: number | string;
      reverseHoloAvg30?: number | string;
      [key: string]: number | string | undefined;
    };
  };
}

interface PokemonTcgListResponse {
  data: PokemonTcgApiCard[];
  count?: number;
  totalCount?: number;
  page?: number;
  pageSize?: number;
}

interface PokemonTcgDetailResponse {
  data: PokemonTcgApiCard;
}

interface TcgDexSetListEntry {
  id: string;
  name: string;
  releaseDate?: string;
  serie?: {
    name?: string;
  };
  logo?: string;
  symbol?: string;
  cardCount?: {
    official?: number;
    total?: number;
  };
}

interface TcgDexCardListEntry {
  id: string;
  localId?: string;
  name: string;
  image?: string;
}

interface TcgDexSetDetail {
  id: string;
  name: string;
  releaseDate?: string;
  serie?: {
    name?: string;
  };
  logo?: string;
  symbol?: string;
  cardCount?: {
    official?: number;
    total?: number;
  };
  cards?: Array<{
    id: string;
    localId?: string;
    name?: string;
    image?: string;
  }>;
}

type TcgDexTcgplayerVariantPrice = {
  lowPrice?: number | string;
  midPrice?: number | string;
  highPrice?: number | string;
  marketPrice?: number | string;
  directLowPrice?: number | string;
};

interface TcgDexCardPricing {
  tcgplayer?: {
    updated?: string;
    unit?: string;
    [variant: string]: TcgDexTcgplayerVariantPrice | string | undefined;
  };
  cardmarket?: {
    updated?: string;
    avg?: number | string;
    low?: number | string;
    trend?: number | string;
    avg1?: number | string;
    avg7?: number | string;
    avg30?: number | string;
    "avg-holo"?: number | string;
    "low-holo"?: number | string;
    "trend-holo"?: number | string;
    "avg1-holo"?: number | string;
    "avg7-holo"?: number | string;
    "avg30-holo"?: number | string;
  };
}

interface TcgDexCardDetail {
  id: string;
  localId?: string;
  name: string;
  category?: string;
  image?: string;
  illustrator?: string;
  rarity?: string;
  set?: {
    id?: string;
    name?: string;
    logo?: string;
    symbol?: string;
    cardCount?: {
      official?: number;
      total?: number;
    };
  };
  variants?: {
    firstEdition?: boolean;
    holo?: boolean;
    normal?: boolean;
    reverse?: boolean;
    wPromo?: boolean;
  };
  variants_detailed?: Record<string, unknown>;
  dexId?: number[] | number;
  hp?: number | string;
  types?: string[];
  stage?: string;
  suffix?: string;
  evolveFrom?: string;
  attacks?: Array<{
    cost?: string[];
    name: string;
    damage?: string;
    effect?: string;
  }>;
  abilities?: Array<{
    type?: string;
    name: string;
    effect?: string;
  }>;
  weaknesses?: Array<{
    type?: string;
    value?: string;
  }>;
  resistances?: Array<{
    type?: string;
    value?: string;
  }>;
  retreat?: number;
  regulationMark?: string;
  legal?: {
    standard?: boolean;
    expanded?: boolean;
  };
  updated?: string;
  description?: string;
  effect?: string;
  pricing?: TcgDexCardPricing;
}

interface TcgDexSetMeta {
  setName: string;
  releaseDate: string | null;
  seriesName: string | null;
  setLogoUrl: string | null;
  setSymbolUrl: string | null;
  setPrintedTotal: number | null;
  setTotal: number | null;
}

interface FallbackCardSeed {
  id: string;
  dex: number;
  name: string;
  type: string;
  hp: number;
  rarity: string;
  stage: string;
  evolvesFrom?: string;
  setName: string;
  setSeries: string;
  releaseDate: string;
  number: string;
  artist: string;
  flavorText: string;
  attacks: Array<{
    name: string;
    damage: string;
    text: string;
    cost?: string[];
  }>;
  ability?: {
    name: string;
    type?: string;
    text: string;
  };
  weaknesses?: PokemonCardWeaknessEntry[];
  resistances?: PokemonCardWeaknessEntry[];
}

export class PokemonCardApiError extends Error {
  endpoint: string;
  status?: number;

  constructor(message: string, endpoint: string, status?: number, cause?: unknown) {
    super(message, cause ? { cause } : undefined);
    this.name = "PokemonCardApiError";
    this.endpoint = endpoint;
    this.status = status;
  }
}

function normalizeText(value: string) {
  return value.replace(/[\f\n\r]+/g, " ").replace(/\s+/g, " ").trim();
}

function toNullableNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value.replace(/[^\d]/g, ""), 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function toMarketNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^0-9.]+/g, ""));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

function pickFirstMarketNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = toMarketNumber(value);
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
}

function toHttpsUrl(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("http")) {
    return null;
  }

  return trimmed;
}

function toTcgDexCardImageUrl(base: string | undefined, quality: "low" | "high"): string | null {
  const safeBase = toHttpsUrl(base);
  if (!safeBase) {
    return null;
  }
  return `${safeBase}/${quality}.webp`;
}

function toTcgDexSetAssetUrl(base: string | undefined): string | null {
  const safeBase = toHttpsUrl(base);
  if (!safeBase) {
    return null;
  }

  if (/\.(png|jpe?g|webp|svg)$/i.test(safeBase)) {
    return safeBase;
  }

  return `${safeBase}.png`;
}

function buildArtworkUrl(dex: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dex}.png`;
}

function buildSpriteUrl(dex: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dex}.png`;
}

function toLegalityLabel(value: string | undefined) {
  if (!value) {
    return null;
  }
  return normalizeText(value);
}

function toSafeArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function pickTcgplayerPrice(prices: PokemonTcgplayerPriceMap | undefined): PokemonTcgplayerPrice | null {
  if (!prices) {
    return null;
  }

  const priority = [
    "holofoil",
    "normal",
    "reverseHolofoil",
    "1stEditionHolofoil",
    "1stEditionNormal",
    "unlimitedHolofoil",
    "unlimitedNormal"
  ];

  for (const key of priority) {
    const price = prices[key];
    if (price) {
      return price;
    }
  }

  const fallback = Object.values(prices).find((entry) => entry);
  return fallback ?? null;
}

function mapPriceSnapshots(card: PokemonTcgApiCard): PokemonCardPriceSnapshot[] {
  const snapshots: PokemonCardPriceSnapshot[] = [];
  const tcgplayerPrice = pickTcgplayerPrice(card.tcgplayer?.prices);

  if (tcgplayerPrice) {
    snapshots.push({
      market: "tcgplayer",
      low: pickFirstMarketNumber(tcgplayerPrice.low, tcgplayerPrice.directLow),
      mid: pickFirstMarketNumber(tcgplayerPrice.mid, tcgplayerPrice.market),
      high: pickFirstMarketNumber(tcgplayerPrice.high),
      trend: pickFirstMarketNumber(tcgplayerPrice.market, tcgplayerPrice.mid),
      averageSell: pickFirstMarketNumber(tcgplayerPrice.market, tcgplayerPrice.mid)
    });
  }

  const cardMarketPrice = card.cardmarket?.prices;
  if (cardMarketPrice) {
    snapshots.push({
      market: "cardmarket",
      low: pickFirstMarketNumber(
        cardMarketPrice.lowPrice,
        cardMarketPrice.lowPriceExPlus,
        cardMarketPrice.reverseHoloLow
      ),
      mid: pickFirstMarketNumber(
        cardMarketPrice.averageSellPrice,
        cardMarketPrice.avg30,
        cardMarketPrice.avg7,
        cardMarketPrice.avg1,
        cardMarketPrice.reverseHoloAvg30,
        cardMarketPrice.reverseHoloAvg7,
        cardMarketPrice.reverseHoloAvg1,
        cardMarketPrice.trendPrice
      ),
      high: pickFirstMarketNumber(cardMarketPrice.suggestedPrice, cardMarketPrice.reverseHoloTrend),
      trend: pickFirstMarketNumber(cardMarketPrice.trendPrice, cardMarketPrice.avg30, cardMarketPrice.avg7),
      averageSell: pickFirstMarketNumber(
        cardMarketPrice.averageSellPrice,
        cardMarketPrice.avg30,
        cardMarketPrice.avg7,
        cardMarketPrice.avg1,
        cardMarketPrice.reverseHoloSell
      )
    });
  }

  return snapshots;
}

function resolvePrimaryMarketPrice(
  snapshots: PokemonCardPriceSnapshot[]
): {
  marketPrice: number | null;
  marketSource: "tcgplayer" | "cardmarket" | null;
} {
  for (const snapshot of snapshots) {
    const value = pickFirstMarketNumber(
      snapshot.mid,
      snapshot.trend,
      snapshot.averageSell,
      snapshot.low,
      snapshot.high
    );
    if (value !== null) {
      return {
        marketPrice: value,
        marketSource: snapshot.market
      };
    }
  }

  return {
    marketPrice: null,
    marketSource: null
  };
}

function resolveMarketUpdatedAt(card: PokemonTcgApiCard): string | null {
  const tcgDate = card.tcgplayer?.updatedAt;
  if (tcgDate && !Number.isNaN(Date.parse(tcgDate))) {
    return tcgDate;
  }

  const cardMarketDate = card.cardmarket?.updatedAt;
  if (cardMarketDate && !Number.isNaN(Date.parse(cardMarketDate))) {
    return cardMarketDate;
  }

  return null;
}

function isTcgDexTcgplayerVariantPrice(value: unknown): value is TcgDexTcgplayerVariantPrice {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as TcgDexTcgplayerVariantPrice;
  return (
    candidate.lowPrice !== undefined ||
    candidate.midPrice !== undefined ||
    candidate.highPrice !== undefined ||
    candidate.marketPrice !== undefined ||
    candidate.directLowPrice !== undefined
  );
}

function pickTcgDexTcgplayerVariant(
  pricing: TcgDexCardPricing["tcgplayer"]
): TcgDexTcgplayerVariantPrice | null {
  if (!pricing) {
    return null;
  }

  const variants: Array<readonly [string, TcgDexTcgplayerVariantPrice]> = Object.entries(pricing)
    .flatMap(([key, value]) =>
      isTcgDexTcgplayerVariantPrice(value)
        ? ([[key.toLowerCase(), value] as const] satisfies Array<readonly [string, TcgDexTcgplayerVariantPrice]>)
        : []
    );

  if (variants.length === 0) {
    return null;
  }

  const variantMap = new Map<string, TcgDexTcgplayerVariantPrice>(variants);
  const priority = [
    "holofoil",
    "normal",
    "reverseholofoil",
    "1steditionholofoil",
    "1steditionnormal",
    "unlimitedholofoil",
    "unlimitednormal"
  ];

  for (const key of priority) {
    const variant = variantMap.get(key);
    if (variant) {
      return variant;
    }
  }

  return variants[0][1];
}

function mapPriceSnapshotsFromTcgDex(card: TcgDexCardDetail): PokemonCardPriceSnapshot[] {
  const snapshots: PokemonCardPriceSnapshot[] = [];
  const tcgplayerVariant = pickTcgDexTcgplayerVariant(card.pricing?.tcgplayer);

  if (tcgplayerVariant) {
    snapshots.push({
      market: "tcgplayer",
      low: pickFirstMarketNumber(tcgplayerVariant.lowPrice, tcgplayerVariant.directLowPrice),
      mid: pickFirstMarketNumber(tcgplayerVariant.midPrice, tcgplayerVariant.marketPrice),
      high: pickFirstMarketNumber(tcgplayerVariant.highPrice),
      trend: pickFirstMarketNumber(tcgplayerVariant.marketPrice, tcgplayerVariant.midPrice),
      averageSell: pickFirstMarketNumber(tcgplayerVariant.marketPrice, tcgplayerVariant.midPrice)
    });
  }

  const cardmarket = card.pricing?.cardmarket;
  if (cardmarket) {
    snapshots.push({
      market: "cardmarket",
      low: pickFirstMarketNumber(cardmarket.low, cardmarket["low-holo"]),
      mid: pickFirstMarketNumber(
        cardmarket.avg30,
        cardmarket.avg7,
        cardmarket.avg1,
        cardmarket.avg,
        cardmarket["avg30-holo"],
        cardmarket["avg7-holo"],
        cardmarket["avg1-holo"],
        cardmarket["avg-holo"]
      ),
      high: pickFirstMarketNumber(cardmarket["trend-holo"], cardmarket.trend),
      trend: pickFirstMarketNumber(cardmarket.trend, cardmarket["trend-holo"]),
      averageSell: pickFirstMarketNumber(
        cardmarket.avg,
        cardmarket.avg30,
        cardmarket.avg7,
        cardmarket.avg1,
        cardmarket["avg-holo"]
      )
    });
  }

  return snapshots;
}

function resolveTcgDexMarketUpdatedAt(card: TcgDexCardDetail): string | null {
  const tcgDate = card.pricing?.tcgplayer?.updated;
  if (tcgDate && !Number.isNaN(Date.parse(tcgDate))) {
    return tcgDate;
  }

  const cardmarketDate = card.pricing?.cardmarket?.updated;
  if (cardmarketDate && !Number.isNaN(Date.parse(cardmarketDate))) {
    return cardmarketDate;
  }

  if (card.updated && !Number.isNaN(Date.parse(card.updated))) {
    return card.updated;
  }

  return null;
}

function toLegalityFromBoolean(value: boolean | undefined): string | null {
  if (value === true) {
    return "legal";
  }
  if (value === false) {
    return "not legal";
  }
  return null;
}

function toRetreatCost(retreat: number | undefined): string[] {
  if (typeof retreat !== "number" || !Number.isFinite(retreat) || retreat <= 0) {
    return [];
  }
  return Array.from({ length: Math.min(6, Math.max(0, Math.floor(retreat))) }, () => "Colorless");
}

function toDexNumbers(value: number[] | number | undefined): number[] {
  if (typeof value === "number" && Number.isFinite(value)) {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((entry) => Number.isFinite(entry));
  }

  return [];
}

function mapAttackEntries(card: PokemonTcgApiCard): PokemonCardAttackEntry[] {
  return toSafeArray(card.attacks)
    .map((attack) => ({
      name: normalizeText(attack.name || "Unknown attack"),
      cost: toSafeArray(attack.cost).map((cost) => normalizeText(cost)),
      damage: attack.damage ? normalizeText(attack.damage) : null,
      text: attack.text ? normalizeText(attack.text) : null,
      convertedEnergyCost:
        typeof attack.convertedEnergyCost === "number" ? attack.convertedEnergyCost : null
    }))
    .slice(0, 12);
}

function mapWeaknessEntries(
  entries: Array<{ type: string; value: string }> | undefined
): PokemonCardWeaknessEntry[] {
  return toSafeArray(entries)
    .map((entry) => ({
      type: normalizeText(entry.type),
      value: normalizeText(entry.value)
    }))
    .slice(0, 8);
}

function findPrimaryStage(card: PokemonTcgApiCard): string | null {
  const subtypes = toSafeArray(card.subtypes).map((entry) => normalizeText(entry));
  if (subtypes.length === 0) {
    return null;
  }

  const primary =
    subtypes.find((entry) => /basic|stage|mega|vstar|vmax|v-union|gx|ex/i.test(entry)) ??
    subtypes[0];
  return primary;
}

function mapCardToIndex(card: PokemonTcgApiCard): PokemonCardIndexEntry {
  const snapshots = mapPriceSnapshots(card);
  const { marketPrice, marketSource } = resolvePrimaryMarketPrice(snapshots);

  return {
    id: card.id,
    name: card.name,
    displayName: normalizeText(card.name),
    supertype: normalizeText(card.supertype || "Pokemon"),
    subtypes: toSafeArray(card.subtypes).map((entry) => normalizeText(entry)),
    hp: toNullableNumber(card.hp),
    types: toSafeArray(card.types).map((entry) => normalizeText(entry)),
    setName: normalizeText(card.set?.name || "Unknown Set"),
    setSeries: normalizeText(card.set?.series || "Unknown Series"),
    setReleaseDate: card.set?.releaseDate ?? null,
    rarity: card.rarity ? normalizeText(card.rarity) : null,
    artist: card.artist ? normalizeText(card.artist) : null,
    nationalPokedexNumbers: toSafeArray(card.nationalPokedexNumbers).filter((value) =>
      Number.isFinite(value)
    ),
    imageSmall: card.images?.small ?? null,
    imageLarge: card.images?.large ?? null,
    number: card.number || "000",
    regulationMark: card.regulationMark ? normalizeText(card.regulationMark) : null,
    stage: findPrimaryStage(card),
    evolvesFrom: card.evolvesFrom ? normalizeText(card.evolvesFrom) : null,
    attacksCount: toSafeArray(card.attacks).length,
    abilitiesCount: toSafeArray(card.abilities).length,
    rulesCount: toSafeArray(card.rules).length,
    marketPrice,
    marketSource
  };
}

function mapCardToDetail(card: PokemonTcgApiCard): PokemonCardDetail {
  const indexEntry = mapCardToIndex(card);
  const priceSnapshots = mapPriceSnapshots(card);

  return {
    ...indexEntry,
    flavorText: card.flavorText ? normalizeText(card.flavorText) : null,
    rules: toSafeArray(card.rules).map((rule) => normalizeText(rule)).slice(0, 12),
    abilityEntries: toSafeArray(card.abilities)
      .map((ability) => ({
        name: normalizeText(ability.name || "Unknown ability"),
        type: ability.type ? normalizeText(ability.type) : null,
        text: normalizeText(ability.text || "No effect text available.")
      }))
      .slice(0, 8),
    attackEntries: mapAttackEntries(card),
    weaknesses: mapWeaknessEntries(card.weaknesses),
    resistances: mapWeaknessEntries(card.resistances),
    retreatCost: toSafeArray(card.retreatCost).map((entry) => normalizeText(entry)),
    convertedRetreatCost:
      typeof card.convertedRetreatCost === "number" ? card.convertedRetreatCost : null,
    legalityStandard: toLegalityLabel(card.legalities?.standard),
    legalityExpanded: toLegalityLabel(card.legalities?.expanded),
    legalityUnlimited: toLegalityLabel(card.legalities?.unlimited),
    setPrintedTotal:
      typeof card.set?.printedTotal === "number" ? card.set.printedTotal : null,
    setTotal: typeof card.set?.total === "number" ? card.set.total : null,
    setSymbolUrl: card.set?.images?.symbol ?? null,
    setLogoUrl: card.set?.images?.logo ?? null,
    tcgplayerUrl: card.tcgplayer?.url ?? null,
    cardmarketUrl: card.cardmarket?.url ?? null,
    priceSnapshots,
    marketLastUpdatedAt: resolveMarketUpdatedAt(card)
  };
}

function buildFallbackCard(seed: FallbackCardSeed): PokemonCardDetail {
  const rules = seed.stage === "Basic" ? [] : [`Evolves from ${seed.evolvesFrom ?? "Unknown"}.`];
  const abilityEntries =
    seed.ability
      ? [
          {
            name: seed.ability.name,
            type: seed.ability.type ?? "Ability",
            text: seed.ability.text
          }
        ]
      : [];
  const attacks = seed.attacks.map((attack) => ({
    name: attack.name,
    cost: attack.cost ?? [seed.type, "Colorless"],
    damage: attack.damage,
    text: attack.text,
    convertedEnergyCost: (attack.cost ?? [seed.type, "Colorless"]).length
  }));
  const generatedLow = Math.max(1, Math.round(seed.hp * 0.12));
  const generatedMid = Math.max(2, Math.round(seed.hp * 0.2));
  const generatedHigh = Math.max(4, Math.round(seed.hp * 0.4));

  return {
    id: seed.id,
    name: seed.name,
    displayName: seed.name,
    supertype: "Pokemon",
    subtypes: [seed.stage],
    hp: seed.hp,
    types: [seed.type],
    setName: seed.setName,
    setSeries: seed.setSeries,
    setReleaseDate: seed.releaseDate,
    rarity: seed.rarity,
    artist: seed.artist,
    nationalPokedexNumbers: [seed.dex],
    imageSmall: buildSpriteUrl(seed.dex),
    imageLarge: buildArtworkUrl(seed.dex),
    number: seed.number,
    regulationMark: "PW",
    stage: seed.stage,
    evolvesFrom: seed.evolvesFrom ?? null,
    attacksCount: attacks.length,
    abilitiesCount: abilityEntries.length,
    rulesCount: rules.length,
    marketPrice: generatedMid,
    marketSource: "tcgplayer",
    flavorText: seed.flavorText,
    rules,
    abilityEntries,
    attackEntries: attacks,
    weaknesses: seed.weaknesses ?? [{ type: "Darkness", value: "x2" }],
    resistances: seed.resistances ?? [],
    retreatCost: ["Colorless", "Colorless"],
    convertedRetreatCost: 2,
    legalityStandard: "legal",
    legalityExpanded: "legal",
    legalityUnlimited: "legal",
    setPrintedTotal: 151,
    setTotal: 151,
    setSymbolUrl: null,
    setLogoUrl: null,
    tcgplayerUrl: null,
    cardmarketUrl: null,
    priceSnapshots: [
      {
        market: "tcgplayer",
        low: generatedLow,
        mid: generatedMid,
        high: generatedHigh,
        trend: generatedMid,
        averageSell: generatedMid
      }
    ],
    marketLastUpdatedAt: null
  };
}

const FALLBACK_CARD_SEEDS: FallbackCardSeed[] = [
  {
    id: "dex-0001",
    dex: 1,
    name: "Bulbasaur",
    type: "Grass",
    hp: 70,
    rarity: "Common",
    stage: "Basic",
    setName: "Kanto Starter Deck",
    setSeries: "Pokedex Wiki Originals",
    releaseDate: FALLBACK_RELEASE_DATE,
    number: "001",
    artist: "Pokedex Studio",
    flavorText:
      "A calm seed Pokemon card that stabilizes early turns with reliable setup pressure.",
    attacks: [
      {
        name: "Vine Tap",
        damage: "20",
        text: "Attach one Grass Energy from your discard pile to this Pokemon."
      }
    ],
    ability: {
      name: "Forest Signal",
      text: "Once during your turn, you may look at the top card of your deck."
    },
    weaknesses: [{ type: "Fire", value: "x2" }],
    resistances: [{ type: "Water", value: "-20" }]
  },
  {
    id: "dex-0004",
    dex: 4,
    name: "Charmander",
    type: "Fire",
    hp: 70,
    rarity: "Common",
    stage: "Basic",
    setName: "Kanto Starter Deck",
    setSeries: "Pokedex Wiki Originals",
    releaseDate: FALLBACK_RELEASE_DATE,
    number: "004",
    artist: "Pokedex Studio",
    flavorText:
      "This card applies chip damage every turn and scales well with aggressive decks.",
    attacks: [
      {
        name: "Ember Jab",
        damage: "30",
        text: "Discard 1 Fire Energy from this Pokemon."
      }
    ],
    weaknesses: [{ type: "Water", value: "x2" }],
    resistances: [{ type: "Grass", value: "-20" }]
  },
  {
    id: "dex-0007",
    dex: 7,
    name: "Squirtle",
    type: "Water",
    hp: 70,
    rarity: "Common",
    stage: "Basic",
    setName: "Kanto Starter Deck",
    setSeries: "Pokedex Wiki Originals",
    releaseDate: FALLBACK_RELEASE_DATE,
    number: "007",
    artist: "Pokedex Studio",
    flavorText:
      "A control-focused opener that rewards energy management and tempo defense.",
    attacks: [
      {
        name: "Bubble Guard",
        damage: "20",
        text: "During your opponent next turn, this Pokemon takes 20 less damage."
      }
    ],
    weaknesses: [{ type: "Lightning", value: "x2" }],
    resistances: [{ type: "Fire", value: "-20" }]
  },
  {
    id: "dex-0025",
    dex: 25,
    name: "Pikachu",
    type: "Lightning",
    hp: 80,
    rarity: "Uncommon",
    stage: "Basic",
    setName: "Voltage Arena",
    setSeries: "Pokedex Wiki Originals",
    releaseDate: "2024-03-18",
    number: "025",
    artist: "Pokedex Studio",
    flavorText:
      "Fast-cycle electric attacker built for quick knockouts and momentum swings.",
    attacks: [
      {
        name: "Quick Spark",
        damage: "40",
        text: "Flip a coin. If heads, this attack does 20 more damage."
      }
    ],
    ability: {
      name: "Charge Burst",
      text: "When you play this Pokemon from your hand, draw 1 card."
    },
    weaknesses: [{ type: "Fighting", value: "x2" }]
  },
  {
    id: "dex-0133",
    dex: 133,
    name: "Eevee",
    type: "Colorless",
    hp: 70,
    rarity: "Common",
    stage: "Basic",
    setName: "Evolution Circuit",
    setSeries: "Pokedex Wiki Originals",
    releaseDate: "2024-04-05",
    number: "133",
    artist: "Pokedex Studio",
    flavorText:
      "Flexible support card that can pivot into multiple strategy lines mid-game.",
    attacks: [
      {
        name: "Adaptive Tail",
        damage: "20",
        text: "Search your deck for an Evolution card and put it into your hand."
      }
    ],
    ability: {
      name: "Evolution Signal",
      text: "Once during your turn, you may reveal an Evolution Pokemon from your hand."
    },
    weaknesses: [{ type: "Fighting", value: "x2" }]
  },
  {
    id: "dex-0143",
    dex: 143,
    name: "Snorlax",
    type: "Colorless",
    hp: 150,
    rarity: "Rare",
    stage: "Basic",
    setName: "Heavy Impact",
    setSeries: "Pokedex Wiki Originals",
    releaseDate: "2024-04-30",
    number: "143",
    artist: "Pokedex Studio",
    flavorText:
      "Tank card with high HP designed to absorb pressure and hold the front line.",
    attacks: [
      {
        name: "Body Slam",
        damage: "90",
        text: "Flip a coin. If heads, your opponent Active Pokemon is now Paralyzed."
      }
    ],
    weaknesses: [{ type: "Fighting", value: "x2" }]
  },
  {
    id: "dex-0094",
    dex: 94,
    name: "Gengar",
    type: "Psychic",
    hp: 140,
    rarity: "Rare Holo",
    stage: "Stage 2",
    evolvesFrom: "Haunter",
    setName: "Night Protocol",
    setSeries: "Pokedex Wiki Originals",
    releaseDate: "2024-05-14",
    number: "094",
    artist: "Pokedex Studio",
    flavorText:
      "Disruption-focused stage card that punishes large hands and predictable setups.",
    attacks: [
      {
        name: "Shadow Circuit",
        damage: "80",
        text: "Your opponent reveals their hand. Discard one Trainer card you find there."
      }
    ],
    ability: {
      name: "Dark Corridor",
      text: "When this Pokemon becomes Active, your opponent Active Pokemon is now Confused."
    },
    weaknesses: [{ type: "Darkness", value: "x2" }],
    resistances: [{ type: "Fighting", value: "-30" }]
  },
  {
    id: "dex-0149",
    dex: 149,
    name: "Dragonite",
    type: "Dragon",
    hp: 170,
    rarity: "Ultra Rare",
    stage: "Stage 2",
    evolvesFrom: "Dragonair",
    setName: "Sky Vanguard",
    setSeries: "Pokedex Wiki Originals",
    releaseDate: "2024-06-07",
    number: "149",
    artist: "Pokedex Studio",
    flavorText:
      "Late-game finisher with high burst damage and strong board closing potential.",
    attacks: [
      {
        name: "Meteor Dive",
        damage: "160",
        text: "Discard 2 Energy from this Pokemon."
      }
    ],
    weaknesses: [{ type: "Fairy", value: "x2" }]
  },
  {
    id: "dex-0282",
    dex: 282,
    name: "Gardevoir",
    type: "Psychic",
    hp: 160,
    rarity: "Rare Holo",
    stage: "Stage 2",
    evolvesFrom: "Kirlia",
    setName: "Mind Resonance",
    setSeries: "Pokedex Wiki Originals",
    releaseDate: "2024-07-01",
    number: "282",
    artist: "Pokedex Studio",
    flavorText:
      "Energy acceleration engine for psychic decks with strong support identity.",
    attacks: [
      {
        name: "Psychic Lance",
        damage: "120",
        text: "This attack does 20 more damage for each Psychic Energy attached to this Pokemon."
      }
    ],
    ability: {
      name: "Astral Relay",
      text: "Move a Psychic Energy from one of your Pokemon to another."
    },
    weaknesses: [{ type: "Metal", value: "x2" }]
  },
  {
    id: "dex-0445",
    dex: 445,
    name: "Garchomp",
    type: "Dragon",
    hp: 180,
    rarity: "Ultra Rare",
    stage: "Stage 2",
    evolvesFrom: "Gabite",
    setName: "Champion Strike",
    setSeries: "Pokedex Wiki Originals",
    releaseDate: "2024-07-24",
    number: "445",
    artist: "Pokedex Studio",
    flavorText:
      "A high-pressure attacker tuned for aggressive prize trades and tempo control.",
    attacks: [
      {
        name: "Sand Ripper",
        damage: "140",
        text: "Discard the top 2 cards of your opponent deck."
      }
    ],
    weaknesses: [{ type: "Fairy", value: "x2" }]
  },
  {
    id: "dex-0448",
    dex: 448,
    name: "Lucario",
    type: "Fighting",
    hp: 130,
    rarity: "Rare",
    stage: "Stage 1",
    evolvesFrom: "Riolu",
    setName: "Aura Command",
    setSeries: "Pokedex Wiki Originals",
    releaseDate: "2024-08-09",
    number: "448",
    artist: "Pokedex Studio",
    flavorText:
      "Midrange fighter card with balanced offense and tactical flexibility.",
    attacks: [
      {
        name: "Aura Break",
        damage: "90",
        text: "If this Pokemon has any extra Energy attached, this attack does 30 more damage."
      }
    ],
    ability: {
      name: "Battle Insight",
      text: "Once during your turn, you may look at your opponent top card."
    },
    weaknesses: [{ type: "Psychic", value: "x2" }]
  },
  {
    id: "dex-0658",
    dex: 658,
    name: "Greninja",
    type: "Water",
    hp: 150,
    rarity: "Rare Holo",
    stage: "Stage 2",
    evolvesFrom: "Frogadier",
    setName: "Ninja Streams",
    setSeries: "Pokedex Wiki Originals",
    releaseDate: "2024-08-27",
    number: "658",
    artist: "Pokedex Studio",
    flavorText:
      "Tactical attacker card specialized in bench pressure and precision damage.",
    attacks: [
      {
        name: "Silent Water Shuriken",
        damage: "100",
        text: "This attack also does 20 damage to one of your opponent Benched Pokemon."
      }
    ],
    weaknesses: [{ type: "Lightning", value: "x2" }]
  },
  {
    id: "dex-0571",
    dex: 571,
    name: "Zoroark",
    type: "Darkness",
    hp: 130,
    rarity: "Rare",
    stage: "Stage 1",
    evolvesFrom: "Zorua",
    setName: "Illusion Tactics",
    setSeries: "Pokedex Wiki Originals",
    releaseDate: "2024-09-10",
    number: "571",
    artist: "Pokedex Studio",
    flavorText:
      "Mind-game specialist that manipulates damage math and disrupts setup timing.",
    attacks: [
      {
        name: "Mirage Slash",
        damage: "80",
        text: "Switch this Pokemon with one of your Benched Pokemon."
      }
    ],
    ability: {
      name: "Illusion Veil",
      text: "Prevent all effects of attacks from your opponent Supporter cards."
    },
    weaknesses: [{ type: "Fighting", value: "x2" }]
  },
  {
    id: "dex-0778",
    dex: 778,
    name: "Mimikyu",
    type: "Psychic",
    hp: 90,
    rarity: "Rare",
    stage: "Basic",
    setName: "Twilight Parade",
    setSeries: "Pokedex Wiki Originals",
    releaseDate: "2024-09-29",
    number: "778",
    artist: "Pokedex Studio",
    flavorText:
      "Defensive trickster card with protection effects and reactive gameplay patterns.",
    attacks: [
      {
        name: "Copycat Claw",
        damage: "50",
        text: "Choose 1 of your opponent attack and use it as this attack."
      }
    ],
    ability: {
      name: "Costume Guard",
      text: "If this Pokemon has full HP, reduce incoming damage by 30."
    },
    weaknesses: [{ type: "Metal", value: "x2" }]
  },
  {
    id: "dex-0887",
    dex: 887,
    name: "Dragapult",
    type: "Dragon",
    hp: 160,
    rarity: "Ultra Rare",
    stage: "Stage 2",
    evolvesFrom: "Drakloak",
    setName: "Phantom Velocity",
    setSeries: "Pokedex Wiki Originals",
    releaseDate: "2024-10-14",
    number: "887",
    artist: "Pokedex Studio",
    flavorText:
      "High-speed late-game cleaner with bench sniping and tempo finishing tools.",
    attacks: [
      {
        name: "Spectral Volley",
        damage: "130",
        text: "Put 3 damage counters on your opponent Benched Pokemon in any way you like."
      }
    ],
    weaknesses: [{ type: "Darkness", value: "x2" }]
  },
  {
    id: "dex-0959",
    dex: 959,
    name: "Tinkaton",
    type: "Metal",
    hp: 150,
    rarity: "Rare Holo",
    stage: "Stage 2",
    evolvesFrom: "Tinkatuff",
    setName: "Paldea Forge",
    setSeries: "Pokedex Wiki Originals",
    releaseDate: "2024-11-02",
    number: "959",
    artist: "Pokedex Studio",
    flavorText:
      "Resource scaling attacker that gets stronger as your hand size increases.",
    attacks: [
      {
        name: "Gigaton Smash",
        damage: "30+",
        text: "This attack does 30 more damage for each card in your hand."
      }
    ],
    ability: {
      name: "Forge Rhythm",
      text: "Once per turn, you may draw until you have 5 cards in hand."
    },
    weaknesses: [{ type: "Fire", value: "x2" }],
    resistances: [{ type: "Psychic", value: "-30" }]
  }
];

const STATIC_FALLBACK_CARD_DETAILS = (
  tcgCardsFallbackCatalog as PokemonCardDetail[]
).filter((card) => Boolean(card?.id && (card.imageLarge || card.imageSmall)));
const GENERATED_FALLBACK_CARD_DETAILS = FALLBACK_CARD_SEEDS.map(buildFallbackCard);
const FALLBACK_CARD_DETAILS =
  STATIC_FALLBACK_CARD_DETAILS.length >= 16
    ? sortDetailEntries(STATIC_FALLBACK_CARD_DETAILS)
    : sortDetailEntries(GENERATED_FALLBACK_CARD_DETAILS);
const FALLBACK_CARD_BY_ID = new Map(FALLBACK_CARD_DETAILS.map((card) => [card.id, card]));
let runtimeCardIndexCache: { value: PokemonCardIndexEntry[]; expiresAt: number } | null = null;
let runtimeCardIndexPromise: Promise<PokemonCardIndexEntry[]> | null = null;

async function requestPokemonTcgJson<T>(
  endpoint: string,
  options: PokemonTcgRequestOptions
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${POKEMON_TCG_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const apiKey =
    process.env.POKEMON_TCG_API_KEY ?? process.env.NEXT_PUBLIC_POKEMON_TCG_API_KEY;

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(apiKey ? { "X-Api-Key": apiKey } : {})
      },
      next: {
        revalidate: options.revalidate
      }
    });

    if (!response.ok) {
      throw new PokemonCardApiError(
        `Pokemon TCG request failed (${response.status}).`,
        url,
        response.status
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof PokemonCardApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new PokemonCardApiError("Pokemon TCG request timed out.", url, undefined, error);
    }

    throw new PokemonCardApiError("Unexpected Pokemon TCG request error.", url, undefined, error);
  } finally {
    clearTimeout(timeout);
  }
}

async function requestTcgDexJson<T>(endpoint: string, revalidate: number): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${TCGDEX_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "PokedexWiki/1.0 (+https://localhost)"
      },
      next: {
        revalidate
      }
    });

    if (!response.ok) {
      throw new PokemonCardApiError(
        `TCGdex request failed (${response.status}).`,
        url,
        response.status
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof PokemonCardApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new PokemonCardApiError("TCGdex request timed out.", url, undefined, error);
    }

    throw new PokemonCardApiError("Unexpected TCGdex request error.", url, undefined, error);
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestTcgDexCardListPage(
  endpoint: string,
  revalidate: number,
  retries = 2
): Promise<TcgDexCardListEntry[]> {
  let attempt = 0;
  while (true) {
    try {
      return await requestTcgDexJson<TcgDexCardListEntry[]>(endpoint, revalidate);
    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }
      attempt += 1;
      await sleep(120 * attempt);
    }
  }
}

function mapTcgDexSetMeta(setDetail: TcgDexSetDetail): TcgDexSetMeta {
  return {
    setName: normalizeText(setDetail.name || "Unknown Set"),
    releaseDate:
      setDetail.releaseDate && !Number.isNaN(Date.parse(setDetail.releaseDate))
        ? setDetail.releaseDate
        : null,
    seriesName: setDetail.serie?.name ? normalizeText(setDetail.serie.name) : null,
    setLogoUrl: toTcgDexSetAssetUrl(setDetail.logo),
    setSymbolUrl: toTcgDexSetAssetUrl(setDetail.symbol),
    setPrintedTotal:
      typeof setDetail.cardCount?.official === "number" ? setDetail.cardCount.official : null,
    setTotal: typeof setDetail.cardCount?.total === "number" ? setDetail.cardCount.total : null
  };
}

function mapTcgDexSetListMeta(setEntry: TcgDexSetListEntry): TcgDexSetMeta {
  return {
    setName: normalizeText(setEntry.name || "Unknown Set"),
    releaseDate:
      setEntry.releaseDate && !Number.isNaN(Date.parse(setEntry.releaseDate))
        ? setEntry.releaseDate
        : null,
    seriesName: setEntry.serie?.name ? normalizeText(setEntry.serie.name) : null,
    setLogoUrl: toTcgDexSetAssetUrl(setEntry.logo),
    setSymbolUrl: toTcgDexSetAssetUrl(setEntry.symbol),
    setPrintedTotal:
      typeof setEntry.cardCount?.official === "number" ? setEntry.cardCount.official : null,
    setTotal: typeof setEntry.cardCount?.total === "number" ? setEntry.cardCount.total : null
  };
}

function resolveTcgDexSetIdFromCardId(cardId: string, sortedSetIds: string[]): string | null {
  const safeId = String(cardId || "").toLowerCase();
  for (const setId of sortedSetIds) {
    if (safeId.startsWith(`${setId.toLowerCase()}-`)) {
      return setId;
    }
  }
  return null;
}

function inferSupertypeFromListEntryName(name: string): "Pokemon" | "Trainer" | "Energy" {
  const normalizedName = normalizeText(name).toLowerCase();
  if (
    normalizedName === "energy" ||
    normalizedName.endsWith(" energy") ||
    normalizedName.includes(" basic energy") ||
    normalizedName.includes(" special energy")
  ) {
    return "Energy";
  }

  if (/\b(supporter|stadium|item|tool)\b/.test(normalizedName)) {
    return "Trainer";
  }

  return "Pokemon";
}

function mapTcgDexCardToDetail(
  card: TcgDexCardDetail,
  setMetaById: Map<string, TcgDexSetMeta>
): PokemonCardDetail {
  const setId = card.set?.id ?? "";
  const setMeta = setMetaById.get(setId);
  const snapshots = mapPriceSnapshotsFromTcgDex(card);
  const { marketPrice, marketSource } = resolvePrimaryMarketPrice(snapshots);
  const stage = card.stage ? normalizeText(card.stage) : null;
  const suffix = card.suffix ? normalizeText(card.suffix) : null;
  const subtypes = Array.from(new Set([stage, suffix].filter((entry): entry is string => Boolean(entry))));
  const rules = card.effect ? [normalizeText(card.effect)] : [];
  const retreatCost = toRetreatCost(card.retreat);
  const setName = setMeta?.setName ?? (card.set?.name ? normalizeText(card.set.name) : "Unknown Set");
  const setSeries = setMeta?.seriesName ?? TCGDEX_GLOBAL_CATALOG_SERIES;

  const abilityEntries = toSafeArray(card.abilities).map((entry) => ({
    name: normalizeText(entry.name || "Unknown ability"),
    type: entry.type ? normalizeText(entry.type) : null,
    text: entry.effect ? normalizeText(entry.effect) : "No effect text available."
  }));

  const attackEntries = toSafeArray(card.attacks).map((entry) => ({
    name: normalizeText(entry.name || "Unknown attack"),
    cost: toSafeArray(entry.cost).map((cost) => normalizeText(cost)),
    damage: entry.damage ? normalizeText(entry.damage) : null,
    text: entry.effect ? normalizeText(entry.effect) : null,
    convertedEnergyCost: Array.isArray(entry.cost) ? entry.cost.length : null
  }));

  const imageSmall = toTcgDexCardImageUrl(card.image, "low");
  const imageLarge = toTcgDexCardImageUrl(card.image, "high");
  const legalStandard = toLegalityFromBoolean(card.legal?.standard);
  const legalExpanded = toLegalityFromBoolean(card.legal?.expanded);

  return {
    id: card.id,
    name: card.name,
    displayName: normalizeText(card.name),
    supertype: normalizeText(card.category || "Pokemon"),
    subtypes,
    hp: toNullableNumber(card.hp ?? null),
    types: toSafeArray(card.types).map((entry) => normalizeText(entry)),
    setName,
    setSeries,
    setReleaseDate: setMeta?.releaseDate ?? null,
    rarity: card.rarity ? normalizeText(card.rarity) : null,
    artist: card.illustrator ? normalizeText(card.illustrator) : null,
    nationalPokedexNumbers: toDexNumbers(card.dexId),
    imageSmall,
    imageLarge,
    number: card.localId || card.id.split("-")[1] || "000",
    regulationMark: card.regulationMark ? normalizeText(card.regulationMark) : null,
    stage,
    evolvesFrom: card.evolveFrom ? normalizeText(card.evolveFrom) : null,
    attacksCount: attackEntries.length,
    abilitiesCount: abilityEntries.length,
    rulesCount: rules.length,
    marketPrice,
    marketSource,
    flavorText: card.description ? normalizeText(card.description) : null,
    rules,
    abilityEntries,
    attackEntries,
    weaknesses: toSafeArray(card.weaknesses).map((entry) => ({
      type: normalizeText(entry.type || "Unknown"),
      value: normalizeText(entry.value || "")
    })),
    resistances: toSafeArray(card.resistances).map((entry) => ({
      type: normalizeText(entry.type || "Unknown"),
      value: normalizeText(entry.value || "")
    })),
    retreatCost,
    convertedRetreatCost: retreatCost.length > 0 ? retreatCost.length : null,
    legalityStandard: legalStandard,
    legalityExpanded: legalExpanded,
    legalityUnlimited: legalExpanded,
    setPrintedTotal:
      typeof card.set?.cardCount?.official === "number"
        ? card.set.cardCount.official
        : (setMeta?.setPrintedTotal ?? null),
    setTotal:
      typeof card.set?.cardCount?.total === "number"
        ? card.set.cardCount.total
        : (setMeta?.setTotal ?? null),
    setSymbolUrl: setMeta?.setSymbolUrl ?? null,
    setLogoUrl: setMeta?.setLogoUrl ?? null,
    tcgplayerUrl: null,
    cardmarketUrl: null,
    priceSnapshots: snapshots,
    marketLastUpdatedAt: resolveTcgDexMarketUpdatedAt(card)
  };
}

async function fetchPokemonCardCatalogFromTcgDex(): Promise<PokemonCardDetail[]> {
  const setList = await requestTcgDexJson<TcgDexSetListEntry[]>("/sets", REVALIDATE_INDEX_SECONDS);
  const targetSetRefs = setList.slice(-TCGDEX_FALLBACK_SET_COUNT).reverse();

  if (targetSetRefs.length === 0) {
    throw new PokemonCardApiError("TCGdex set list was empty.", `${TCGDEX_BASE_URL}/sets`);
  }

  const setDetails = await Promise.all(
    targetSetRefs.map((entry) =>
      requestTcgDexJson<TcgDexSetDetail>(
        `/sets/${encodeURIComponent(entry.id)}`,
        REVALIDATE_INDEX_SECONDS
      )
    )
  );

  const setMetaById = new Map<string, TcgDexSetMeta>(
    setDetails.map((detail) => [detail.id, mapTcgDexSetMeta(detail)])
  );

  const cardIds = Array.from(
    new Set(
      setDetails.flatMap((setDetail) =>
        toSafeArray(setDetail.cards)
          .slice(0, TCGDEX_FALLBACK_CARDS_PER_SET)
          .map((card) => card.id)
      )
    )
  );

  const cards: TcgDexCardDetail[] = [];
  for (let index = 0; index < cardIds.length; index += TCGDEX_FALLBACK_BATCH_SIZE) {
    const chunk = cardIds.slice(index, index + TCGDEX_FALLBACK_BATCH_SIZE);
    const chunkCards = await Promise.all(
      chunk.map(async (id) => {
        try {
          return await requestTcgDexJson<TcgDexCardDetail>(
            `/cards/${encodeURIComponent(id)}`,
            REVALIDATE_DETAIL_SECONDS
          );
        } catch {
          return null;
        }
      })
    );

    cards.push(...chunkCards.filter((entry): entry is TcgDexCardDetail => Boolean(entry)));
  }

  const mapped = cards
    .map((card) => mapTcgDexCardToDetail(card, setMetaById))
    .filter((card) => card.imageLarge || card.imageSmall);

  if (mapped.length < 16) {
    throw new PokemonCardApiError("TCGdex fallback catalog too small.", TCGDEX_BASE_URL);
  }

  return sortDetailEntries(mapped).slice(0, CATALOG_TARGET_SIZE);
}

async function fetchPokemonCardIndexFromPokemonTcgAll(): Promise<PokemonCardIndexEntry[]> {
  const entriesById = new Map<string, PokemonCardIndexEntry>();

  for (let page = 1; page <= POKEMON_TCG_INDEX_MAX_PAGES; page += 1) {
    let payload: PokemonTcgListResponse;
    try {
      payload = await requestPokemonTcgJson<PokemonTcgListResponse>(
        `/cards?page=${page}&pageSize=${POKEMON_TCG_INDEX_PAGE_SIZE}&orderBy=-set.releaseDate,-number&select=${encodeURIComponent(POKEMON_TCG_INDEX_SELECT_FIELDS)}`,
        {
          revalidate: REVALIDATE_INDEX_SECONDS
        }
      );
    } catch (error) {
      if (entriesById.size > 0) {
        break;
      }
      throw error;
    }

    const mappedPage = payload.data
      .map((card) => mapCardToIndex(card))
      .filter((card) => card.imageLarge || card.imageSmall);

    if (mappedPage.length === 0) {
      break;
    }

    for (const entry of mappedPage) {
      entriesById.set(entry.id, entry);
    }

    if (mappedPage.length < POKEMON_TCG_INDEX_PAGE_SIZE) {
      break;
    }
  }

  if (entriesById.size < POKEMON_TCG_INDEX_MIN_COUNT) {
    throw new PokemonCardApiError(
      "Pokemon TCG index returned too few cards.",
      `${POKEMON_TCG_BASE_URL}/cards`
    );
  }

  return sortIndexEntries(Array.from(entriesById.values()));
}

async function fetchTcgDexCardListByQuery(
  query: string,
  options?: TcgDexCardListQueryOptions
): Promise<TcgDexCardListEntry[]> {
  const safeQuery = query.startsWith("?") ? query.slice(1) : query;
  const prefixedQuery = safeQuery.length > 0 ? `${safeQuery}&` : "";
  const maxPages = options?.maxPages ?? TCGDEX_CARD_LIST_MAX_PAGES;
  const targetCount = options?.targetCount ?? TCGDEX_CARD_LIST_TARGET_COUNT;
  const allowPartialOnError = options?.allowPartialOnError ?? true;
  const entriesById = new Map<string, TcgDexCardListEntry>();

  if (safeQuery.length === 0 && maxPages > 1) {
    const pages = Array.from({ length: maxPages }, (_, index) => index + 1);
    const results = await Promise.allSettled(
      pages.map((page) =>
        requestTcgDexCardListPage(
          `/cards?${prefixedQuery}pagination:itemsPerPage=${TCGDEX_CARD_LIST_PAGE_SIZE}&pagination:page=${page}`,
          REVALIDATE_INDEX_SECONDS
        )
      )
    );

    let fulfilledPages = 0;

    for (let index = 0; index < pages.length; index += 1) {
      const result = results[index];
      if (result.status !== "fulfilled") {
        if (allowPartialOnError && entriesById.size > 0) {
          break;
        }
        throw result.reason;
      }

      const pageEntries = result.value;
      fulfilledPages += 1;

      if (!Array.isArray(pageEntries) || pageEntries.length === 0) {
        break;
      }

      for (const entry of pageEntries) {
        if (!entry?.id) {
          continue;
        }
        entriesById.set(entry.id, entry);
      }

      if (targetCount > 0 && entriesById.size >= targetCount) {
        break;
      }

      if (pageEntries.length < TCGDEX_CARD_LIST_PAGE_SIZE) {
        break;
      }
    }

    if (entriesById.size === 0 && fulfilledPages === 0) {
      throw new PokemonCardApiError("TCGdex list query returned no pages.", `${TCGDEX_BASE_URL}/cards`);
    }

    return Array.from(entriesById.values());
  }

  for (let page = 1; page <= maxPages; page += 1) {
    let pageEntries: TcgDexCardListEntry[];
    try {
      pageEntries = await requestTcgDexCardListPage(
        `/cards?${prefixedQuery}pagination:itemsPerPage=${TCGDEX_CARD_LIST_PAGE_SIZE}&pagination:page=${page}`,
        REVALIDATE_INDEX_SECONDS
      );
    } catch (error) {
      if (allowPartialOnError && entriesById.size > 0) {
        break;
      }
      throw error;
    }

    if (!Array.isArray(pageEntries) || pageEntries.length === 0) {
      break;
    }

    for (const entry of pageEntries) {
      if (!entry?.id) {
        continue;
      }
      entriesById.set(entry.id, entry);
    }

    if (pageEntries.length < TCGDEX_CARD_LIST_PAGE_SIZE) {
      break;
    }

    if (targetCount > 0 && entriesById.size >= targetCount) {
      break;
    }
  }

  return Array.from(entriesById.values());
}

async function fetchPokemonCardIndexFromTcgDexAll(): Promise<PokemonCardIndexEntry[]> {
  const [setList, list] = await Promise.all([
    requestTcgDexJson<TcgDexSetListEntry[]>("/sets", REVALIDATE_INDEX_SECONDS),
    fetchTcgDexCardListByQuery("")
  ]);

  if (setList.length === 0) {
    throw new PokemonCardApiError("TCGdex set list was empty.", `${TCGDEX_BASE_URL}/sets`);
  }

  if (list.length < 120) {
    throw new PokemonCardApiError("TCGdex card index returned too few cards.", `${TCGDEX_BASE_URL}/cards`);
  }

  const setMetaById = new Map<string, TcgDexSetMeta>(
    setList.map((setEntry) => [setEntry.id, mapTcgDexSetListMeta(setEntry)])
  );
  const sortedSetIds = Array.from(setMetaById.keys()).sort((a, b) => b.length - a.length);

  const mapped = list.map((entry) => {
    const setId = resolveTcgDexSetIdFromCardId(entry.id, sortedSetIds);
    const setMeta = setId ? setMetaById.get(setId) : null;
    const number =
      entry.localId ??
      (setId && entry.id.startsWith(`${setId}-`) ? entry.id.slice(setId.length + 1) : entry.id);
    const resolvedSupertype = inferSupertypeFromListEntryName(entry.name);

    return {
      id: entry.id,
      name: entry.name,
      displayName: normalizeText(entry.name),
      supertype: resolvedSupertype,
      subtypes: [],
      hp: null,
      types: [],
      setName: setMeta?.setName ?? "Unknown Set",
      setSeries: setMeta?.seriesName ?? TCGDEX_GLOBAL_CATALOG_SERIES,
      setReleaseDate: setMeta?.releaseDate ?? null,
      rarity: null,
      artist: null,
      nationalPokedexNumbers: [],
      imageSmall: toTcgDexCardImageUrl(entry.image, "low"),
      imageLarge: toTcgDexCardImageUrl(entry.image, "high"),
      number: String(number || "000"),
      regulationMark: null,
      stage: null,
      evolvesFrom: null,
      attacksCount: 0,
      abilitiesCount: 0,
      rulesCount: 0,
      marketPrice: null,
      marketSource: null
    } satisfies PokemonCardIndexEntry;
  });

  return sortIndexEntries(mapped);
}

async function fetchPokemonCardIndexFromTcgDexListOnly(): Promise<PokemonCardIndexEntry[]> {
  const list = await fetchTcgDexCardListByQuery("", {
    maxPages: TCGDEX_CARD_LIST_MAX_PAGES,
    targetCount: TCGDEX_CARD_LIST_TARGET_COUNT,
    allowPartialOnError: true
  });

  if (list.length < 120) {
    throw new PokemonCardApiError("TCGdex list-only index returned too few cards.", `${TCGDEX_BASE_URL}/cards`);
  }

  const mapped = list.map((entry) => ({
    id: entry.id,
    name: entry.name,
    displayName: normalizeText(entry.name),
    supertype: inferSupertypeFromListEntryName(entry.name),
    subtypes: [],
    hp: null,
    types: [],
    setName: "Unknown Set",
    setSeries: TCGDEX_GLOBAL_CATALOG_SERIES,
    setReleaseDate: null,
    rarity: null,
    artist: null,
    nationalPokedexNumbers: [],
    imageSmall: toTcgDexCardImageUrl(entry.image, "low"),
    imageLarge: toTcgDexCardImageUrl(entry.image, "high"),
    number: String(entry.localId || "000"),
    regulationMark: null,
    stage: null,
    evolvesFrom: null,
    attacksCount: 0,
    abilitiesCount: 0,
    rulesCount: 0,
    marketPrice: null,
    marketSource: null
  } satisfies PokemonCardIndexEntry));

  return sortIndexEntries(mapped);
}

function sortIndexEntries(entries: PokemonCardIndexEntry[]) {
  return entries.slice().sort((a, b) => {
    const dateA = Date.parse(a.setReleaseDate ?? "");
    const dateB = Date.parse(b.setReleaseDate ?? "");
    const safeDateA = Number.isNaN(dateA) ? 0 : dateA;
    const safeDateB = Number.isNaN(dateB) ? 0 : dateB;

    if (safeDateA !== safeDateB) {
      return safeDateB - safeDateA;
    }

    const parsedA = Number.parseInt(a.number.replace(/[^\d]/g, ""), 10);
    const parsedB = Number.parseInt(b.number.replace(/[^\d]/g, ""), 10);
    const safeNumberA = Number.isNaN(parsedA) ? Number.MAX_SAFE_INTEGER : parsedA;
    const safeNumberB = Number.isNaN(parsedB) ? Number.MAX_SAFE_INTEGER : parsedB;
    if (safeNumberA !== safeNumberB) {
      return safeNumberA - safeNumberB;
    }

    return a.displayName.localeCompare(b.displayName);
  });
}

function sortDetailEntries(entries: PokemonCardDetail[]) {
  return entries.slice().sort((a, b) => {
    const dateA = Date.parse(a.setReleaseDate ?? "");
    const dateB = Date.parse(b.setReleaseDate ?? "");
    const safeDateA = Number.isNaN(dateA) ? 0 : dateA;
    const safeDateB = Number.isNaN(dateB) ? 0 : dateB;

    if (safeDateA !== safeDateB) {
      return safeDateB - safeDateA;
    }

    const parsedA = Number.parseInt(a.number.replace(/[^\d]/g, ""), 10);
    const parsedB = Number.parseInt(b.number.replace(/[^\d]/g, ""), 10);
    const safeNumberA = Number.isNaN(parsedA) ? Number.MAX_SAFE_INTEGER : parsedA;
    const safeNumberB = Number.isNaN(parsedB) ? Number.MAX_SAFE_INTEGER : parsedB;
    if (safeNumberA !== safeNumberB) {
      return safeNumberA - safeNumberB;
    }

    return a.displayName.localeCompare(b.displayName);
  });
}

function mapDetailToIndex(detail: PokemonCardDetail): PokemonCardIndexEntry {
  return {
    id: detail.id,
    name: detail.name,
    displayName: detail.displayName,
    supertype: detail.supertype,
    subtypes: detail.subtypes,
    hp: detail.hp,
    types: detail.types,
    setName: detail.setName,
    setSeries: detail.setSeries,
    setReleaseDate: detail.setReleaseDate,
    rarity: detail.rarity,
    artist: detail.artist,
    nationalPokedexNumbers: detail.nationalPokedexNumbers,
    imageSmall: detail.imageSmall,
    imageLarge: detail.imageLarge,
    number: detail.number,
    regulationMark: detail.regulationMark,
    stage: detail.stage,
    evolvesFrom: detail.evolvesFrom,
    attacksCount: detail.attacksCount,
    abilitiesCount: detail.abilitiesCount,
    rulesCount: detail.rulesCount,
    marketPrice: detail.marketPrice,
    marketSource: detail.marketSource
  };
}

export async function fetchPokemonCardCatalog(): Promise<PokemonCardDetail[]> {
  try {
    const collected: PokemonCardDetail[] = [];
    let priceEntries = 0;

    for (let page = 1; page <= CATALOG_MAX_PAGES; page += 1) {
      const payload = await requestPokemonTcgJson<PokemonTcgListResponse>(
        `/cards?page=${page}&pageSize=${CATALOG_PAGE_SIZE}&orderBy=-set.releaseDate,-number`,
        {
          revalidate: REVALIDATE_INDEX_SECONDS
        }
      );

      const mappedPage = payload.data
        .map((card) => mapCardToDetail(card))
        .filter((card) => card.imageLarge || card.imageSmall);

      if (mappedPage.length === 0) {
        break;
      }

      collected.push(...mappedPage);
      priceEntries += mappedPage.filter((card) => card.marketPrice !== null).length;

      if (
        collected.length >= CATALOG_TARGET_SIZE &&
        (priceEntries >= CATALOG_MIN_PRICE_ENTRIES || page >= 2)
      ) {
        break;
      }
    }

    const deduped = Array.from(
      new Map(collected.map((card) => [card.id, card])).values()
    );

    if (deduped.length < 16) {
      throw new PokemonCardApiError("Pokemon TCG catalog too small.", `${POKEMON_TCG_BASE_URL}/cards`);
    }

    return sortDetailEntries(deduped).slice(0, CATALOG_TARGET_SIZE);
  } catch {
    try {
      return await fetchPokemonCardCatalogFromTcgDex();
    } catch {
      return sortDetailEntries(FALLBACK_CARD_DETAILS);
    }
  }
}

async function loadPokemonCardIndexUncached(): Promise<PokemonCardIndexEntry[]> {
  try {
    return await fetchPokemonCardIndexFromTcgDexAll();
  } catch {
    try {
      return await fetchPokemonCardIndexFromPokemonTcgAll();
    } catch {
      try {
        return await fetchPokemonCardIndexFromTcgDexListOnly();
      } catch {
        return sortIndexEntries(FALLBACK_CARD_DETAILS.map((detail) => mapDetailToIndex(detail)));
      }
    }
  }
}

export async function fetchPokemonCardIndex(): Promise<PokemonCardIndexEntry[]> {
  const now = Date.now();
  if (runtimeCardIndexCache && runtimeCardIndexCache.expiresAt > now) {
    return runtimeCardIndexCache.value;
  }

  if (!runtimeCardIndexPromise) {
    runtimeCardIndexPromise = loadPokemonCardIndexUncached();
  }

  try {
    const resolved = await runtimeCardIndexPromise;
    runtimeCardIndexCache = {
      value: resolved,
      expiresAt: Date.now() + CARD_INDEX_RUNTIME_CACHE_TTL_MS
    };
    return resolved;
  } finally {
    runtimeCardIndexPromise = null;
  }
}

export async function fetchPokemonCardTypes(): Promise<string[]> {
  try {
    const remoteTypes = await requestTcgDexJson<string[]>("/types", REVALIDATE_INDEX_SECONDS);
    const normalized = Array.from(
      new Set(remoteTypes.map((entry) => normalizeText(entry)).filter((entry) => Boolean(entry)))
    ).sort((a, b) => a.localeCompare(b));

    if (normalized.length > 0) {
      return normalized;
    }
  } catch {
    // Use local fallback below.
  }

  return [...FALLBACK_CARD_TYPES];
}

export async function fetchPokemonCardIdsByType(type: string): Promise<string[]> {
  const normalizedType = normalizeText(type);
  if (!normalizedType || normalizedType.toLowerCase() === "all") {
    return [];
  }

  try {
    const list = await fetchTcgDexCardListByQuery(`types=${encodeURIComponent(normalizedType)}`, {
      maxPages: TCGDEX_TYPE_QUERY_MAX_PAGES,
      targetCount: 0
    });
    if (list.length === 0) {
      return [];
    }

    return Array.from(
      new Set(
        list
          .map((entry) => String(entry.id ?? "").trim())
          .filter((entry) => Boolean(entry))
      )
    );
  } catch {
    return [];
  }
}

export async function fetchPokemonCardDetail(
  identifier: string | number
): Promise<PokemonCardDetail> {
  const id = String(identifier);

  try {
    const payload = await requestPokemonTcgJson<PokemonTcgDetailResponse>(
      `/cards/${encodeURIComponent(id)}`,
      {
        revalidate: REVALIDATE_DETAIL_SECONDS
      }
    );
    return mapCardToDetail(payload.data);
  } catch (pokemonError) {
    try {
      const tcgDexDetail = await requestTcgDexJson<TcgDexCardDetail>(
        `/cards/${encodeURIComponent(id)}`,
        REVALIDATE_DETAIL_SECONDS
      );

      const setId = tcgDexDetail.set?.id;
      const setMetaById = new Map<string, TcgDexSetMeta>();
      if (setId) {
        try {
          const setDetail = await requestTcgDexJson<TcgDexSetDetail>(
            `/sets/${encodeURIComponent(setId)}`,
            REVALIDATE_INDEX_SECONDS
          );
          setMetaById.set(setId, mapTcgDexSetMeta(setDetail));
        } catch {
          // If set metadata fails, card detail still renders with basic set fields.
        }
      }

      return mapTcgDexCardToDetail(tcgDexDetail, setMetaById);
    } catch (tcgDexError) {
      // Fall through to local fallback seeds.

      const fallback = FALLBACK_CARD_BY_ID.get(id);
      if (fallback) {
        return fallback;
      }

      try {
        const catalog = await fetchPokemonCardCatalog();
        const fromCatalog = catalog.find((entry) => entry.id === id);
        if (fromCatalog) {
          return fromCatalog;
        }
      } catch {
        // Ignore and throw below.
      }

      if (pokemonError instanceof PokemonCardApiError) {
        throw pokemonError;
      }

      if (tcgDexError instanceof PokemonCardApiError) {
        throw tcgDexError;
      }

      throw new PokemonCardApiError(
        "Unable to load Pokemon card detail.",
        id,
        undefined,
        pokemonError
      );
    }
  }
}
