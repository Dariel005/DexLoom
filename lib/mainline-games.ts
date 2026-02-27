import { MAINLINE_GENERATIONS, MOBILE_AND_SERVICE_GAMES } from "@/lib/games-encyclopedia";

export type VerificationDateISO = string;

export type GameEntrySectionKey =
  | "identity"
  | "release_matrix"
  | "version_differences"
  | "core_mechanics"
  | "pokedex_data"
  | "story_progression"
  | "world_map"
  | "content_modes"
  | "postgame"
  | "connectivity"
  | "technical_profile"
  | "dlc_updates"
  | "reception_sales"
  | "media_gallery"
  | "references_verification";

export const GAME_ENTRY_SECTION_KEYS: GameEntrySectionKey[] = [
  "identity",
  "release_matrix",
  "version_differences",
  "core_mechanics",
  "pokedex_data",
  "story_progression",
  "world_map",
  "content_modes",
  "postgame",
  "connectivity",
  "technical_profile",
  "dlc_updates",
  "reception_sales",
  "media_gallery",
  "references_verification"
];

export interface GameSourceRef {
  id: string;
  label: string;
  href: string;
  note?: string;
  accessedOn: VerificationDateISO;
}

export interface GameReferenceEntry extends GameSourceRef {}

export interface MainlineGameCatalogEntry {
  slug: string;
  order: number;
  title: string;
  generationKey: string;
  generationLabel: string;
  regionLabel: string;
  eraLabel: string;
  platform: string;
  releaseWindow: string;
  note: string;
  imageSrc: string;
  imageAlt: string;
}

export type GameIdentityCategory = "mainline" | "remake" | "enhanced" | "legends" | "mobile";

export interface GameIdentityProfile {
  officialTitle: string;
  alternateTitles: string[];
  mascots: string[];
  category: GameIdentityCategory;
}

export type RegionalReleaseRegion = "JP" | "NA" | "EU" | "AU" | "KR" | "CN" | "Global";

export interface RegionalRelease {
  region: RegionalReleaseRegion;
  dateLabel: string;
  dateISO: string | null;
  notes: string[];
  sourceIds: string[];
}

export interface GameVersionDifference {
  category: string;
  leftVersion: string;
  rightVersion: string;
  notes: string;
  sourceIds: string[];
}

export interface GameMetric {
  label: string;
  value: string;
  asOf: VerificationDateISO;
  sourceIds: string[];
}

export type GameMediaKind = "cover_front" | "logo" | "screenshot" | "key_art";

export interface GameMediaItem {
  kind: GameMediaKind;
  src: string | null;
  alt: string;
  sourceIds: string[];
}

export interface GamePokedexProfile {
  regionalDexSize: string;
  newSpeciesCount: string;
  notableForms: string[];
  starterPokemon: string[];
  legendaryPokemon: string[];
}

export interface GameWorldProfile {
  primaryRegion: string;
  keyHubs: string[];
  routeStructure: string;
  standoutAreas: string[];
}

export interface GameContentModes {
  mainStory: string;
  sideModes: string[];
  onlineLocal: string[];
}

export interface GameConnectivityProfile {
  pokemonHome: string;
  transferRoute: string;
  eventDistribution: string;
}

export interface GameTechnicalProfile {
  renderTarget: string;
  performanceNotes: string[];
  knownIssues: string[];
}

export interface MainlineGameDetailEntry extends MainlineGameCatalogEntry {
  classification: string;
  releaseDate: string;
  developers: string[];
  publisher: string;
  overview: string;
  setting: string;
  keyFeatures: string[];
  starterPokemon: string[];
  legendaryPokemon: string[];
  versionCompanionSlug: string | null;
  versionCompanionTitle: string | null;
  relatedSlugs: string[];
  importantNotes: string[];
  references: GameReferenceEntry[];
  identity: GameIdentityProfile;
  releaseMatrix: RegionalRelease[];
  versionDifferences: GameVersionDifference[];
  mechanicsIntroduced: string[];
  pokedexProfile: GamePokedexProfile;
  storySummaryNoSpoiler: string;
  progressionOutline: string[];
  worldProfile: GameWorldProfile;
  contentModes: GameContentModes;
  postgameProfile: string[];
  connectivityProfile: GameConnectivityProfile;
  technicalProfile: GameTechnicalProfile;
  dlcAndPatchHistory: string[];
  receptionAndSales: GameMetric[];
  mediaGallery: GameMediaItem[];
  sectionSourceMap: Record<GameEntrySectionKey, string[]>;
  lastVerifiedOn: VerificationDateISO;
}

interface GenerationProfile {
  setting: string;
  keyFeatures: string[];
  starterPokemon: string[];
  legendaryPokemon: string[];
  mechanicsIntroduced: string[];
  progressionOutline: string[];
  keyHubs: string[];
  routeStructure: string;
  standoutAreas: string[];
  sideModes: string[];
  onlineLocal: string[];
  postgameProfile: string[];
  pokedexDefaults: {
    regionalDexSize: string;
    newSpeciesCount: string;
    notableForms: string[];
  };
}

interface GameDetailOverride {
  classification?: string;
  releaseDate?: string;
  developers?: string[];
  publisher?: string;
  overview?: string;
  setting?: string;
  keyFeatures?: string[];
  starterPokemon?: string[];
  legendaryPokemon?: string[];
  versionCompanionSlug?: string | null;
  relatedSlugs?: string[];
  importantNotes?: string[];
  identity?: Partial<GameIdentityProfile>;
  releaseMatrix?: RegionalRelease[];
  versionDifferences?: GameVersionDifference[];
  mechanicsIntroduced?: string[];
  pokedexProfile?: Partial<GamePokedexProfile>;
  storySummaryNoSpoiler?: string;
  progressionOutline?: string[];
  worldProfile?: Partial<GameWorldProfile>;
  contentModes?: Partial<GameContentModes>;
  postgameProfile?: string[];
  connectivityProfile?: Partial<GameConnectivityProfile>;
  technicalProfile?: Partial<GameTechnicalProfile>;
  dlcAndPatchHistory?: string[];
  receptionAndSales?: GameMetric[];
  mediaGallery?: GameMediaItem[];
  sectionSourceMap?: Partial<Record<GameEntrySectionKey, string[]>>;
  lastVerifiedOn?: VerificationDateISO;
}

const SOURCE_DATE: VerificationDateISO = "2026-02-22";

export const GAME_SOURCE_REGISTRY: GameSourceRef[] = [
  {
    id: "official-pokemon",
    label: "Official Pokemon Website",
    href: "https://www.pokemon.com/us",
    note: "Primary franchise source for announcements and product pages.",
    accessedOn: SOURCE_DATE
  },
  {
    id: "official-nintendo",
    label: "Nintendo Game Pages",
    href: "https://www.nintendo.com/us/store/games/",
    note: "Platform release and storefront information.",
    accessedOn: SOURCE_DATE
  },
  {
    id: "pokemon-home",
    label: "Pokemon HOME Official",
    href: "https://home.pokemon.com/en-us/",
    note: "Connectivity and transfer policy reference.",
    accessedOn: SOURCE_DATE
  },
  {
    id: "bulbapedia-games",
    label: "Bulbapedia - Pokemon Games",
    href: "https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_games",
    note: "Historical and structural encyclopedia cross-check.",
    accessedOn: SOURCE_DATE
  },
  {
    id: "ign-mainline",
    label: "IGN - Pokemon: All Mainline Games",
    href: "https://www.ign.com/playlist/igneditorial/lists/pokemon-all-mainline-games",
    note: "Mainline index baseline and media references.",
    accessedOn: SOURCE_DATE
  },
  {
    id: "bulbagarden-archives",
    label: "Bulbagarden Archives",
    href: "https://archives.bulbagarden.net/wiki/Main_Page",
    note: "Cover and logo archive source.",
    accessedOn: SOURCE_DATE
  }
];

const DEFAULT_SOURCE_IDS = ["official-pokemon", "bulbapedia-games", "ign-mainline"];
const DEFAULT_METRIC_SOURCE_IDS = ["ign-mainline", "bulbapedia-games"];
const MEDIA_KIND_ORDER: GameMediaKind[] = ["cover_front", "logo", "screenshot", "key_art"];
const FALLBACK_TEXT = {
  unknown: "Unknown",
  tba: "TBA",
  notPublic: "Not publicly detailed"
} as const;

function buildMissingMediaAlt(kind: GameMediaKind, title: string) {
  if (kind === "cover_front") {
    return `Official cover front for ${title} is not publicly detailed in this module.`;
  }
  if (kind === "logo") {
    return `Official logo media for ${title} is not publicly detailed in this module.`;
  }
  if (kind === "screenshot") {
    return `Gameplay screenshot set for ${title} is not publicly detailed in this module.`;
  }
  return `Official key art for ${title} is not publicly detailed in this module.`;
}

function buildPlaceholderMediaItem(entry: MainlineGameCatalogEntry, kind: GameMediaKind): GameMediaItem {
  return {
    kind,
    src: null,
    alt: buildMissingMediaAlt(kind, entry.title),
    sourceIds: ["official-pokemon", "bulbagarden-archives"]
  };
}

const COMPANION_SLUGS: Record<string, string> = {
  "pokemon-red-version": "pokemon-blue-version",
  "pokemon-blue-version": "pokemon-red-version",
  "pokemon-gold-version": "pokemon-silver-version",
  "pokemon-silver-version": "pokemon-gold-version",
  "pokemon-ruby-version": "pokemon-sapphire-version",
  "pokemon-sapphire-version": "pokemon-ruby-version",
  "pokemon-firered-version": "pokemon-leafgreen-version",
  "pokemon-leafgreen-version": "pokemon-firered-version",
  "pokemon-diamond-version": "pokemon-pearl-version",
  "pokemon-pearl-version": "pokemon-diamond-version",
  "pokemon-heartgold-version": "pokemon-soulsilver-version",
  "pokemon-soulsilver-version": "pokemon-heartgold-version",
  "pokemon-black-version": "pokemon-white-version",
  "pokemon-white-version": "pokemon-black-version",
  "pokemon-black-version-2": "pokemon-white-version-2",
  "pokemon-white-version-2": "pokemon-black-version-2",
  "pokemon-x": "pokemon-y",
  "pokemon-y": "pokemon-x",
  "pokemon-omega-ruby-version": "pokemon-alpha-sapphire-version",
  "pokemon-alpha-sapphire-version": "pokemon-omega-ruby-version",
  "pokemon-sun-version": "pokemon-moon-version",
  "pokemon-moon-version": "pokemon-sun-version",
  "pokemon-ultra-sun-version": "pokemon-ultra-moon-version",
  "pokemon-ultra-moon-version": "pokemon-ultra-sun-version",
  "pokemon-lets-go-pikachu": "pokemon-lets-go-eevee",
  "pokemon-lets-go-eevee": "pokemon-lets-go-pikachu",
  "pokemon-sword": "pokemon-shield",
  "pokemon-shield": "pokemon-sword",
  "pokemon-brilliant-diamond": "pokemon-shining-pearl",
  "pokemon-shining-pearl": "pokemon-brilliant-diamond",
  "pokemon-scarlet": "pokemon-violet",
  "pokemon-violet": "pokemon-scarlet"
};

const MASCOT_OVERRIDES: Record<string, string[]> = {
  "pokemon-red-version": ["Charizard"],
  "pokemon-green-version": ["Venusaur"],
  "pokemon-blue-version": ["Blastoise"],
  "pokemon-yellow-special-pikachu-edition": ["Pikachu"],
  "pokemon-gold-version": ["Ho-Oh"],
  "pokemon-silver-version": ["Lugia"],
  "pokemon-crystal-version": ["Suicune"],
  "pokemon-ruby-version": ["Groudon"],
  "pokemon-sapphire-version": ["Kyogre"],
  "pokemon-firered-version": ["Charizard"],
  "pokemon-leafgreen-version": ["Venusaur"],
  "pokemon-emerald-version": ["Rayquaza"],
  "pokemon-diamond-version": ["Dialga"],
  "pokemon-pearl-version": ["Palkia"],
  "pokemon-platinum-version": ["Giratina"],
  "pokemon-heartgold-version": ["Ho-Oh"],
  "pokemon-soulsilver-version": ["Lugia"],
  "pokemon-black-version": ["Reshiram"],
  "pokemon-white-version": ["Zekrom"],
  "pokemon-black-version-2": ["Kyurem"],
  "pokemon-white-version-2": ["Kyurem"],
  "pokemon-x": ["Xerneas"],
  "pokemon-y": ["Yveltal"],
  "pokemon-omega-ruby-version": ["Groudon"],
  "pokemon-alpha-sapphire-version": ["Kyogre"],
  "pokemon-sun-version": ["Solgaleo"],
  "pokemon-moon-version": ["Lunala"],
  "pokemon-ultra-sun-version": ["Necrozma"],
  "pokemon-ultra-moon-version": ["Necrozma"],
  "pokemon-lets-go-pikachu": ["Pikachu"],
  "pokemon-lets-go-eevee": ["Eevee"],
  "pokemon-sword": ["Zacian"],
  "pokemon-shield": ["Zamazenta"],
  "pokemon-brilliant-diamond": ["Dialga"],
  "pokemon-shining-pearl": ["Palkia"],
  "pokemon-legends-arceus": ["Arceus"],
  "pokemon-scarlet": ["Koraidon"],
  "pokemon-violet": ["Miraidon"],
  "pokemon-legends-z-a": ["Zygarde (expected)"],
  "pokemon-legends-z-a-nintendo-switch-2-edition": ["Zygarde (expected)"],
  "pokemon-go": ["Pikachu"],
  "pokemon-masters-ex": ["Pikachu", "Trainers"],
  "pokemon-unite": ["Pikachu"],
  "pokemon-cafe-remix": ["Eevee"],
  "pokemon-sleep": ["Snorlax"],
  "pokemon-tcg-pocket": ["Charizard"]
};

const GENERATION_PROFILES: Record<string, GenerationProfile> = {
  gen1: {
    setting: "Kanto journey across eight gyms and Indigo Plateau progression.",
    keyFeatures: [
      "Original capture-and-battle structure",
      "Link cable trading and version exclusives",
      "Classic gym-to-league progression"
    ],
    starterPokemon: ["Bulbasaur", "Charmander", "Squirtle"],
    legendaryPokemon: ["Articuno", "Zapdos", "Moltres", "Mewtwo", "Mew"],
    mechanicsIntroduced: [
      "Version-exclusive encounter and trade loop",
      "Core type effectiveness matrix baseline",
      "Gym badge progression with HM gating"
    ],
    progressionOutline: [
      "Build starter team and clear early Kanto badges",
      "Advance through Rocket story checkpoints",
      "Challenge Indigo Plateau and Champion"
    ],
    keyHubs: ["Pallet Town", "Cerulean City", "Saffron City"],
    routeStructure: "Linear route progression with optional side caves and Seafoam branches.",
    standoutAreas: ["Silph Co.", "Pokemon Mansion", "Cerulean Cave"],
    sideModes: ["Link battles", "Trade collection", "Safari Zone capture loops"],
    onlineLocal: ["Local link cable battles", "Local link cable trading"],
    postgameProfile: [
      "Champion rematch optimization",
      "Mewtwo capture route",
      "Version completion through trading"
    ],
    pokedexDefaults: {
      regionalDexSize: "Kanto baseline (151)",
      newSpeciesCount: "151 baseline species",
      notableForms: ["No regional forms in this era"]
    }
  },
  gen2: {
    setting: "Johto campaign with a full Kanto postgame revisit.",
    keyFeatures: [
      "Day and night cycle",
      "Breeding and held items",
      "Dual-region endgame structure"
    ],
    starterPokemon: ["Chikorita", "Cyndaquil", "Totodile"],
    legendaryPokemon: ["Raikou", "Entei", "Suicune", "Lugia", "Ho-Oh", "Celebi"],
    mechanicsIntroduced: [
      "Breeding and egg groups",
      "Held item strategy layer",
      "Friendship and time-of-day encounter scheduling"
    ],
    progressionOutline: [
      "Complete Johto gym route and regional league",
      "Unlock Kanto revisit sequence",
      "Finish dual-region badge and champion arc"
    ],
    keyHubs: ["New Bark Town", "Goldenrod City", "Ecruteak City"],
    routeStructure: "Regional arc in Johto with an unlocked Kanto postgame branch.",
    standoutAreas: ["Whirl Islands", "Bell Tower", "Mt. Silver"],
    sideModes: ["Bug-Catching Contest", "Apricorn crafting", "Pokegear side calls"],
    onlineLocal: ["Local link battles", "Local link trades"],
    postgameProfile: [
      "Kanto gym completion",
      "Mt. Silver boss challenge",
      "Legendary roaming hunts"
    ],
    pokedexDefaults: {
      regionalDexSize: "Johto baseline with Kanto extension",
      newSpeciesCount: "100 species introduced",
      notableForms: ["Early gender differences"]
    }
  },
  gen3: {
    setting: "Hoenn adventure and Kanto remakes during the GBA era.",
    keyFeatures: [
      "Abilities and natures",
      "Contest side progression",
      "Early remake strategy with FireRed and LeafGreen"
    ],
    starterPokemon: ["Treecko", "Torchic", "Mudkip"],
    legendaryPokemon: [
      "Groudon",
      "Kyogre",
      "Rayquaza",
      "Regirock",
      "Regice",
      "Registeel",
      "Latios",
      "Latias"
    ],
    mechanicsIntroduced: [
      "Ability system",
      "Nature-based stat shaping",
      "Double battle support as a core format"
    ],
    progressionOutline: [
      "Progress through Hoenn gym circuit",
      "Resolve Team Aqua or Team Magma conflicts",
      "Advance into elite challenge and remake side arcs"
    ],
    keyHubs: ["Littleroot Town", "Slateport City", "Mossdeep City"],
    routeStructure: "Hybrid land and sea navigation with optional island detours.",
    standoutAreas: ["Sky Pillar", "Meteor Falls", "Sevii Islands"],
    sideModes: ["Pokemon Contests", "Secret Bases", "Battle Frontier (Emerald)"],
    onlineLocal: ["Local wireless support (remakes)", "Local trading and battles"],
    postgameProfile: [
      "Battle Frontier gauntlet",
      "Legendary cave and tower routes",
      "National Dex completion steps"
    ],
    pokedexDefaults: {
      regionalDexSize: "Hoenn dex variant by release",
      newSpeciesCount: "135 species introduced",
      notableForms: ["Deoxys form variants"]
    }
  },
  gen4: {
    setting: "Sinnoh and Johto with Nintendo DS online expansion.",
    keyFeatures: [
      "Physical and special move split",
      "Expanded online services",
      "High-content remake cycle in HeartGold and SoulSilver"
    ],
    starterPokemon: ["Turtwig", "Chimchar", "Piplup"],
    legendaryPokemon: ["Dialga", "Palkia", "Giratina", "Uxie", "Mesprit", "Azelf", "Arceus"],
    mechanicsIntroduced: [
      "Physical vs special move split",
      "Global Trade Station integration",
      "Expanded battle utility move balancing"
    ],
    progressionOutline: [
      "Complete Sinnoh gym progression and team conflict arcs",
      "Resolve Distortion World and lake guardian chapters",
      "Unlock postgame battle and migration loops"
    ],
    keyHubs: ["Twinleaf Town", "Jubilife City", "Canalave City"],
    routeStructure: "Route and cavern sequencing with heavy side dungeon branches.",
    standoutAreas: ["Distortion World", "Battle Frontier", "Safari Zone expansion"],
    sideModes: ["Underground exploration", "Wi-Fi battles", "Pokeathlon (Johto remakes)"],
    onlineLocal: ["Nintendo Wi-Fi battles", "Global Trade Station", "Local wireless"],
    postgameProfile: [
      "Battle Frontier and Battle Tower ladders",
      "Mythical and legendary hunt chains",
      "Expanded National Dex objectives"
    ],
    pokedexDefaults: {
      regionalDexSize: "Sinnoh baseline with expanded variants",
      newSpeciesCount: "107 species introduced",
      notableForms: ["Giratina Origin Forme", "Rotom appliances"]
    }
  },
  gen5: {
    setting: "Narrative-heavy Unova arc with direct sequels.",
    keyFeatures: [
      "Story-forward gym progression",
      "New regional dex focus at launch",
      "Direct sequel model with Black 2 and White 2"
    ],
    starterPokemon: ["Snivy", "Tepig", "Oshawott"],
    legendaryPokemon: ["Reshiram", "Zekrom", "Kyurem", "Cobalion", "Terrakion", "Virizion"],
    mechanicsIntroduced: [
      "Seasonal map rotation",
      "Triple and rotation battle formats",
      "Direct sequel continuity in same region"
    ],
    progressionOutline: [
      "Advance across Unova gym route and Team Plasma conflicts",
      "Resolve dragon trio story beats",
      "Continue with sequel campaign two years later"
    ],
    keyHubs: ["Nuvema Town", "Castelia City", "Opelucid City"],
    routeStructure: "Narrative-driven loop with denser city storytelling nodes.",
    standoutAreas: ["Relic Castle", "Victory Road", "White Forest or Black City"],
    sideModes: ["Pokemon World Tournament", "Join Avenue", "Musical theater content"],
    onlineLocal: ["Nintendo Wi-Fi services", "Infrared features", "Local wireless"],
    postgameProfile: [
      "Pokemon World Tournament runs",
      "Legendary and roaming chains",
      "Challenge mode and key system variants"
    ],
    pokedexDefaults: {
      regionalDexSize: "Unova dex with sequel expansion",
      newSpeciesCount: "156 species introduced",
      notableForms: ["Forces of Nature form changes", "Kyurem fusion forms"]
    }
  },
  gen6: {
    setting: "Kalos launch and Hoenn remake return on Nintendo 3DS.",
    keyFeatures: [
      "First full 3D mainline presentation",
      "Mega Evolution system",
      "Global release alignment for core versions"
    ],
    starterPokemon: ["Chespin", "Fennekin", "Froakie"],
    legendaryPokemon: ["Xerneas", "Yveltal", "Zygarde"],
    mechanicsIntroduced: [
      "Mega Evolution combat layer",
      "Fairy type integration",
      "Player Search System online flow"
    ],
    progressionOutline: [
      "Traverse Kalos gyms and Team Flare arc",
      "Unlock Mega evolution networks",
      "Explore postgame looker and remake episodes"
    ],
    keyHubs: ["Vaniville Town", "Lumiose City", "Mauville City (ORAS)"],
    routeStructure: "Region routes connected by central metropolis and remake hub loops.",
    standoutAreas: ["Terminus Cave", "Pokemon Village", "Sky Pillar remake route"],
    sideModes: ["Super Training", "PSS online features", "Horde battles"],
    onlineLocal: ["Online battle and trade features", "Local wireless", "StreetPass support"],
    postgameProfile: [
      "Battle Maison ladder",
      "Delta Episode (ORAS)",
      "Legendary portals and mirage spots"
    ],
    pokedexDefaults: {
      regionalDexSize: "Kalos dex split into multiple sections",
      newSpeciesCount: "72 species introduced",
      notableForms: ["Mega Evolutions", "Primal Reversions"]
    }
  },
  gen7: {
    setting: "Alola island challenge with Let's Go transition on Switch.",
    keyFeatures: [
      "Island trial progression",
      "Regional form expansion",
      "Cinematic storytelling direction"
    ],
    starterPokemon: ["Rowlet", "Litten", "Popplio"],
    legendaryPokemon: ["Solgaleo", "Lunala", "Necrozma", "Tapu Koko", "Tapu Lele", "Tapu Bulu", "Tapu Fini"],
    mechanicsIntroduced: [
      "Z-Move battle system",
      "Regional forms in core progression",
      "Ride Pokemon replacing HM travel"
    ],
    progressionOutline: [
      "Complete island trial sequence",
      "Resolve Aether and Ultra Beast chapters",
      "Finish champion and ultra postgame arcs"
    ],
    keyHubs: ["Iki Town", "Hauoli City", "Aether Paradise"],
    routeStructure: "Island-by-island progression replacing classic gym ladder flow.",
    standoutAreas: ["Ultra Space", "Poni Island", "Kanto revisit in Lets Go releases"],
    sideModes: ["Battle Tree", "Mantine Surf", "Festival Plaza"],
    onlineLocal: ["Festival Plaza online", "Local wireless", "GO-linked transfer in Lets Go"],
    postgameProfile: [
      "Battle Tree challenge circuits",
      "Ultra Beast hunt routes",
      "Episode RR and bonus challenge fights"
    ],
    pokedexDefaults: {
      regionalDexSize: "Alola dex and ultra expansion",
      newSpeciesCount: "88 species introduced",
      notableForms: ["Alolan forms", "Ultra Necrozma state"]
    }
  },
  gen8: {
    setting: "Galar, Sinnoh remakes, and Hisui exploration branch.",
    keyFeatures: [
      "Wild Area and raid loop in Galar",
      "Mainline remake cycle on Switch",
      "Legends branch focused on exploration flow"
    ],
    starterPokemon: ["Grookey", "Scorbunny", "Sobble"],
    legendaryPokemon: ["Zacian", "Zamazenta", "Eternatus", "Dialga", "Palkia", "Giratina", "Arceus"],
    mechanicsIntroduced: [
      "Dynamax and Gigantamax battles",
      "Wild Area free camera zones",
      "Action-assisted catching in Legends flow"
    ],
    progressionOutline: [
      "Complete Galar gym challenge and league structure",
      "Resolve macro cosmos and darkest day scenario",
      "Advance into DLC or legends-focused postgame arcs"
    ],
    keyHubs: ["Wedgehurst", "Motostoke", "Jubilife Village (Hisui)"],
    routeStructure: "Gym route progression with open exploration hubs and remake branch paths.",
    standoutAreas: ["Crown Tundra", "Isle of Armor", "Coronet Highlands"],
    sideModes: ["Max Raid Battles", "Dynamax Adventures", "Survey missions in Hisui"],
    onlineLocal: ["Y-Comm features", "Online raids", "Local co-op and trade"],
    postgameProfile: [
      "Legendary raid dens",
      "Battle Tower and ranked loops",
      "Legends request and alpha hunt paths"
    ],
    pokedexDefaults: {
      regionalDexSize: "Galar dex and branch-specific expansions",
      newSpeciesCount: "96 species introduced",
      notableForms: ["Gigantamax forms", "Hisuian forms"]
    }
  },
  gen9: {
    setting: "Paldea open-world campaign and Kalos-focused Legends continuation.",
    keyFeatures: [
      "Open-world route progression",
      "Three-path campaign structure",
      "Legends line continuation in Lumiose City"
    ],
    starterPokemon: ["Sprigatito", "Fuecoco", "Quaxly"],
    legendaryPokemon: ["Koraidon", "Miraidon", "Ogerpon", "Terapagos"],
    mechanicsIntroduced: [
      "Terastal battle transformation",
      "Open-world nonlinear progression",
      "Co-op open exploration sessions"
    ],
    progressionOutline: [
      "Advance victory road, titan, and starfall paths",
      "Complete Area Zero and champion phases",
      "Continue through DLC and legends continuation branches"
    ],
    keyHubs: ["Mesagoza", "Levincia", "Lumiose City (Legends branch)"],
    routeStructure: "Open-world traversal with optional order and branch objectives.",
    standoutAreas: ["Area Zero", "Kitakami", "Blueberry Academy"],
    sideModes: ["Tera Raid Battles", "Academy classes", "Union Circle co-op"],
    onlineLocal: ["Online tera raids", "Union Circle", "Pokemon HOME integration"],
    postgameProfile: [
      "5-star and 7-star raid cycles",
      "DLC epilogues and side legends",
      "Ranked battle ladder optimization"
    ],
    pokedexDefaults: {
      regionalDexSize: "Paldea dex with DLC expansions",
      newSpeciesCount: "120+ species introduced (incl. DLC updates)",
      notableForms: ["Paradox Pokemon", "Terapagos forms", "Ogerpon masks"]
    }
  },
  mobile: {
    setting: "Global mobile and live-service ecosystem with frequent online event rotations.",
    keyFeatures: [
      "Live-service seasonal updates",
      "Cross-session progression loops",
      "Frequent event cadence and rotating content"
    ],
    starterPokemon: ["Varies by title"],
    legendaryPokemon: ["Varies by event cycle"],
    mechanicsIntroduced: [
      "Touch-first session loops",
      "Daily task and reward cadence",
      "Ongoing content operations with limited-time events"
    ],
    progressionOutline: [
      "Complete onboarding systems and starter objectives",
      "Advance through recurring events and mode unlocks",
      "Optimize long-term account progression and roster growth"
    ],
    keyHubs: ["Global service regions", "In-app event hubs", "Seasonal challenge tabs"],
    routeStructure: "Session-based structure focused on persistent account progression rather than route-to-route map flow.",
    standoutAreas: ["Event calendars", "Ranked ladders", "Collection milestones"],
    sideModes: ["Daily missions", "Limited-time events", "Ranked ladders (title-dependent)"],
    onlineLocal: ["Online account progression", "Cloud sync (title-dependent)", "Cross-device play (title-dependent)"],
    postgameProfile: [
      "Endgame loops tied to season resets",
      "Roster optimization and long-term collection goals",
      "High-difficulty event and ranked challenges"
    ],
    pokedexDefaults: {
      regionalDexSize: "Not tied to a single regional dex",
      newSpeciesCount: "Varies by event rollout",
      notableForms: ["Live event variants", "Costume/event distributions"]
    }
  }
};

const DETAIL_OVERRIDES: Record<string, GameDetailOverride> = {
  "pokemon-green-version": {
    releaseDate: "1996 (Japan)",
    identity: {
      alternateTitles: ["Pocket Monsters Green (JP)"]
    },
    releaseMatrix: [
      {
        region: "JP",
        dateLabel: "1996",
        dateISO: null,
        notes: ["Japan-exclusive launch counterpart for first generation."],
        sourceIds: ["bulbapedia-games", "ign-mainline"]
      }
    ],
    importantNotes: [
      "Japan-exclusive companion launch version.",
      "Defined early exclusivity and trade-completion structure."
    ]
  },
  "pokemon-crystal-version": {
    classification: "Enhanced edition",
    releaseDate: "2000-2001",
    mechanicsIntroduced: [
      "Animated sprite presentation",
      "Expanded story branch around Suicune",
      "Refined balancing and pacing over Gold and Silver"
    ]
  },
  "pokemon-emerald-version": {
    classification: "Enhanced edition",
    releaseDate: "2004-2005",
    postgameProfile: [
      "Battle Frontier full ruleset gauntlet",
      "Expanded legendary capture routes",
      "Additional trainer and rematch loops"
    ]
  },
  "pokemon-platinum-version": {
    classification: "Enhanced edition",
    releaseDate: "2008-2009",
    worldProfile: {
      standoutAreas: ["Distortion World", "Survival Area", "Fight Area"]
    }
  },
  "pokemon-black-version-2": {
    classification: "Mainline direct sequel",
    releaseDate: "2012",
    storySummaryNoSpoiler:
      "Direct sequel set two years after the original Unova pair, expanding map access and progression flow without repeating the first campaign structure."
  },
  "pokemon-white-version-2": {
    classification: "Mainline direct sequel",
    releaseDate: "2012",
    storySummaryNoSpoiler:
      "Direct sequel set two years after the original Unova pair, with revised route access, alternate encounters, and extended postgame options."
  },
  "pokemon-lets-go-pikachu": {
    classification: "Mainline remake reinterpretation",
    identity: {
      alternateTitles: ["Lets Go, Pikachu!"],
      category: "remake"
    }
  },
  "pokemon-lets-go-eevee": {
    classification: "Mainline remake reinterpretation",
    identity: {
      alternateTitles: ["Lets Go, Eevee!"],
      category: "remake"
    }
  },
  "pokemon-brilliant-diamond": {
    classification: "Mainline remake",
    developers: ["ILCA", "Game Freak (supervision)"]
  },
  "pokemon-shining-pearl": {
    classification: "Mainline remake",
    developers: ["ILCA", "Game Freak (supervision)"]
  },
  "pokemon-legends-arceus": {
    classification: "Mainline-adjacent Legends release",
    identity: {
      category: "legends"
    },
    releaseDate: "2022",
    contentModes: {
      mainStory: "Survey-focused progression model with action catching and seamless field combat.",
      sideModes: ["Request board missions", "Alpha encounter loops", "Mass outbreak routing"],
      onlineLocal: ["Trade support", "Limited online exchange", "Home compatibility tracking"]
    }
  },
  "pokemon-legends-z-a": {
    classification: "Mainline-adjacent Legends release",
    identity: {
      category: "legends"
    },
    releaseDate: "2025",
    storySummaryNoSpoiler:
      "Legends-format continuation centered in Lumiose City, focused on urban redevelopment themes and historical-to-modern design transitions.",
    importantNotes: [
      "Launch details remain in-progress for full gameplay systems.",
      "This entry uses placeholders where official production details are still pending."
    ]
  },
  "pokemon-legends-z-a-nintendo-switch-2-edition": {
    classification: "Mainline-adjacent Legends release",
    identity: {
      alternateTitles: ["Pokemon Legends: Z-A (Nintendo Switch 2 Edition)"],
      category: "legends"
    },
    releaseDate: "2025",
    versionCompanionSlug: "pokemon-legends-z-a",
    importantNotes: [
      "Nintendo Switch 2 edition is listed as a separate mainline entry in IGN coverage.",
      "Technical specifications are provisional and may change closer to launch."
    ]
  },
  "pokemon-sword": {
    dlcAndPatchHistory: [
      "Expansion Pass: The Isle of Armor",
      "Expansion Pass: The Crown Tundra",
      "Ongoing event raid updates and balance patches"
    ]
  },
  "pokemon-shield": {
    dlcAndPatchHistory: [
      "Expansion Pass: The Isle of Armor",
      "Expansion Pass: The Crown Tundra",
      "Ongoing event raid updates and balance patches"
    ]
  },
  "pokemon-scarlet": {
    dlcAndPatchHistory: [
      "The Hidden Treasure of Area Zero - Part 1: The Teal Mask",
      "The Hidden Treasure of Area Zero - Part 2: The Indigo Disk",
      "Live tera raid and seasonal patch cadence"
    ]
  },
  "pokemon-violet": {
    dlcAndPatchHistory: [
      "The Hidden Treasure of Area Zero - Part 1: The Teal Mask",
      "The Hidden Treasure of Area Zero - Part 2: The Indigo Disk",
      "Live tera raid and seasonal patch cadence"
    ]
  },
  "pokemon-go": {
    classification: "Mobile live-service release",
    identity: { category: "mobile" },
    releaseDate: "2016",
    overview:
      "AR exploration live-service title focused on outdoor capture loops, raid rotations, and seasonal events.",
    contentModes: {
      mainStory: "Progression is driven by collection goals, field research chains, and seasonal questlines.",
      sideModes: ["GO Battle League", "Raid events", "Collection challenges"],
      onlineLocal: ["Global online events", "Local raid coordination", "Friend and trade systems"]
    }
  },
  "pokemon-masters-ex": {
    classification: "Mobile live-service release",
    identity: { category: "mobile" },
    releaseDate: "2019",
    overview:
      "Sync-pair battle RPG with rotating events, story chapters, and account-based progression on mobile.",
    contentModes: {
      mainStory: "Chapter progression on Pasio with sync-pair team building and role optimization.",
      sideModes: ["Legendary events", "Champion Stadium", "Battle Villa / rotating challenge modes"],
      onlineLocal: ["Online account progression", "Event synchronization", "Cloud save support"]
    }
  },
  "pokemon-unite": {
    classification: "Mobile live-service release",
    identity: { category: "mobile" },
    releaseDate: "2021",
    overview:
      "Team-based MOBA branch with objective map control, role drafting, and ranked season cadence.",
    contentModes: {
      mainStory: "Progression focuses on role mastery, ranked climbs, and seasonal reward tracks.",
      sideModes: ["Quick battles", "Limited-time modes", "Custom lobbies"],
      onlineLocal: ["Cross-platform matchmaking", "Ranked ladders", "Party queue support"]
    }
  },
  "pokemon-cafe-remix": {
    classification: "Mobile live-service release",
    identity: { category: "mobile" },
    releaseDate: "2020",
    overview:
      "Puzzle-management title with cafe staffing progression, event menus, and short-session play loops.",
    contentModes: {
      mainStory: "Serve themed orders, recruit Pokemon staff, and unlock cafe facilities.",
      sideModes: ["Event teams", "One-minute cooking", "Limited recruitment banners"],
      onlineLocal: ["Online event calendars", "Cloud progression", "Cross-device account sync"]
    }
  },
  "pokemon-sleep": {
    classification: "Mobile live-service release",
    identity: { category: "mobile" },
    releaseDate: "2023",
    overview:
      "Lifestyle service game centered on sleep tracking, daily routines, and long-term collection progression.",
    contentModes: {
      mainStory: "Track sleep sessions, attract sleep styles, and strengthen helper teams.",
      sideModes: ["Research rank milestones", "Weekly reports", "Event-week modifiers"],
      onlineLocal: ["Online account sync", "Timed event updates", "Profile tracking features"]
    }
  },
  "pokemon-tcg-pocket": {
    classification: "Mobile live-service release",
    identity: { category: "mobile" },
    releaseDate: "2024",
    overview:
      "Digital card-collection service featuring pack openings, compact battles, and event-driven card pools.",
    contentModes: {
      mainStory: "Daily pack cadence and collection progression drive long-term account growth.",
      sideModes: ["Compact PvP battles", "Themed missions", "Set-limited events"],
      onlineLocal: ["Online matchmaking", "Account sync", "Global event rollout"]
    }
  }
};

function toGameSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[':!,]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureArray(values: string[] | undefined, fallback: string[]) {
  const normalized = Array.isArray(values)
    ? values.map((value) => value.trim()).filter((value) => value.length > 0)
    : [];
  return normalized.length > 0 ? normalized : fallback;
}

function ensureSourceIds(values: string[] | undefined, fallback: string[]) {
  const normalized = Array.isArray(values)
    ? values.map((value) => value.trim()).filter((value) => value.length > 0)
    : [];
  return normalized.length > 0 ? normalized : fallback;
}

function ensureMetrics(values: GameMetric[] | undefined, fallback: GameMetric[]) {
  const normalized = Array.isArray(values)
    ? values
        .map((metric) => ({
          label: metric.label.trim() || "Metric",
          value: metric.value.trim() || FALLBACK_TEXT.unknown,
          asOf: metric.asOf || SOURCE_DATE,
          sourceIds: ensureSourceIds(metric.sourceIds, [...DEFAULT_METRIC_SOURCE_IDS])
        }))
        .filter((metric) => metric.label.length > 0 && metric.value.length > 0)
    : [];

  if (normalized.length > 0) {
    return normalized;
  }

  return fallback.map((metric) => ({
    label: metric.label.trim() || "Metric",
    value: metric.value.trim() || FALLBACK_TEXT.unknown,
    asOf: metric.asOf || SOURCE_DATE,
    sourceIds: ensureSourceIds(metric.sourceIds, [...DEFAULT_METRIC_SOURCE_IDS])
  }));
}

function inferIdentityCategory(title: string): GameIdentityCategory {
  if (/pokemon go|masters|unite|cafe remix|sleep|tcg pocket/i.test(title)) {
    return "mobile";
  }
  if (/legends/i.test(title)) {
    return "legends";
  }
  if (/firered|leafgreen|heartgold|soulsilver|omega ruby|alpha sapphire|brilliant diamond|shining pearl|lets go/i.test(title)) {
    return "remake";
  }
  if (/crystal|emerald|platinum|ultra/i.test(title)) {
    return "enhanced";
  }
  return "mainline";
}

function categoryToClassification(category: GameIdentityCategory) {
  if (category === "mobile") {
    return "Mobile live-service release";
  }
  if (category === "remake") {
    return "Mainline remake";
  }
  if (category === "enhanced") {
    return "Enhanced mainline edition";
  }
  if (category === "legends") {
    return "Mainline-adjacent Legends release";
  }
  return "Mainline RPG";
}

function inferMascots(slug: string) {
  return MASCOT_OVERRIDES[slug] ?? [FALLBACK_TEXT.unknown];
}

function buildMainlineCatalog() {
  const entries: MainlineGameCatalogEntry[] = [];
  let order = 1;

  for (const generation of MAINLINE_GENERATIONS) {
    for (const release of generation.releases) {
      entries.push({
        slug: toGameSlug(release.title),
        order,
        title: release.title,
        generationKey: generation.key,
        generationLabel: generation.generationLabel,
        regionLabel: generation.regionLabel,
        eraLabel: generation.eraLabel,
        platform: release.platform,
        releaseWindow: release.releaseWindow,
        note: release.note,
        imageSrc: release.imageSrc,
        imageAlt: release.imageAlt
      });
      order += 1;
    }
  }

  return entries;
}

function buildMobileCatalog(startOrder: number) {
  let order = startOrder;
  return MOBILE_AND_SERVICE_GAMES.map<MainlineGameCatalogEntry>((entry) => {
    const mobileCatalogEntry: MainlineGameCatalogEntry = {
      slug: toGameSlug(entry.title),
      order,
      title: entry.title,
      generationKey: "mobile",
      generationLabel: "Mobile & Live Service",
      regionLabel: "Global",
      eraLabel: entry.launchLabel,
      platform: entry.platform,
      releaseWindow: entry.launchLabel,
      note: `${entry.category}: ${entry.loop}`,
      imageSrc: entry.imageSrc,
      imageAlt: entry.imageAlt
    };
    order += 1;
    return mobileCatalogEntry;
  });
}

export const MAINLINE_GAME_CATALOG: MainlineGameCatalogEntry[] = buildMainlineCatalog();
export const MOBILE_GAME_CATALOG: MainlineGameCatalogEntry[] = buildMobileCatalog(MAINLINE_GAME_CATALOG.length + 1);
export const ALL_GAME_CATALOG: MainlineGameCatalogEntry[] = [...MAINLINE_GAME_CATALOG, ...MOBILE_GAME_CATALOG];

const ALL_GAME_MAP = new Map(ALL_GAME_CATALOG.map((entry) => [entry.slug, entry] as const));

function buildDefaultReleaseMatrix(entry: MainlineGameCatalogEntry): RegionalRelease[] {
  return [
    {
      region: "Global",
      dateLabel: entry.releaseWindow,
      dateISO: null,
      notes: [
        `Release window tracked as ${entry.releaseWindow}.`,
        "Region-specific exact dates use placeholders when not yet confirmed in this module."
      ],
      sourceIds: [...DEFAULT_SOURCE_IDS]
    }
  ];
}

function buildDefaultVersionDifferences(
  entry: MainlineGameCatalogEntry,
  companionTitle: string | null
): GameVersionDifference[] {
  if (companionTitle) {
    return [
      {
        category: "Version Pair Split",
        leftVersion: entry.title,
        rightVersion: companionTitle,
        notes:
          "Version pair differences usually include encounter pools, event pacing, and mascot routing. See references for pair-level detail.",
        sourceIds: [...DEFAULT_SOURCE_IDS]
      }
    ];
  }

  return [
    {
      category: "Version Differences",
      leftVersion: entry.title,
      rightVersion: "N/A",
      notes: "No direct paired counterpart is publicly detailed for this release line.",
      sourceIds: [...DEFAULT_SOURCE_IDS]
    }
  ];
}

function buildDefaultMediaGallery(entry: MainlineGameCatalogEntry): GameMediaItem[] {
  return [
    {
      kind: "cover_front",
      src: entry.imageSrc,
      alt: entry.imageAlt,
      sourceIds: ["ign-mainline", "bulbagarden-archives"]
    },
    buildPlaceholderMediaItem(entry, "logo"),
    buildPlaceholderMediaItem(entry, "screenshot"),
    buildPlaceholderMediaItem(entry, "key_art")
  ];
}

function buildDefaultSectionSourceMap(): Record<GameEntrySectionKey, string[]> {
  return {
    identity: [...DEFAULT_SOURCE_IDS],
    release_matrix: [...DEFAULT_SOURCE_IDS],
    version_differences: [...DEFAULT_SOURCE_IDS],
    core_mechanics: ["official-pokemon", "bulbapedia-games"],
    pokedex_data: ["official-pokemon", "bulbapedia-games"],
    story_progression: ["official-pokemon", "bulbapedia-games"],
    world_map: ["official-pokemon", "bulbapedia-games"],
    content_modes: ["official-pokemon", "ign-mainline"],
    postgame: ["bulbapedia-games", "ign-mainline"],
    connectivity: ["pokemon-home", "official-pokemon"],
    technical_profile: ["official-nintendo", "ign-mainline"],
    dlc_updates: ["official-pokemon", "official-nintendo"],
    reception_sales: [...DEFAULT_METRIC_SOURCE_IDS],
    media_gallery: ["ign-mainline", "bulbagarden-archives"],
    references_verification: ["official-pokemon", "bulbapedia-games", "ign-mainline"]
  };
}

function buildDetail(entry: MainlineGameCatalogEntry): MainlineGameDetailEntry {
  const generationProfile = GENERATION_PROFILES[entry.generationKey] ?? GENERATION_PROFILES.mobile;
  const override = DETAIL_OVERRIDES[entry.slug] ?? {};

  const siblingSlugs = ALL_GAME_CATALOG.filter(
    (candidate) => candidate.generationKey === entry.generationKey && candidate.slug !== entry.slug
  ).map((candidate) => candidate.slug);

  const versionCompanionSlug =
    override.versionCompanionSlug !== undefined
      ? override.versionCompanionSlug
      : (COMPANION_SLUGS[entry.slug] ?? null);
  const versionCompanionTitle = versionCompanionSlug
    ? (ALL_GAME_MAP.get(versionCompanionSlug)?.title ?? null)
    : null;

  const relatedSlugs =
    override.relatedSlugs ??
    [
      ...(versionCompanionSlug ? [versionCompanionSlug] : []),
      ...siblingSlugs.filter((slug) => slug !== versionCompanionSlug).slice(0, 3)
    ];

  const inferredCategory = inferIdentityCategory(entry.title);
  const identityCategory = override.identity?.category ?? inferredCategory;

  const identity: GameIdentityProfile = {
    officialTitle: override.identity?.officialTitle ?? entry.title,
    alternateTitles: ensureArray(override.identity?.alternateTitles, [FALLBACK_TEXT.notPublic]),
    mascots: ensureArray(override.identity?.mascots, inferMascots(entry.slug)),
    category: identityCategory
  };

  const classification = override.classification ?? categoryToClassification(identity.category);
  const releaseDate = override.releaseDate ?? entry.releaseWindow;
  const developers = ensureArray(override.developers, ["Game Freak"]);
  const publisher = (override.publisher ?? "Nintendo / The Pokemon Company").trim() || "Nintendo / The Pokemon Company";

  const overview =
    (override.overview ??
      `${entry.note} This entry belongs to ${entry.generationLabel} in the ${entry.regionLabel} branch.`)
      .trim() || FALLBACK_TEXT.notPublic;

  const setting = (override.setting ?? generationProfile.setting).trim() || FALLBACK_TEXT.notPublic;
  const keyFeatures = ensureArray(override.keyFeatures, generationProfile.keyFeatures);
  const starterPokemon = ensureArray(override.starterPokemon, generationProfile.starterPokemon);
  const legendaryPokemon = ensureArray(override.legendaryPokemon, generationProfile.legendaryPokemon);

  const releaseMatrix = (override.releaseMatrix ?? buildDefaultReleaseMatrix(entry)).map((row) => ({
    region: row.region,
    dateLabel: row.dateLabel.trim() || FALLBACK_TEXT.unknown,
    dateISO: row.dateISO,
    notes: ensureArray(row.notes, [FALLBACK_TEXT.notPublic]),
    sourceIds: ensureSourceIds(row.sourceIds, [...DEFAULT_SOURCE_IDS])
  }));

  const versionDifferences = (
    override.versionDifferences ?? buildDefaultVersionDifferences(entry, versionCompanionTitle)
  ).map((row) => ({
    category: row.category.trim() || "Version Differences",
    leftVersion: row.leftVersion.trim() || entry.title,
    rightVersion: row.rightVersion.trim() || "N/A",
    notes: row.notes.trim() || FALLBACK_TEXT.notPublic,
    sourceIds: ensureSourceIds(row.sourceIds, [...DEFAULT_SOURCE_IDS])
  }));

  const mechanicsIntroduced = ensureArray(override.mechanicsIntroduced, generationProfile.mechanicsIntroduced);

  const pokedexProfile: GamePokedexProfile = {
    regionalDexSize:
      override.pokedexProfile?.regionalDexSize?.trim() || generationProfile.pokedexDefaults.regionalDexSize,
    newSpeciesCount:
      override.pokedexProfile?.newSpeciesCount?.trim() || generationProfile.pokedexDefaults.newSpeciesCount,
    notableForms: ensureArray(
      override.pokedexProfile?.notableForms,
      generationProfile.pokedexDefaults.notableForms
    ),
    starterPokemon: ensureArray(override.pokedexProfile?.starterPokemon, starterPokemon),
    legendaryPokemon: ensureArray(override.pokedexProfile?.legendaryPokemon, legendaryPokemon)
  };

  const storySummaryNoSpoiler =
    (override.storySummaryNoSpoiler ??
      `${entry.note} The campaign follows the ${entry.regionLabel} progression while keeping key late-game twists undisclosed in this module.`)
      .trim() || FALLBACK_TEXT.notPublic;

  const progressionOutline = ensureArray(override.progressionOutline, generationProfile.progressionOutline);

  const worldProfile: GameWorldProfile = {
    primaryRegion: override.worldProfile?.primaryRegion?.trim() || entry.regionLabel,
    keyHubs: ensureArray(override.worldProfile?.keyHubs, generationProfile.keyHubs),
    routeStructure: override.worldProfile?.routeStructure?.trim() || generationProfile.routeStructure,
    standoutAreas: ensureArray(override.worldProfile?.standoutAreas, generationProfile.standoutAreas)
  };

  const contentModes: GameContentModes = {
    mainStory:
      override.contentModes?.mainStory?.trim() ||
      "Main story progression follows the core RPG campaign structure for this release branch.",
    sideModes: ensureArray(override.contentModes?.sideModes, generationProfile.sideModes),
    onlineLocal: ensureArray(override.contentModes?.onlineLocal, generationProfile.onlineLocal)
  };

  const postgameProfile = ensureArray(override.postgameProfile, generationProfile.postgameProfile);

  const connectivityProfile: GameConnectivityProfile = {
    pokemonHome:
      override.connectivityProfile?.pokemonHome?.trim() ||
      (entry.platform.includes("Switch")
        ? "Pokemon HOME compatibility is available for supported releases. Check official compatibility matrix per title version."
        : "Pokemon HOME is not native for this launch platform generation."),
    transferRoute:
      override.connectivityProfile?.transferRoute?.trim() ||
      "Transfer pathways vary by generation and may require legacy bridge tools or platform services.",
    eventDistribution:
      override.connectivityProfile?.eventDistribution?.trim() ||
      "Online and local event distribution availability depends on official campaign windows."
  };

  const technicalProfile: GameTechnicalProfile = {
    renderTarget:
      override.technicalProfile?.renderTarget?.trim() ||
      (entry.platform.includes("Switch")
        ? "Modern console handheld profile; exact render targets vary by release and patch."
        : "Legacy handheld presentation profile; platform-specific output constraints apply."),
    performanceNotes: ensureArray(override.technicalProfile?.performanceNotes, [
      "Performance characteristics depend on platform hardware and patch state.",
      "No uncited frame-time claims are shown in this module."
    ]),
    knownIssues: ensureArray(override.technicalProfile?.knownIssues, [
      "Known issue tracking requires title-specific patch notes and official support bulletins.",
      "Not publicly detailed beyond verified references."
    ])
  };

  const dlcAndPatchHistory = ensureArray(override.dlcAndPatchHistory, [
    "No major DLC program is publicly listed for this entry.",
    "Patch cadence and event updates may vary by region and distribution cycle."
  ]);

  const receptionAndSales = ensureMetrics(
    override.receptionAndSales,
    [
      {
        label: "Critical reception snapshot",
        value: FALLBACK_TEXT.notPublic,
        asOf: SOURCE_DATE,
        sourceIds: [...DEFAULT_METRIC_SOURCE_IDS]
      },
      {
        label: "Lifetime sales snapshot",
        value: FALLBACK_TEXT.unknown,
        asOf: SOURCE_DATE,
        sourceIds: [...DEFAULT_METRIC_SOURCE_IDS]
      }
    ]
  );

  const mediaGalleryBase = override.mediaGallery ?? buildDefaultMediaGallery(entry);
  const mediaGallery = mediaGalleryBase.slice(0, 4).map((item) => ({
    kind: item.kind,
    src:
      typeof item.src === "string" && item.src.trim().length > 0
        ? item.src.trim()
        : null,
    alt: item.alt.trim() || buildMissingMediaAlt(item.kind, entry.title),
    sourceIds: ensureSourceIds(item.sourceIds, ["ign-mainline", "bulbagarden-archives"])
  }));

  const seenMediaSrc = new Set<string>();
  for (const item of mediaGallery) {
    if (!item.src) {
      continue;
    }
    if (seenMediaSrc.has(item.src)) {
      item.src = null;
      item.alt = buildMissingMediaAlt(item.kind, entry.title);
      item.sourceIds = ensureSourceIds(item.sourceIds, ["official-pokemon", "bulbagarden-archives"]);
      continue;
    }
    seenMediaSrc.add(item.src);
  }

  const presentKinds = new Set(mediaGallery.map((item) => item.kind));
  for (const kind of MEDIA_KIND_ORDER) {
    if (mediaGallery.length >= 4) {
      break;
    }
    if (!presentKinds.has(kind)) {
      mediaGallery.push(buildPlaceholderMediaItem(entry, kind));
      presentKinds.add(kind);
    }
  }

  while (mediaGallery.length < 4) {
    mediaGallery.push(buildPlaceholderMediaItem(entry, "key_art"));
  }

  const sectionSourceMapDefaults = buildDefaultSectionSourceMap();
  const sectionSourceMap = GAME_ENTRY_SECTION_KEYS.reduce<Record<GameEntrySectionKey, string[]>>((acc, key) => {
    acc[key] = ensureSourceIds(override.sectionSourceMap?.[key], sectionSourceMapDefaults[key]);
    return acc;
  }, {} as Record<GameEntrySectionKey, string[]>);

  const importantNotes = ensureArray(override.importantNotes, [
    `${entry.generationLabel} timeline: ${entry.eraLabel}.`,
    `Platform focus: ${entry.platform}.`,
    `Core note: ${entry.note}`
  ]);

  const lastVerifiedOn = override.lastVerifiedOn ?? SOURCE_DATE;
  const references = GAME_SOURCE_REGISTRY.slice();

  return {
    ...entry,
    classification,
    releaseDate,
    developers,
    publisher,
    overview,
    setting,
    keyFeatures,
    starterPokemon,
    legendaryPokemon,
    versionCompanionSlug,
    versionCompanionTitle,
    relatedSlugs,
    importantNotes,
    references,
    identity,
    releaseMatrix,
    versionDifferences,
    mechanicsIntroduced,
    pokedexProfile,
    storySummaryNoSpoiler,
    progressionOutline,
    worldProfile,
    contentModes,
    postgameProfile,
    connectivityProfile,
    technicalProfile,
    dlcAndPatchHistory,
    receptionAndSales,
    mediaGallery,
    sectionSourceMap,
    lastVerifiedOn
  };
}

export const MAINLINE_GAME_DETAILS: MainlineGameDetailEntry[] = MAINLINE_GAME_CATALOG.map(buildDetail);
export const MOBILE_GAME_DETAILS: MainlineGameDetailEntry[] = MOBILE_GAME_CATALOG.map(buildDetail);
export const ALL_GAME_DETAILS: MainlineGameDetailEntry[] = [...MAINLINE_GAME_DETAILS, ...MOBILE_GAME_DETAILS];

export function getMainlineGameBySlug(slug: string) {
  return ALL_GAME_MAP.get(slug) ?? null;
}

export function getMainlineGameDetailBySlug(slug: string) {
  return ALL_GAME_DETAILS.find((entry) => entry.slug === slug) ?? null;
}

export function getGameSourceById(sourceId: string) {
  return GAME_SOURCE_REGISTRY.find((source) => source.id === sourceId) ?? null;
}
