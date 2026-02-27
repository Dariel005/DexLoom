import {
  type PokemonRegionMapDetail,
  type PokemonRegionMapKey,
  type PokemonRegionMapPoint
} from "@/types/map";

function normalize(value: string) {
  return value.toLowerCase().trim();
}

export const REGION_MAPS: PokemonRegionMapDetail[] = [
  {
    id: 1,
    key: "kanto",
    name: "Kanto",
    generationLabel: "Generation I",
    eraLabel: "Core Region",
    debutGames: ["Pokemon Red/Green/Blue", "Pokemon Yellow"],
    revisitGames: ["FireRed/LeafGreen", "HeartGold/SoulSilver (post-game)", "Lets Go Pikachu/Eevee"],
    mapImageUrl: "https://archives.bulbagarden.net/media/upload/7/78/Kanto.png",
    mapImageAlt: "Kanto world map",
    mapImageCredit: "Bulbagarden Archives",
    sourceUrl: "https://bulbapedia.bulbagarden.net/wiki/Kanto",
    professor: "Professor Oak",
    leagueHQ: "Indigo Plateau",
    champion: "Blue (Gen I) / Trace (Lets Go)",
    villainTeams: ["Team Rocket"],
    starterPokemon: ["Bulbasaur", "Charmander", "Squirtle", "Pikachu", "Eevee"],
    pokedexSize: 151,
    gymCount: 8,
    trialCount: 0,
    routeCount: 25,
    environmentTags: ["temperate", "coastal", "urban corridors", "cave systems"],
    worldStyle: "Compact route loop with strong city-to-city identity and low traversal friction.",
    progressionStyle: "Gym-driven progression with classic HM gates and optional side-route detours.",
    narrativeRole: "Foundation region for the League formula and early Team Rocket conflict arcs.",
    animeFocus: "Indigo League and Orange transition setup.",
    keyCities: [
      { name: "Pallet Town", role: "Starting town", highlight: "Trainer origin and Oak laboratory." },
      { name: "Cerulean City", role: "Early strategic pivot", highlight: "Water Gym and approach to Nugget Bridge." },
      { name: "Celadon City", role: "Commerce hub", highlight: "Department Store, Game Corner, Team Rocket hideout." },
      { name: "Saffron City", role: "Central metro", highlight: "Silph Co. crisis and Sabrina Gym." },
      { name: "Viridian City", role: "League gateway", highlight: "Final Gym and route to Victory Road." }
    ],
    landmarks: [
      { name: "Mt. Moon", category: "Dungeon", summary: "Fossil split and first major cave challenge." },
      { name: "Rock Tunnel", category: "Dungeon", summary: "Dark traversal segment that tests item prep." },
      { name: "Safari Zone", category: "Facility", summary: "Unique capture rules and hidden HM progression." },
      { name: "Seafoam Islands", category: "Dungeon", summary: "Ice currents puzzle and legendary encounter route." },
      { name: "Cerulean Cave", category: "Legendary", summary: "Late-game high-level cave with Mewtwo lore weight." }
    ],
    travelNetwork: [
      { method: "Walking", coverage: "All main routes", note: "Baseline exploration and trainer progression." },
      { method: "Bicycle", coverage: "Cycling Road + long roads", note: "Major speed boost for mid-game loops." },
      { method: "Surf", coverage: "Sea routes and islands", note: "Unlocks Cinnabar approach and optional zones." },
      { method: "Fly", coverage: "City fast-travel", note: "Reduces backtracking overhead in late game." }
    ],
    explorerTips: [
      "Prioritize Cut and Surf timing to avoid unnecessary route backtracking.",
      "Use Celadon as your shopping and TM optimization checkpoint.",
      "Prepare status healing before Rock Tunnel and sea route chains."
    ],
    loreHighlights: [
      "Silph Co. incident establishes Team Rocket as a city-scale threat.",
      "Cinnabar Mansion notes tie Mew and Mewtwo to early genetic lore.",
      "Indigo Plateau links Kanto and Johto into a shared League structure."
    ],
    searchTags: ["gen1", "indigo", "rocket", "kanto", "classic", "oak"]
  },
  {
    id: 2,
    key: "johto",
    name: "Johto",
    generationLabel: "Generation II",
    eraLabel: "Core Region",
    debutGames: ["Pokemon Gold/Silver", "Pokemon Crystal"],
    revisitGames: ["HeartGold/SoulSilver"],
    mapImageUrl: "https://archives.bulbagarden.net/media/upload/0/04/Johto.png",
    mapImageAlt: "Johto world map",
    mapImageCredit: "Bulbagarden Archives",
    sourceUrl: "https://bulbapedia.bulbagarden.net/wiki/Johto",
    professor: "Professor Elm",
    leagueHQ: "Indigo Plateau",
    champion: "Lance",
    villainTeams: ["Team Rocket (remnants)"],
    starterPokemon: ["Chikorita", "Cyndaquil", "Totodile"],
    pokedexSize: 100,
    gymCount: 8,
    trialCount: 0,
    routeCount: 29,
    environmentTags: ["traditional towns", "historic shrines", "forests", "sea inlets"],
    worldStyle: "Cultural region with compact towns and strong lore-driven landmarks.",
    progressionStyle: "Balanced gym loop with optional side ruins and post-game expansion into Kanto.",
    narrativeRole: "Bridges original and modern eras while deepening mythic narrative with tower lore.",
    animeFocus: "Johto Journeys and Silver Conference arcs.",
    keyCities: [
      { name: "New Bark Town", role: "Starting town", highlight: "Elm lab and Johto starter handoff." },
      { name: "Violet City", role: "Early growth checkpoint", highlight: "Sprout Tower and first Gym challenge." },
      { name: "Ecruteak City", role: "Lore center", highlight: "Kimono heritage, Burned Tower, Bell Tower roots." },
      { name: "Goldenrod City", role: "Urban systems hub", highlight: "Radio Tower, Department Store, transport links." },
      { name: "Blackthorn City", role: "Late-game gate", highlight: "Dragon Gym and path to Victory Road." }
    ],
    landmarks: [
      { name: "Ruins of Alph", category: "Ancient Site", summary: "Puzzle chambers with Unknown lore." },
      { name: "Bell Tower", category: "Legendary", summary: "Ho-Oh narrative anchor and spiritual heritage site." },
      { name: "Whirl Islands", category: "Dungeon", summary: "Lugia route with multi-room water navigation." },
      { name: "Lake of Rage", category: "Event Zone", summary: "Red Gyarados trigger and Rocket subplot." },
      { name: "Mt. Silver", category: "Endgame", summary: "Final challenge area with the highest-level trainer fight." }
    ],
    travelNetwork: [
      { method: "Walking", coverage: "Primary Johto path", note: "Short route chains keep momentum fast." },
      { method: "Bicycle", coverage: "Cross-region roads", note: "Best used when revisiting Goldenrod and adjacent routes." },
      { method: "Surf/Waterfall/Whirlpool", coverage: "Sea and cave access", note: "Unlocks Whirl Islands and hidden water paths." },
      { method: "Magnet Train/Fly", coverage: "Inter-region travel", note: "Late route between Johto and Kanto hubs." }
    ],
    explorerTips: [
      "Clear Radio Tower events quickly to keep badge pacing smooth.",
      "Use Goldenrod as your long-term item, storage, and move optimization base.",
      "Reserve Waterfall route prep before pushing toward League completion."
    ],
    loreHighlights: [
      "Burned Tower event threads Johto legends into modern Team Rocket fallout.",
      "Kimono tradition and tower history reinforce Johto spiritual identity.",
      "Kanto post-game reinforces the two-region continuity arc."
    ],
    searchTags: ["gen2", "johto", "lance", "elm", "rocket remnants", "tower lore"]
  },
  {
    id: 3,
    key: "hoenn",
    name: "Hoenn",
    generationLabel: "Generation III",
    eraLabel: "Core Region",
    debutGames: ["Pokemon Ruby/Sapphire", "Pokemon Emerald"],
    revisitGames: ["Omega Ruby/Alpha Sapphire"],
    mapImageUrl: "https://archives.bulbagarden.net/media/upload/8/80/Hoenn_ORAS_Map.png",
    mapImageAlt: "Hoenn world map",
    mapImageCredit: "Bulbagarden Archives",
    sourceUrl: "https://bulbapedia.bulbagarden.net/wiki/Hoenn",
    professor: "Professor Birch",
    leagueHQ: "Ever Grande City",
    champion: "Steven Stone / Wallace",
    villainTeams: ["Team Magma", "Team Aqua"],
    starterPokemon: ["Treecko", "Torchic", "Mudkip"],
    pokedexSize: 135,
    gymCount: 8,
    trialCount: 0,
    routeCount: 34,
    environmentTags: ["tropical sea", "volcanic zones", "rainforest routes", "offshore islands"],
    worldStyle: "Water-heavy macro map with multi-climate subregions and deep optional traversal.",
    progressionStyle: "Gym progression mixed with weather-team conflict and sea-route branching.",
    narrativeRole: "Weather and ecology conflict region that expands world-scale stakes.",
    animeFocus: "Advanced Generation arc and Battle Frontier transition.",
    keyCities: [
      { name: "Littleroot Town", role: "Starting town", highlight: "Birch origin point and initial route fork." },
      { name: "Rustboro City", role: "Early build hub", highlight: "School, Devon systems, and first broad utility checks." },
      { name: "Mauville City", role: "Transport node", highlight: "Central electric hub with route branching." },
      { name: "Fortree City", role: "Mid-game adaptation test", highlight: "Tree-top city with weather route pressure." },
      { name: "Sootopolis City", role: "Legendary pivot", highlight: "Climactic weather storyline checkpoint." }
    ],
    landmarks: [
      { name: "Mt. Chimney", category: "Volcanic Zone", summary: "Magma/Aqua escalation and terrain contrast." },
      { name: "Meteor Falls", category: "Dungeon", summary: "Story-lore bridge and repeatable exploration area." },
      { name: "Sky Pillar", category: "Legendary", summary: "Rayquaza narrative endpoint." },
      { name: "Seafloor Cavern", category: "Dungeon", summary: "Late conflict zone tied to primal legends." },
      { name: "Battle Frontier", category: "Facility", summary: "Post-game strategic depth in Emerald and ORAS extras." }
    ],
    travelNetwork: [
      { method: "Walking", coverage: "Inland routes", note: "Core gym progression path and town transitions." },
      { method: "Bicycle (Mach/Acro)", coverage: "Trick terrain", note: "Two-bike system changes puzzle routing." },
      { method: "Surf/Dive/Waterfall", coverage: "Sea route network", note: "Essential for eastern ocean and secret areas." },
      { method: "Fly", coverage: "Rapid loop control", note: "Best for revisiting spread-out coastal hubs." }
    ],
    explorerTips: [
      "Carry broad type coverage before long ocean segments.",
      "Switch between Mach and Acro bike depending on puzzle needs.",
      "Use weather route prep items to reduce attrition in long stretches."
    ],
    loreHighlights: [
      "Primal weather narrative frames land-vs-sea ideology conflict.",
      "Rayquaza functions as high-order balance force in regional myth.",
      "Hoenn sea density shapes route pacing more than any prior region."
    ],
    searchTags: ["gen3", "hoenn", "birch", "aqua", "magma", "weather"]
  },
  {
    id: 4,
    key: "sinnoh",
    name: "Sinnoh",
    generationLabel: "Generation IV",
    eraLabel: "Core Region",
    debutGames: ["Pokemon Diamond/Pearl", "Pokemon Platinum"],
    revisitGames: ["Brilliant Diamond/Shining Pearl", "Legends: Arceus (historic era link)"],
    mapImageUrl: "https://archives.bulbagarden.net/media/upload/a/ac/Sinnoh.png",
    mapImageAlt: "Sinnoh world map",
    mapImageCredit: "Bulbagarden Archives",
    sourceUrl: "https://bulbapedia.bulbagarden.net/wiki/Sinnoh",
    professor: "Professor Rowan",
    leagueHQ: "Pokemon League (north of Route 223)",
    champion: "Cynthia",
    villainTeams: ["Team Galactic"],
    starterPokemon: ["Turtwig", "Chimchar", "Piplup"],
    pokedexSize: 107,
    gymCount: 8,
    trialCount: 0,
    routeCount: 30,
    environmentTags: ["mountain barrier", "snow belts", "lakes", "industrial coasts"],
    worldStyle: "Two-halves regional design split by Mt. Coronet and reconnected via progression tools.",
    progressionStyle: "Badge route with geographic choke points and lore dungeons tied to Galactic plots.",
    narrativeRole: "Myth-heavy region focused on creation legends and dimensional stakes.",
    animeFocus: "Diamond and Pearl saga with major League and contest arcs.",
    keyCities: [
      { name: "Twinleaf Town", role: "Starting town", highlight: "Calm origin before lake-legends inciting event." },
      { name: "Jubilife City", role: "Urban media core", highlight: "Tech and social hub with recurring NPC systems." },
      { name: "Hearthome City", role: "Culture center", highlight: "Contest infrastructure and route crossroads." },
      { name: "Canalave City", role: "Knowledge gateway", highlight: "Library lore and access to Iron Island routes." },
      { name: "Snowpoint City", role: "Northern challenge", highlight: "Ice Gym and pressure-heavy snow traversal." }
    ],
    landmarks: [
      { name: "Mt. Coronet", category: "Mountain Spine", summary: "Central divider controlling region pacing." },
      { name: "Spear Pillar", category: "Legendary", summary: "Creation trio confrontation site." },
      { name: "Distortion World", category: "Dimensional Zone", summary: "Platinum-exclusive spatial puzzle realm." },
      { name: "Great Marsh", category: "Facility", summary: "Safari-style biome capture zone." },
      { name: "Fuego Ironworks", category: "Industrial", summary: "Optional utility and item-rich route branch." }
    ],
    travelNetwork: [
      { method: "Walking", coverage: "Base route network", note: "Linear early path with later split reconnection." },
      { method: "Bicycle", coverage: "Cycling Road and distance routes", note: "High efficiency for loop cleanup." },
      { method: "Surf/Climb/Defog", coverage: "Expanded terrain control", note: "Key to caves, lakes, and summit access." },
      { method: "Fly", coverage: "Late-game map compression", note: "Critical for multi-front Team Galactic events." }
    ],
    explorerTips: [
      "Prepare anti-ice and anti-ground coverage before northern push.",
      "Use Mt. Coronet accesses progressively; not all shortcuts are open early.",
      "Collect utility moves early to reduce return-path friction."
    ],
    loreHighlights: [
      "Lake guardians and creation trio define cosmology focus.",
      "Galactic story escalates from tech theft to world rewrites.",
      "Sinnoh geography itself is a progression gate, not just scenery."
    ],
    searchTags: ["gen4", "sinnoh", "cynthia", "galactic", "coronet", "dialga"]
  },
  {
    id: 5,
    key: "unova",
    name: "Unova",
    generationLabel: "Generation V",
    eraLabel: "Core Region",
    debutGames: ["Pokemon Black/White", "Pokemon Black 2/White 2"],
    revisitGames: ["Black 2/White 2 (time skip map updates)"],
    mapImageUrl: "https://archives.bulbagarden.net/media/upload/b/b4/Unova.png",
    mapImageAlt: "Unova world map",
    mapImageCredit: "Bulbagarden Archives",
    sourceUrl: "https://bulbapedia.bulbagarden.net/wiki/Unova",
    professor: "Professor Juniper",
    leagueHQ: "Pokemon League (northwest mountain chain)",
    champion: "Alder / Iris",
    villainTeams: ["Team Plasma"],
    starterPokemon: ["Snivy", "Tepig", "Oshawott"],
    pokedexSize: 156,
    gymCount: 8,
    trialCount: 0,
    routeCount: 23,
    environmentTags: ["metropolitan core", "bridges", "industrial sectors", "seasonal climate"],
    worldStyle: "Large urban-biome blend with strong city specialization and landmark bridges.",
    progressionStyle: "Black/White circular journey evolved into expanded district flow in B2/W2.",
    narrativeRole: "Ideology-focused region built around the ethics of Pokemon partnership.",
    animeFocus: "Black and White arc with tournament-heavy pacing.",
    keyCities: [
      { name: "Nuvema Town", role: "Starting town", highlight: "Juniper intro and first exposure to Unova philosophy." },
      { name: "Castelia City", role: "Metro anchor", highlight: "Largest city in early path and major Team Plasma pressure point." },
      { name: "Nimbasa City", role: "Entertainment district", highlight: "Battle Subway and electric-grid urban routes." },
      { name: "Driftveil City", role: "Port-industrial pivot", highlight: "Cargo economy and narrative escalation." },
      { name: "Opelucid City", role: "Late strategic gate", highlight: "Dragon-focused lore and near-endgame transitions." }
    ],
    landmarks: [
      { name: "Relic Castle", category: "Ancient Site", summary: "Desert dungeon with hidden lore layers." },
      { name: "Dragonspiral Tower", category: "Legendary", summary: "Major truth/ideals myth site." },
      { name: "Victory Road", category: "Challenge Route", summary: "Vertical multi-layer late-game route test." },
      { name: "Chargestone Cave", category: "Dungeon", summary: "Magnetic terrain and route pacing checkpoint." },
      { name: "P2 Laboratory", category: "Post-game", summary: "Lore-heavy optional endgame branch." }
    ],
    travelNetwork: [
      { method: "Walking", coverage: "Regional ring and branches", note: "Core badge progression spine." },
      { method: "Bridges/Transit lines", coverage: "Cross-city links", note: "Distinct skyline-to-route transitions." },
      { method: "Surf/Waterfall", coverage: "Late optional sectors", note: "Unlocks rematch and legendary pockets." },
      { method: "Fly", coverage: "High hub mobility", note: "Strongly reduces city-to-city travel cost in B2/W2." }
    ],
    explorerTips: [
      "Use Castelia and Nimbasa to stabilize items and move options.",
      "Track seasonal path differences when planning optional captures.",
      "Keep anti-dragon and anti-ground tools ready before Opelucid section."
    ],
    loreHighlights: [
      "Team Plasma's narrative reframes trainer-Pokemon ethics.",
      "Legend split around Truth and Ideals drives climactic encounters.",
      "B2/W2 time skip demonstrates region-level development continuity."
    ],
    searchTags: ["gen5", "unova", "juniper", "plasma", "truth", "ideals"]
  },
  {
    id: 6,
    key: "kalos",
    name: "Kalos",
    generationLabel: "Generation VI",
    eraLabel: "Core Region",
    debutGames: ["Pokemon X/Y"],
    revisitGames: ["No direct remake yet"],
    mapImageUrl: "https://archives.bulbagarden.net/media/upload/a/a9/Kalos.png",
    mapImageAlt: "Kalos world map",
    mapImageCredit: "Bulbagarden Archives",
    sourceUrl: "https://bulbapedia.bulbagarden.net/wiki/Kalos",
    professor: "Professor Sycamore",
    leagueHQ: "Pokemon League (north mountain crown)",
    champion: "Diantha",
    villainTeams: ["Team Flare"],
    starterPokemon: ["Chespin", "Fennekin", "Froakie"],
    pokedexSize: 72,
    gymCount: 8,
    trialCount: 0,
    routeCount: 22,
    environmentTags: ["continental ring", "fashion metropolis", "coasts", "mountain rim"],
    worldStyle: "Symmetric region ring centered around a dense metropolitan capital.",
    progressionStyle: "Looped route structure with style/culture hubs and late mountain access.",
    narrativeRole: "Aesthetics, mega evolution research, and ultimate weapon conflict setting.",
    animeFocus: "XY and XYZ arcs with strong battle choreography emphasis.",
    keyCities: [
      { name: "Vaniville Town", role: "Starting town", highlight: "Quiet origin with immediate friend-group expansion." },
      { name: "Lumiose City", role: "Mega metro core", highlight: "Regional center with broad services and event triggers." },
      { name: "Shalour City", role: "Mega evolution pillar", highlight: "Tower of Mastery and key battle progression node." },
      { name: "Laverre City", role: "Mystic checkpoint", highlight: "Fairy Gym and lore-toned forest approach." },
      { name: "Snowbelle City", role: "Final gym gate", highlight: "Northern climate challenge before League route." }
    ],
    landmarks: [
      { name: "Geosenge Town", category: "Lore Site", summary: "Team Flare and ultimate weapon narrative center." },
      { name: "Parfum Palace", category: "Historic Estate", summary: "Story progression and cultural set-piece area." },
      { name: "Reflection Cave", category: "Dungeon", summary: "Navigation puzzle with mirror-path flow." },
      { name: "Azure Bay", category: "Coastal Zone", summary: "Exploration-heavy sea branch with optional catches." },
      { name: "Pokemon Village", category: "Wild Habitat", summary: "Late-game high-value encounter pocket." }
    ],
    travelNetwork: [
      { method: "Walking", coverage: "Route ring", note: "Structured town cadence around Lumiose axis." },
      { method: "Roller Skates/Bicycle", coverage: "Urban and route segments", note: "Fluid mobility in city and open routes." },
      { method: "Surf", coverage: "Bay and side coasts", note: "Primarily optional content expansion." },
      { method: "Fly", coverage: "Late-game convenience", note: "Best for gym cleanup and mega stone routes." }
    ],
    explorerTips: [
      "Use Lumiose as your repeated optimization stop for shops and move updates.",
      "Handle cave and mountain prep before pushing the northern route chain.",
      "Track mega stone windows and revisit routes after key story beats."
    ],
    loreHighlights: [
      "Mega evolution research is embedded into central progression nodes.",
      "Geosenge events expose high-scale weaponized ancient history.",
      "Kalos map loop supports frequent return to Lumiose macro hub."
    ],
    searchTags: ["gen6", "kalos", "sycamore", "flare", "mega", "lumiose"]
  },
  {
    id: 7,
    key: "alola",
    name: "Alola",
    generationLabel: "Generation VII",
    eraLabel: "Core Region",
    debutGames: ["Pokemon Sun/Moon", "Pokemon Ultra Sun/Ultra Moon"],
    revisitGames: ["No direct remake yet"],
    mapImageUrl: "https://archives.bulbagarden.net/media/upload/6/6c/Alola.png",
    mapImageAlt: "Alola world map",
    mapImageCredit: "Bulbagarden Archives",
    sourceUrl: "https://bulbapedia.bulbagarden.net/wiki/Alola",
    professor: "Professor Kukui",
    leagueHQ: "Mount Lanakila (League founded during story era)",
    champion: "Player-created League champion cycle",
    villainTeams: ["Team Skull", "Aether Foundation"],
    starterPokemon: ["Rowlet", "Litten", "Popplio"],
    pokedexSize: 302,
    gymCount: 0,
    trialCount: 7,
    routeCount: 17,
    environmentTags: ["island chain", "tropical biomes", "volcanic zones", "marine routes"],
    worldStyle: "Island-based exploration with distinct local ecology and culture per island.",
    progressionStyle: "Island Trials and Kahuna Grand Trials replace classic gym progression.",
    narrativeRole: "Strong character-driven story with Ultra Beast and family conflict themes.",
    animeFocus: "Sun and Moon arc with school-based episodic structure.",
    keyCities: [
      { name: "Iki Town", role: "Cultural root", highlight: "Trial beginnings and Tapu-linked identity." },
      { name: "Hauoli City", role: "Entry metro", highlight: "Early shops, trainer services, and route spread." },
      { name: "Heahea City", role: "Akala service hub", highlight: "Ferry access and commercial support point." },
      { name: "Malie City", role: "Inter-island cultural node", highlight: "Eastern architecture and route split." },
      { name: "Po Town", role: "Narrative conflict zone", highlight: "Team Skull headquarters and story pivot." }
    ],
    landmarks: [
      { name: "Melemele Island", category: "Island Sector", summary: "Tutorial and first trial ecosystem." },
      { name: "Akala Island", category: "Island Sector", summary: "Trial density and broad biome diversity." },
      { name: "Ulaula Island", category: "Island Sector", summary: "Story escalation and Team Skull pressure." },
      { name: "Poni Island", category: "Island Sector", summary: "Late-game spiritual and legendary route flow." },
      { name: "Ultra Space", category: "Dimensional Zone", summary: "Ultra Beast and post-story anomaly domain." }
    ],
    travelNetwork: [
      { method: "Walking", coverage: "Island local routes", note: "Dense pockets rather than long linear roads." },
      { method: "Ride Pager", coverage: "Traversal actions", note: "Context travel tools replace traditional HM loadout." },
      { method: "Ferries", coverage: "Inter-island transport", note: "Main macro transition mechanism." },
      { method: "Charizard Glide", coverage: "Fast-travel", note: "Late route compression and revisits." }
    ],
    explorerTips: [
      "Build around trial mechanics rather than strict gym type counters.",
      "Use Ride Pager upgrades aggressively to unlock hidden item pockets.",
      "Rotate teams for island-specific encounter pools and totem pressure."
    ],
    loreHighlights: [
      "Island challenge structure reframes progression around community tradition.",
      "Aether and Ultra Beast arcs add interdimensional stakes to personal stories.",
      "League establishment happens as part of the region's modern evolution."
    ],
    searchTags: ["gen7", "alola", "kukui", "trials", "aether", "ultra beast"]
  },
  {
    id: 8,
    key: "galar",
    name: "Galar",
    generationLabel: "Generation VIII",
    eraLabel: "Core Region + DLC Expansion",
    debutGames: ["Pokemon Sword/Shield"],
    revisitGames: ["The Isle of Armor", "The Crown Tundra"],
    mapImageUrl: "https://archives.bulbagarden.net/media/upload/4/4e/Galar_Adventures.png",
    mapImageAlt: "Galar map and expansion zones",
    mapImageCredit: "Bulbagarden Archives",
    sourceUrl: "https://bulbapedia.bulbagarden.net/wiki/Galar",
    professor: "Professor Magnolia / Professor Sonia",
    leagueHQ: "Wyndon Stadium",
    champion: "Leon",
    villainTeams: ["Team Yell", "Macro Cosmos"],
    starterPokemon: ["Grookey", "Scorbunny", "Sobble"],
    pokedexSize: 400,
    gymCount: 8,
    trialCount: 0,
    routeCount: 10,
    environmentTags: ["northbound spine", "industrial cities", "open wild hubs", "snow DLC biomes"],
    worldStyle: "Stadium-focused region with linear northbound campaign and open Wild Area anchor.",
    progressionStyle: "Gym challenge spectacle with scripted city progression and optional expansion zones.",
    narrativeRole: "Sports-entertainment framing for League progression with energy crisis storyline.",
    animeFocus: "Journeys-era references and tournament framing.",
    keyCities: [
      { name: "Postwick", role: "Starting town", highlight: "Intro arc and first rival setup." },
      { name: "Motostoke", role: "Industrial intro hub", highlight: "Gym challenge registration and early systems." },
      { name: "Hammerlocke", role: "Central stronghold", highlight: "Lore archives and route branching." },
      { name: "Circhester", role: "Climate split city", highlight: "Version-dependent gym identity." },
      { name: "Wyndon", role: "League climax", highlight: "Tournament bracket and champion gauntlet stage." }
    ],
    landmarks: [
      { name: "Wild Area", category: "Open Zone", summary: "Weather-driven encounter sandbox and raid systems." },
      { name: "Slumbering Weald", category: "Lore Forest", summary: "Legend wolves origin area." },
      { name: "Rose Tower", category: "Story Facility", summary: "Pre-finale macro conflict buildup." },
      { name: "Isle of Armor", category: "Expansion Zone", summary: "Training-focused DLC map with dojo progression." },
      { name: "Crown Tundra", category: "Expansion Zone", summary: "Legendary-centric exploration map." }
    ],
    travelNetwork: [
      { method: "Walking", coverage: "Mainline route spine", note: "Fast city cadence with clear forward flow." },
      { method: "Bicycle", coverage: "Routes + water traversal", note: "Single bike handles both land and water upgrades." },
      { method: "Flying Taxi", coverage: "Rapid fast-travel", note: "Core quality-of-life for Wild Area loops." },
      { method: "Rail transitions", coverage: "Story framing", note: "Supports macro progression pacing between hubs." }
    ],
    explorerTips: [
      "Use Wild Area weather rotation for team-building before each gym spike.",
      "Do raid sessions early for resources and technical move flexibility.",
      "Treat DLC regions as side progression for stronger move and item pools."
    ],
    loreHighlights: [
      "League presentation turns progression into public sports spectacle.",
      "Energy crisis arc ties ancient legends into modern infrastructure.",
      "DLC maps expand Galar from linear core into broader exploration layers."
    ],
    searchTags: ["gen8", "galar", "leon", "wild area", "dynamax", "macro cosmos"]
  },
  {
    id: 9,
    key: "hisui",
    name: "Hisui",
    generationLabel: "Historic Sinnoh Era",
    eraLabel: "Legends Era",
    debutGames: ["Pokemon Legends: Arceus"],
    revisitGames: ["No direct follow-up yet"],
    mapImageUrl: "https://archives.bulbagarden.net/media/upload/5/5b/Hisui.png",
    mapImageAlt: "Hisui world map",
    mapImageCredit: "Bulbagarden Archives",
    sourceUrl: "https://bulbapedia.bulbagarden.net/wiki/Hisui",
    professor: "Professor Laventon",
    leagueHQ: "No formal League in this era",
    champion: "No champion format",
    villainTeams: ["No modern villain team structure"],
    starterPokemon: ["Rowlet", "Cyndaquil", "Oshawott"],
    pokedexSize: 242,
    gymCount: 0,
    trialCount: 5,
    routeCount: 5,
    environmentTags: ["zone-based wilderness", "ancient settlements", "mountain biomes", "survey expeditions"],
    worldStyle: "Hub-and-zone structure with broad open areas and action-driven encounters.",
    progressionStyle: "Survey rank growth, noble battles, and mount unlocks replace gyms and routes.",
    narrativeRole: "Pre-modern origin story for Sinnoh mythology, clans, and Pokedex research foundations.",
    animeFocus: "Primarily game-lore focused; not a standard anime region campaign.",
    keyCities: [
      { name: "Jubilife Village", role: "Central hub", highlight: "Mission board, crafting, and progression systems." },
      { name: "Obsidian Fieldlands", role: "Early survey zone", highlight: "Tutorial wild design and first noble arc." },
      { name: "Crimson Mirelands", role: "Mid-game pressure zone", highlight: "Hazard terrain and alpha route density." },
      { name: "Coronet Highlands", role: "Lore pivot", highlight: "Mountain traversal and central myth escalation." },
      { name: "Alabaster Icelands", role: "Late challenge zone", highlight: "Harsh weather and high-level encounters." }
    ],
    landmarks: [
      { name: "Temple of Sinnoh", category: "Ancient Site", summary: "Late myth convergence and high-stakes encounters." },
      { name: "Lake Trio Sites", category: "Myth Zone", summary: "Wisdom and spirit-linked narrative checkpoints." },
      { name: "Space-Time Distortions", category: "Anomaly", summary: "Rare resource and species event bubbles." },
      { name: "Ancient Retreat", category: "Lore Site", summary: "Historical context for clan and deity traditions." },
      { name: "Cobalt Coastlands", category: "Zone", summary: "Sea-edge zone with vertical traversal rhythm." }
    ],
    travelNetwork: [
      { method: "On foot", coverage: "All survey zones", note: "Stealth and direct capture loops matter heavily." },
      { method: "Wyrdeer", coverage: "Ground speed", note: "Primary acceleration mount for map traversal." },
      { method: "Basculegion/Sneasler/Braviary", coverage: "Water, climbing, and glide", note: "Progressive mobility unlocks hidden pockets." },
      { method: "Base camp fast-travel", coverage: "Zone shortcuts", note: "Important for resource routing and mission loops." }
    ],
    explorerTips: [
      "Upgrade satchel space early to keep long survey loops efficient.",
      "Use stealth and item crafting to avoid overcommitting in alpha clusters.",
      "Rotate mount usage per terrain rather than forcing direct pathing."
    ],
    loreHighlights: [
      "Shows early coexistence tensions between humans and Pokemon.",
      "Frames the origin of modern Pokedex research practices.",
      "Connects deity-level lore directly to regional geography."
    ],
    searchTags: ["hisui", "legends", "laventon", "survey", "noble", "arceus"]
  },
  {
    id: 10,
    key: "paldea",
    name: "Paldea",
    generationLabel: "Generation IX",
    eraLabel: "Open-World Era",
    debutGames: ["Pokemon Scarlet/Violet"],
    revisitGames: ["The Teal Mask", "The Indigo Disk"],
    mapImageUrl: "https://archives.bulbagarden.net/media/upload/2/2a/Paldea.png",
    mapImageAlt: "Paldea world map",
    mapImageCredit: "Bulbagarden Archives",
    sourceUrl: "https://bulbapedia.bulbagarden.net/wiki/Paldea",
    professor: "Professor Sada / Professor Turo",
    leagueHQ: "Pokemon League (Mesagoza frontier)",
    champion: "Geeta",
    villainTeams: ["Team Star", "AI Professor arc antagonism"],
    starterPokemon: ["Sprigatito", "Fuecoco", "Quaxly"],
    pokedexSize: 400,
    gymCount: 8,
    trialCount: 0,
    routeCount: 25,
    environmentTags: ["open world", "academy network", "crater core", "dlc subregions"],
    worldStyle: "Free-route overworld with three parallel story paths and broad biome spread.",
    progressionStyle: "Player-directed pacing across Gyms, Titans, and Star bases.",
    narrativeRole: "Modern non-linear structure with deep endgame mystery around Area Zero.",
    animeFocus: "Horizons-era references and academy framing.",
    keyCities: [
      { name: "Mesagoza", role: "Academic core", highlight: "Naranja/Uva Academy and campaign launch point." },
      { name: "Levincia", role: "Tech-coast city", highlight: "Electric Gym and media-driven atmosphere." },
      { name: "Cascarrafa", role: "Vertical market city", highlight: "Water Gym and steep-route traversal." },
      { name: "Montenevera", role: "Mountain challenge city", highlight: "Ghost Gym and snowfield route access." },
      { name: "Porto Marinada", role: "Trade outpost", highlight: "Auction system and coastal logistics." }
    ],
    landmarks: [
      { name: "Great Crater of Paldea", category: "Core Mystery Zone", summary: "Area Zero endgame and paradox ecosystem." },
      { name: "Path of Legends titan zones", category: "Boss Route", summary: "Mobility upgrades and open progression checkpoints." },
      { name: "Team Star bases", category: "Challenge Zones", summary: "Parallel narrative path with base infiltration loops." },
      { name: "Kitakami", category: "DLC Region", summary: "Folklore-driven map with distinct route style." },
      { name: "Blueberry Academy (Terarium)", category: "DLC Region", summary: "Biome dome structure with focused battle loops." }
    ],
    travelNetwork: [
      { method: "On foot", coverage: "Entire overworld", note: "Non-linear pathing allows early scouting." },
      { method: "Ride legendary", coverage: "Ground/water/glide/climb", note: "Traversal expands as Titan milestones are cleared." },
      { method: "Fast-travel", coverage: "Pokemon Centers and landmarks", note: "Critical for objective swapping across story paths." },
      { method: "DLC transit", coverage: "External regions", note: "Endgame content extends map scope and progression options." }
    ],
    explorerTips: [
      "Unlock mobility upgrades early via Titan path for better map efficiency.",
      "Alternate Gym, Titan, and Star arcs to keep level curve balanced.",
      "Return to Area Zero with full team prep for narrative and battle spikes."
    ],
    loreHighlights: [
      "Academy framing connects exploration directly to player-driven study themes.",
      "Area Zero reveals late-game paradox and timeline tension.",
      "DLC regions add mythology and battle ecosystem layers beyond Paldea core."
    ],
    searchTags: ["gen9", "paldea", "area zero", "team star", "academy", "open world"]
  }
];

export const REGION_INTERACTIVE_POINTS: Record<PokemonRegionMapKey, PokemonRegionMapPoint[]> = {
  kanto: [
    { id: "pallet-town", label: "Pallet Town", kind: "city", x: 22, y: 74, summary: "Origin town and Professor Oak lab." },
    { id: "viridian-city", label: "Viridian City", kind: "city", x: 21, y: 58, summary: "Gym gateway and route to Indigo side." },
    { id: "cerulean-city", label: "Cerulean City", kind: "city", x: 39, y: 38, summary: "Water Gym and eastern route split." },
    { id: "saffron-city", label: "Saffron City", kind: "city", x: 37, y: 54, summary: "Central metro and Silph Co. crisis hub." },
    { id: "celadon-city", label: "Celadon City", kind: "city", x: 28, y: 56, summary: "Commerce center and Team Rocket pressure point." },
    { id: "mt-moon", label: "Mt. Moon", kind: "landmark", x: 29, y: 32, summary: "Early cave challenge with fossil split." },
    { id: "seafoam-islands", label: "Seafoam Islands", kind: "landmark", x: 46, y: 91, summary: "Late sea cave branch and legendary route." },
    { id: "indigo-plateau", label: "Indigo Plateau", kind: "league", x: 9, y: 58, summary: "League HQ and final campaign gauntlet." }
  ],
  johto: [
    { id: "new-bark-town", label: "New Bark Town", kind: "city", x: 67, y: 79, summary: "Starter town and Elm laboratory." },
    { id: "violet-city", label: "Violet City", kind: "city", x: 54, y: 53, summary: "Sprout Tower and first Johto Gym stop." },
    { id: "goldenrod-city", label: "Goldenrod City", kind: "city", x: 37, y: 56, summary: "Urban systems hub with Radio Tower." },
    { id: "ecruteak-city", label: "Ecruteak City", kind: "city", x: 38, y: 45, summary: "Historic district tied to tower lore." },
    { id: "blackthorn-city", label: "Blackthorn City", kind: "city", x: 67, y: 29, summary: "Dragon-focused final Johto badge." },
    { id: "ruins-of-alph", label: "Ruins of Alph", kind: "landmark", x: 46, y: 62, summary: "Ancient puzzle complex with Unown studies." },
    { id: "whirl-islands", label: "Whirl Islands", kind: "landmark", x: 14, y: 74, summary: "Sea dungeon with multi-room navigation." },
    { id: "indigo-plateau-johto", label: "Indigo Plateau", kind: "league", x: 25, y: 22, summary: "Shared League endpoint between Johto and Kanto." }
  ],
  hoenn: [
    { id: "littleroot-town", label: "Littleroot Town", kind: "city", x: 28, y: 73, summary: "Starting point and regional intro lane." },
    { id: "rustboro-city", label: "Rustboro City", kind: "city", x: 23, y: 58, summary: "Early gym and Devon-linked checkpoint." },
    { id: "mauville-city", label: "Mauville City", kind: "city", x: 43, y: 56, summary: "Central mobility and route branching node." },
    { id: "fortree-city", label: "Fortree City", kind: "city", x: 58, y: 48, summary: "Tree city and weather route pressure zone." },
    { id: "sootopolis-city", label: "Sootopolis City", kind: "city", x: 77, y: 66, summary: "Late legendary conflict pivot." },
    { id: "mt-chimney", label: "Mt. Chimney", kind: "landmark", x: 32, y: 44, summary: "Magma/Aqua escalation around volcanic terrain." },
    { id: "sky-pillar", label: "Sky Pillar", kind: "landmark", x: 84, y: 70, summary: "Rayquaza-linked summit and climax lore." },
    { id: "ever-grande", label: "Ever Grande City", kind: "league", x: 89, y: 73, summary: "League access and final elite challenge." }
  ],
  sinnoh: [
    { id: "twinleaf-town", label: "Twinleaf Town", kind: "city", x: 36, y: 77, summary: "Quiet origin before legend escalation." },
    { id: "jubilife-city", label: "Jubilife City", kind: "city", x: 40, y: 70, summary: "Major urban hub with recurring systems." },
    { id: "hearthome-city", label: "Hearthome City", kind: "city", x: 43, y: 62, summary: "Contest and crossroads center." },
    { id: "canalave-city", label: "Canalave City", kind: "city", x: 25, y: 64, summary: "Knowledge hub with western sea access." },
    { id: "snowpoint-city", label: "Snowpoint City", kind: "city", x: 37, y: 20, summary: "Northern ice challenge checkpoint." },
    { id: "mt-coronet", label: "Mt. Coronet", kind: "landmark", x: 46, y: 51, summary: "Geographic spine that gates progression." },
    { id: "spear-pillar", label: "Spear Pillar", kind: "story", x: 46, y: 42, summary: "Creation-lore confrontation site." },
    { id: "pokemon-league-sinnoh", label: "Pokemon League", kind: "league", x: 14, y: 22, summary: "Sinnoh League endpoint." }
  ],
  unova: [
    { id: "nuvema-town", label: "Nuvema Town", kind: "city", x: 42, y: 90, summary: "Starter town and Juniper launch point." },
    { id: "castelia-city", label: "Castelia City", kind: "city", x: 46, y: 64, summary: "Massive metro and Plasma activity zone." },
    { id: "nimbasa-city", label: "Nimbasa City", kind: "city", x: 57, y: 58, summary: "Entertainment district and battle transit core." },
    { id: "driftveil-city", label: "Driftveil City", kind: "city", x: 45, y: 50, summary: "Port and logistics-heavy narrative pivot." },
    { id: "opelucid-city", label: "Opelucid City", kind: "city", x: 58, y: 34, summary: "Late dragon-oriented campaign gate." },
    { id: "relic-castle", label: "Relic Castle", kind: "landmark", x: 34, y: 55, summary: "Desert ruins with deep side lore." },
    { id: "dragonspiral-tower", label: "Dragonspiral Tower", kind: "story", x: 50, y: 22, summary: "Legendary truth/ideals focal structure." },
    { id: "pokemon-league-unova", label: "Pokemon League", kind: "league", x: 76, y: 19, summary: "Northern elite challenge destination." }
  ],
  kalos: [
    { id: "vaniville-town", label: "Vaniville Town", kind: "city", x: 47, y: 80, summary: "Starting village and friend group kickoff." },
    { id: "lumiose-city", label: "Lumiose City", kind: "city", x: 49, y: 55, summary: "Central metropolitan axis of Kalos." },
    { id: "shalour-city", label: "Shalour City", kind: "city", x: 23, y: 54, summary: "Mega evolution progression checkpoint." },
    { id: "laverre-city", label: "Laverre City", kind: "city", x: 60, y: 44, summary: "Mystic forest-side gym hub." },
    { id: "snowbelle-city", label: "Snowbelle City", kind: "city", x: 48, y: 24, summary: "Final gym climate challenge." },
    { id: "geosenge-town", label: "Geosenge Town", kind: "story", x: 55, y: 66, summary: "Team Flare and ultimate weapon lore axis." },
    { id: "parfum-palace", label: "Parfum Palace", kind: "landmark", x: 37, y: 62, summary: "Historic estate and narrative side branch." },
    { id: "pokemon-league-kalos", label: "Pokemon League", kind: "league", x: 52, y: 10, summary: "Northern league crown of Kalos." }
  ],
  alola: [
    { id: "iki-town", label: "Iki Town", kind: "city", x: 18, y: 49, summary: "Melemele cultural root and trial start." },
    { id: "hauoli-city", label: "Hauoli City", kind: "city", x: 15, y: 58, summary: "Early metro and service entry point." },
    { id: "heahea-city", label: "Heahea City", kind: "city", x: 34, y: 62, summary: "Akala logistics and ferry node." },
    { id: "malie-city", label: "Malie City", kind: "city", x: 62, y: 54, summary: "Inter-island architecture and route split." },
    { id: "po-town", label: "Po Town", kind: "story", x: 51, y: 50, summary: "Team Skull controlled urban zone." },
    { id: "poni-island", label: "Poni Island", kind: "landmark", x: 84, y: 68, summary: "Late island progression and lore routes." },
    { id: "aether-paradise", label: "Aether Paradise", kind: "story", x: 47, y: 37, summary: "Aether Foundation core conflict area." },
    { id: "mount-lanakila", label: "Mount Lanakila", kind: "league", x: 57, y: 18, summary: "League establishment and endgame battle zone." }
  ],
  galar: [
    { id: "postwick", label: "Postwick", kind: "city", x: 20, y: 73, summary: "Starter town and rival kickoff." },
    { id: "motostoke", label: "Motostoke", kind: "city", x: 24, y: 55, summary: "Gym challenge onboarding center." },
    { id: "hammerlocke", label: "Hammerlocke", kind: "city", x: 28, y: 43, summary: "Central fortress city and lore archive area." },
    { id: "circhester", label: "Circhester", kind: "city", x: 31, y: 26, summary: "Northern climate-dependent gym city." },
    { id: "wyndon", label: "Wyndon", kind: "league", x: 34, y: 15, summary: "Champion Cup and final bracket stage." },
    { id: "wild-area", label: "Wild Area", kind: "landmark", x: 24, y: 47, summary: "Open weather-driven capture and raid zone." },
    { id: "isle-of-armor", label: "Isle of Armor", kind: "landmark", x: 73, y: 57, summary: "DLC training map and dojo progression." },
    { id: "crown-tundra", label: "Crown Tundra", kind: "landmark", x: 80, y: 23, summary: "Legendary-heavy DLC exploration region." }
  ],
  hisui: [
    { id: "jubilife-village", label: "Jubilife Village", kind: "city", x: 38, y: 82, summary: "Central command and crafting hub." },
    { id: "obsidian-fieldlands", label: "Obsidian Fieldlands", kind: "landmark", x: 39, y: 70, summary: "First major survey zone and noble intro." },
    { id: "crimson-mirelands", label: "Crimson Mirelands", kind: "landmark", x: 46, y: 56, summary: "Hazard-rich mid-game expedition zone." },
    { id: "cobalt-coastlands", label: "Cobalt Coastlands", kind: "landmark", x: 57, y: 63, summary: "Coastal zone with vertical traversal arcs." },
    { id: "coronet-highlands", label: "Coronet Highlands", kind: "landmark", x: 45, y: 43, summary: "Mountain pivot tied to central myth." },
    { id: "alabaster-icelands", label: "Alabaster Icelands", kind: "landmark", x: 44, y: 20, summary: "Late harsh-weather zone and high-level encounters." },
    { id: "temple-of-sinnoh", label: "Temple of Sinnoh", kind: "story", x: 46, y: 35, summary: "Myth convergence and climactic events." },
    { id: "space-time-distortion", label: "Space-Time Distortion", kind: "story", x: 55, y: 47, summary: "Anomaly events with rare resources and species." }
  ],
  paldea: [
    { id: "mesagoza", label: "Mesagoza", kind: "city", x: 45, y: 58, summary: "Academy hub and main campaign nexus." },
    { id: "levincia", label: "Levincia", kind: "city", x: 74, y: 54, summary: "Eastern tech city and electric gym focus." },
    { id: "cascarrafa", label: "Cascarrafa", kind: "city", x: 37, y: 49, summary: "Vertical desert market and water gym route." },
    { id: "montenevera", label: "Montenevera", kind: "city", x: 38, y: 23, summary: "Mountain city and ghost challenge lane." },
    { id: "porto-marinada", label: "Porto Marinada", kind: "city", x: 24, y: 56, summary: "Trade outpost and auction systems." },
    { id: "great-crater", label: "Great Crater of Paldea", kind: "story", x: 48, y: 56, summary: "Area Zero core mystery and paradox zone." },
    { id: "kitakami", label: "Kitakami", kind: "landmark", x: 82, y: 72, summary: "DLC folklore map and side progression zone." },
    { id: "blueberry-academy", label: "Blueberry Academy", kind: "landmark", x: 84, y: 22, summary: "DLC terarium battle and biome complex." }
  ]
};

export function getRegionInteractivePoints(regionKey: PokemonRegionMapKey | null) {
  if (!regionKey) {
    return [] as PokemonRegionMapPoint[];
  }
  return REGION_INTERACTIVE_POINTS[regionKey] ?? [];
}

const REGION_SEARCH_INDEX = REGION_MAPS.map((region) => ({
  region,
  haystack: [
    region.name,
    region.generationLabel,
    region.eraLabel,
    region.professor,
    region.leagueHQ,
    region.champion,
    ...region.debutGames,
    ...region.revisitGames,
    ...region.villainTeams,
    ...region.starterPokemon,
    ...region.environmentTags,
    ...region.keyCities.map((city) => city.name),
    ...region.landmarks.map((landmark) => landmark.name),
    ...region.searchTags
  ]
    .map(normalize)
    .join(" ")
}));
const REGION_BY_ID = new Map(REGION_MAPS.map((region) => [region.id, region]));

export function searchRegionMaps(query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return REGION_MAPS;
  }

  return REGION_SEARCH_INDEX.filter((entry) =>
    entry.haystack.includes(normalizedQuery)
  ).map((entry) => entry.region);
}

export function getRegionById(regionId: number | null) {
  if (regionId === null) {
    return null;
  }
  return REGION_BY_ID.get(regionId) ?? null;
}
