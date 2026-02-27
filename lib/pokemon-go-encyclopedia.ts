import {
  type PokemonGoActivity,
  type PokemonGoActivityCategory
} from "@/types/pokemon-go";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export const POKEMON_GO_ACTIVITIES: PokemonGoActivity[] = [
  {
    id: 1,
    slug: "legendary-raid-ops",
    title: "Legendary Raid Ops",
    category: "raids",
    categoryLabel: "Raid Command",
    description:
      "Build weekly raid routines around 5-star bosses to secure top attackers and XL Candy.",
    cadence: "Daily windows + weekend raid spikes",
    intensity: 5,
    idealFor: ["Account power-up", "Master League prep", "XL grind"],
    prepChecklist: [
      "Save remote passes for high-value legendary rotations.",
      "Pre-build counter squads by boss typing before the window starts.",
      "Use weather boosts when possible to improve catch level and candy output.",
      "Keep bag space for Rare Candy, TMs, and revives after long sessions."
    ],
    actionLoop: [
      "Scan local raid lobbies and remote invites for time-efficient clears.",
      "Swap teams based on move-set reveals instead of using one static squad.",
      "Pinap low-risk catches, then switch to Golden Razz on final balls.",
      "Tag IV candidates immediately for future XL investment."
    ],
    proTips: [
      "Raid hour plus best-friend bonus is usually the highest value per pass.",
      "Anchor teams with mega evolutions for extra candy when matching type.",
      "Prioritize bosses that overlap PvE and PvP value to reduce dust waste."
    ],
    commonMistakes: [
      "Spending premium passes on low-impact bosses with no long-term role.",
      "Ignoring friendship timing and losing free damage bonuses.",
      "Powering every copy before checking IV spread and moveset potential."
    ],
    rewards: [
      {
        reward: "Legendary encounters",
        source: "5-star raids",
        priority: "High",
        note: "Core source for meta legendaries and shiny opportunities."
      },
      {
        reward: "Rare Candy / Rare Candy XL",
        source: "Raid completion bundles",
        priority: "High",
        note: "Converts raid volume into progression for difficult evolutions."
      },
      {
        reward: "Golden Razz Berries",
        source: "Raid reward packs",
        priority: "Medium",
        note: "Stabilizes catch rate on hard-to-catch bosses."
      },
      {
        reward: "Charge and Fast TMs",
        source: "Raid completion bundles",
        priority: "Medium",
        note: "Essential for tuning attackers and league picks."
      }
    ],
    featuredPokemon: [
      {
        name: "Mewtwo",
        dexId: 150,
        role: "Generalist raid finisher",
        fastMove: "Psycho Cut",
        chargedMove: "Psystrike"
      },
      {
        name: "Rayquaza",
        dexId: 384,
        role: "Dragon/Flying boss breaker",
        fastMove: "Dragon Tail",
        chargedMove: "Breaking Swipe"
      },
      {
        name: "Kyogre",
        dexId: 382,
        role: "Top water attacker",
        fastMove: "Waterfall",
        chargedMove: "Origin Pulse"
      }
    ],
    searchTags: [
      "legendary",
      "5-star",
      "xl candy",
      "rare candy",
      "raid hour",
      "boss rotation"
    ]
  },
  {
    id: 2,
    slug: "mega-raid-ladder",
    title: "Mega Raid Ladder",
    category: "raids",
    categoryLabel: "Mega Program",
    description:
      "Farm Mega Energy and rotate active megas for candy bonuses, raid power, and utility.",
    cadence: "2-3 focused sessions per week",
    intensity: 4,
    idealFor: ["Candy optimization", "Type coverage", "Event efficiency"],
    prepChecklist: [
      "Track your missing mega evolutions by typing and role.",
      "Run one mega that matches your current catch focus when grinding.",
      "Keep healing items ready; mega chains can be item heavy.",
      "Plan around weather and boss weak points for cleaner clears."
    ],
    actionLoop: [
      "Pick a target mega energy line for the week.",
      "Run mega raids during active communities to minimize lobby downtime.",
      "Evolve your highest-level mega before catch-heavy sessions.",
      "Rotate to another mega family once enough energy is banked."
    ],
    proTips: [
      "One active mega can multiply value of every catch in that session.",
      "Mega levels matter; prioritize species you use often in raids and events.",
      "Treat mega energy as a long-term resource, not a one-time unlock."
    ],
    commonMistakes: [
      "Using megas only for raids and missing huge catch bonuses.",
      "Spreading mega energy too thin across too many species at once.",
      "Ignoring mega level progression and staying on low efficiency tiers."
    ],
    rewards: [
      {
        reward: "Mega Energy",
        source: "Mega raid completions",
        priority: "High",
        note: "Required for unlocks and repeated mega activations."
      },
      {
        reward: "Bonus candy on matching catches",
        source: "Active mega evolution",
        priority: "High",
        note: "Massively boosts event and spotlight hour output."
      },
      {
        reward: "Type-specific raid boost",
        source: "Active mega in party",
        priority: "Medium",
        note: "Improves group DPS in coordinated legendary lobbies."
      },
      {
        reward: "Extra XP",
        source: "High-activity raid sessions",
        priority: "Medium",
        note: "Stacks well with friendship and event multipliers."
      }
    ],
    featuredPokemon: [
      {
        name: "Charizard",
        dexId: 6,
        role: "Fire/Flying mega utility",
        fastMove: "Fire Spin",
        chargedMove: "Blast Burn"
      },
      {
        name: "Gengar",
        dexId: 94,
        role: "Ghost mega damage spike",
        fastMove: "Lick",
        chargedMove: "Shadow Ball"
      },
      {
        name: "Swampert",
        dexId: 260,
        role: "Water/Ground raid pivot",
        fastMove: "Mud Shot",
        chargedMove: "Hydro Cannon"
      }
    ],
    searchTags: ["mega", "energy", "boost", "candy bonus", "raid utility"]
  },
  {
    id: 3,
    slug: "great-league-core",
    title: "Great League Core",
    category: "battle",
    categoryLabel: "PvP Arena",
    description:
      "Build low-cost Great League teams to generate Stardust rewards and improve battle fundamentals.",
    cadence: "Daily sets",
    intensity: 3,
    idealFor: ["Stardust farming", "PvP rank climbing", "Low-cost competition"],
    prepChecklist: [
      "Lock one safe lead, one flexible swap, and one closer.",
      "Use PvP IV targets before powering up league builds.",
      "Prepare two alternate teams to adapt to rotating metas.",
      "Practice shield counting and fast move tracking."
    ],
    actionLoop: [
      "Run daily battle sets even on low-energy days for baseline rewards.",
      "Tag losses by matchup cause: team comp, shield timing, or move count.",
      "Adjust one slot at a time to keep learning signal clean.",
      "Use practice battles with friends before expensive build changes."
    ],
    proTips: [
      "Consistency in daily sets beats sporadic marathon sessions.",
      "A reliable safe-swap often wins more games than a flashy closer.",
      "Spend Stardust on evergreen picks first, then tech counters."
    ],
    commonMistakes: [
      "Building fragile glass-cannon teams without reliable pivot options.",
      "Overreacting to one bad set and rebuilding full teams too quickly.",
      "Ignoring charged move timing and giving free fast-move turns."
    ],
    rewards: [
      {
        reward: "Stardust",
        source: "GO Battle League sets",
        priority: "High",
        note: "One of the most stable repeatable Stardust sources."
      },
      {
        reward: "Rare encounters",
        source: "Rank reward tracks",
        priority: "Medium",
        note: "Useful for dex progress and occasional meta additions."
      },
      {
        reward: "TMs and items",
        source: "Set and rank rewards",
        priority: "Medium",
        note: "Helps maintain multiple teams without heavy spending."
      },
      {
        reward: "PvP experience",
        source: "Match volume",
        priority: "High",
        note: "Improves read speed for future limited cups."
      }
    ],
    featuredPokemon: [
      {
        name: "Azumarill",
        dexId: 184,
        role: "Bulky safe core",
        fastMove: "Bubble",
        chargedMove: "Play Rough"
      },
      {
        name: "Lanturn",
        dexId: 171,
        role: "Flexible anti-flyer",
        fastMove: "Spark",
        chargedMove: "Surf"
      },
      {
        name: "Gligar",
        dexId: 207,
        role: "Anti-ground pressure",
        fastMove: "Wing Attack",
        chargedMove: "Aerial Ace"
      }
    ],
    searchTags: ["great league", "gbl", "pvp", "stardust", "rank"]
  },
  {
    id: 4,
    slug: "master-league-endgame",
    title: "Master League Endgame",
    category: "battle",
    categoryLabel: "PvP Arena",
    description:
      "Transition into high-power Master League with selective XL investments and strong type anchors.",
    cadence: "Season windows",
    intensity: 5,
    idealFor: ["Endgame PvP", "Legendary optimization", "High ELO pushes"],
    prepChecklist: [
      "Set XL targets before committing dust to avoid half-built legendaries.",
      "Prioritize one complete trio over many unfinished options.",
      "Keep elite TM budget for signature moves on high-value picks.",
      "Review common mirror match breakpoints and bulkpoints."
    ],
    actionLoop: [
      "Play in focused blocks during active Master League cycles.",
      "Track lead outcomes and swap timing in difficult cores.",
      "Bank Stardust in lower leagues before Master windows open.",
      "Revisit team order after every 20-30 matches."
    ],
    proTips: [
      "A smaller set of fully optimized monsters outperforms wide shallow rosters.",
      "Buddy and walking routines reduce rare candy pressure over time.",
      "Use raid and PvP overlap targets to reduce investment duplication."
    ],
    commonMistakes: [
      "Powering to level cap before finalizing movesets and role fit.",
      "Building multiple similar dragons with identical weaknesses.",
      "Ignoring matchups against top steel and fairy anchors."
    ],
    rewards: [
      {
        reward: "High-rank ladder rewards",
        source: "Season progression",
        priority: "High",
        note: "Includes premium items and prestige progression."
      },
      {
        reward: "Advanced PvP skill growth",
        source: "Master League matches",
        priority: "High",
        note: "Improves team planning and energy discipline."
      },
      {
        reward: "Stardust payouts",
        source: "Battle sets",
        priority: "Medium",
        note: "Offset by high build costs but still valuable."
      },
      {
        reward: "Encounter rewards",
        source: "Rank tracks",
        priority: "Low",
        note: "Secondary value compared with progression rewards."
      }
    ],
    featuredPokemon: [
      {
        name: "Dialga",
        dexId: 483,
        role: "Steel dragon anchor",
        fastMove: "Dragon Breath",
        chargedMove: "Iron Head"
      },
      {
        name: "Groudon",
        dexId: 383,
        role: "Ground closer",
        fastMove: "Mud Shot",
        chargedMove: "Precipice Blades"
      },
      {
        name: "Mewtwo",
        dexId: 150,
        role: "Flexible closer",
        fastMove: "Psycho Cut",
        chargedMove: "Psystrike"
      }
    ],
    searchTags: ["master league", "legendary pvp", "xl", "gbl endgame"]
  },
  {
    id: 5,
    slug: "team-rocket-hunt",
    title: "Team GO Rocket Hunt",
    category: "rocket",
    categoryLabel: "Rocket Operations",
    description:
      "Use grunt and leader cycles to collect strong shadow species and extra components.",
    cadence: "Daily balloons + map patrols",
    intensity: 4,
    idealFor: ["Shadow roster growth", "Charge TM events", "PvE upgrades"],
    prepChecklist: [
      "Keep anti-shadow counters pre-tagged by grunt phrase.",
      "Save radar pieces for focused leader hunts.",
      "Track shadow species worth investing in before purifying.",
      "Reserve Charge TMs for frustration-removal events."
    ],
    actionLoop: [
      "Clear balloon windows regularly for steady component flow.",
      "Target specific grunt types when hunting core shadows.",
      "Batch leader battles during high-availability play sessions.",
      "Evaluate shadows by role before spending Stardust."
    ],
    proTips: [
      "Top shadow attackers can outperform many non-shadow alternatives in raids.",
      "Leader rotations are strongest when tied to a specific target plan.",
      "Frustration windows are strategic; do not miss them."
    ],
    commonMistakes: [
      "Purifying top-tier shadows immediately without role analysis.",
      "Ignoring low-IV but high-value shadow species for PvE.",
      "Using radar pieces randomly instead of target farming."
    ],
    rewards: [
      {
        reward: "Shadow Pokemon",
        source: "Grunts and leaders",
        priority: "High",
        note: "Major source of premium PvE attackers."
      },
      {
        reward: "Mysterious Components",
        source: "Grunt victories",
        priority: "Medium",
        note: "Builds toward leader encounters and special rewards."
      },
      {
        reward: "Stardust",
        source: "Rocket battles",
        priority: "Medium",
        note: "Stacks well with battle and catch loops."
      },
      {
        reward: "12 km eggs",
        source: "Leader rewards",
        priority: "Low",
        note: "Optional value depending on hatch goals."
      }
    ],
    featuredPokemon: [
      {
        name: "Machamp",
        dexId: 68,
        role: "Dark and steel breaker",
        fastMove: "Counter",
        chargedMove: "Cross Chop"
      },
      {
        name: "Garchomp",
        dexId: 445,
        role: "Electric and fire coverage",
        fastMove: "Mud Shot",
        chargedMove: "Earth Power"
      },
      {
        name: "Tyranitar",
        dexId: 248,
        role: "Ghost and psychic control",
        fastMove: "Bite",
        chargedMove: "Crunch"
      }
    ],
    searchTags: ["rocket", "shadow", "leader", "frustration", "balloon"]
  },
  {
    id: 6,
    slug: "research-progression",
    title: "Research Progression Stack",
    category: "research",
    categoryLabel: "Research Deck",
    description:
      "Stack field research, timed research, and special research for reliable resource flow.",
    cadence: "Daily tasks + weekly breakthroughs",
    intensity: 2,
    idealFor: ["Steady progression", "Solo play", "Consistent rewards"],
    prepChecklist: [
      "Keep one quick-complete task slot for streak stability.",
      "Hold premium encounter tasks for bonus-catch events.",
      "Sync task routes with pokestop-dense walking loops.",
      "Track unfinished special research for item checkpoints."
    ],
    actionLoop: [
      "Spin new tasks from dense stop clusters each session.",
      "Complete at least one task daily for streak continuity.",
      "Batch-claim encounter tasks during active bonuses if possible.",
      "Use breakthrough timing to align with inventory needs."
    ],
    proTips: [
      "Research is your safest progression floor even on low-time days.",
      "Task curation saves major time over random completion.",
      "Timed research should be front-loaded in event windows."
    ],
    commonMistakes: [
      "Keeping slow low-value tasks and blocking better rolls.",
      "Skipping daily streaks and losing weekly reward momentum.",
      "Claiming all encounter tasks immediately without event planning."
    ],
    rewards: [
      {
        reward: "Encounter Pokemon",
        source: "Field and special research",
        priority: "High",
        note: "Reliable source for specific species and forms."
      },
      {
        reward: "Stardust and XP",
        source: "Task completion",
        priority: "Medium",
        note: "Small but steady progression drip over time."
      },
      {
        reward: "Items and passes",
        source: "Breakthrough and milestone rewards",
        priority: "Medium",
        note: "Improves sustainability for active players."
      },
      {
        reward: "Mythical progression",
        source: "Special research lines",
        priority: "High",
        note: "Unlocks unique species and long-term account goals."
      }
    ],
    featuredPokemon: [
      {
        name: "Eevee",
        dexId: 133,
        role: "Task-driven evolution utility",
        fastMove: "Quick Attack",
        chargedMove: "Last Resort"
      },
      {
        name: "Dratini",
        dexId: 147,
        role: "Long-term dragon investment",
        fastMove: "Dragon Breath",
        chargedMove: "Aqua Tail"
      },
      {
        name: "Beldum",
        dexId: 374,
        role: "Steel endgame project",
        fastMove: "Zen Headbutt",
        chargedMove: "Meteor Mash"
      }
    ],
    searchTags: ["research", "tasks", "breakthrough", "special research", "streak"]
  },
  {
    id: 7,
    slug: "community-day-sprint",
    title: "Community Day Sprint",
    category: "events",
    categoryLabel: "Live Events",
    description:
      "Convert limited event hours into top move unlocks, XL stock, and high-IV evolution lines.",
    cadence: "Monthly spotlight event",
    intensity: 5,
    idealFor: ["Exclusive moves", "Candy farming", "Shiny hunting"],
    prepChecklist: [
      "Clear bag and storage before event start.",
      "Prepare lures, incense, and ultra balls for full-duration uptime.",
      "Tag evolution candidates ahead of event windows.",
      "Plan Stardust and XP boosts for bonus multipliers."
    ],
    actionLoop: [
      "Catch continuously in dense spawn zones.",
      "Prioritize high-IV and PvP IV checks between clusters.",
      "Evolve key candidates inside the move-unlock window.",
      "Trade extras after event to reroll IV outcomes."
    ],
    proTips: [
      "A short pre-event setup often adds 20-30% more effective catches.",
      "Keep one mega active to maximize candy from same-type catches.",
      "Do quick appraisal batches every 10-15 minutes instead of every catch."
    ],
    commonMistakes: [
      "Forgetting to evolve during the exclusive move window.",
      "Running out of balls from poor inventory prep.",
      "Ignoring PvP IVs and transferring valuable league candidates."
    ],
    rewards: [
      {
        reward: "Exclusive charged move access",
        source: "Event-limited evolutions",
        priority: "High",
        note: "Defines many top raid and PvP versions of species."
      },
      {
        reward: "Large candy and XL candy volume",
        source: "High catch density",
        priority: "High",
        note: "Best monthly window for long-term power projects."
      },
      {
        reward: "Shiny variants",
        source: "Boosted event rates",
        priority: "Medium",
        note: "Strong cosmetic and collection value."
      },
      {
        reward: "XP and Stardust spikes",
        source: "Event multipliers",
        priority: "Medium",
        note: "High impact when paired with boost items."
      }
    ],
    featuredPokemon: [
      {
        name: "Charizard",
        dexId: 6,
        role: "Classic exclusive move closer",
        fastMove: "Wing Attack",
        chargedMove: "Blast Burn"
      },
      {
        name: "Garchomp",
        dexId: 445,
        role: "Raid and Master League crossover",
        fastMove: "Mud Shot",
        chargedMove: "Earth Power"
      },
      {
        name: "Hydreigon",
        dexId: 635,
        role: "Dark raid specialist",
        fastMove: "Bite",
        chargedMove: "Brutal Swing"
      }
    ],
    searchTags: ["community day", "exclusive move", "event", "xl", "shiny"]
  },
  {
    id: 8,
    slug: "routes-exploration-loop",
    title: "Routes Exploration Loop",
    category: "exploration",
    categoryLabel: "Exploration Layer",
    description:
      "Use route sessions for long-walk rewards, buddy progress, and map variety without losing efficiency.",
    cadence: "Weekly walking cycles",
    intensity: 3,
    idealFor: ["Walking gameplay", "Buddy progression", "Exploration goals"],
    prepChecklist: [
      "Select routes with safe loops and high pokestop density.",
      "Enable Adventure Sync before long sessions.",
      "Set buddy species that benefits most from distance progress.",
      "Carry incubator and research tasks aligned with walking."
    ],
    actionLoop: [
      "Start route near active stop clusters for task refresh.",
      "Maintain catch rhythm while progressing route objectives.",
      "Track route completion rewards and repeat high-value paths.",
      "Review buddy hearts and distance milestones after each loop."
    ],
    proTips: [
      "Short repeatable routes can outperform one long low-density path.",
      "Pair route sessions with incense windows for better spawn density.",
      "Use route time to clear low-intensity research tasks."
    ],
    commonMistakes: [
      "Running routes with poor spawn density and no task synergy.",
      "Ignoring buddy selection and wasting distance progress.",
      "Starting routes without enough bag or ball capacity."
    ],
    rewards: [
      {
        reward: "Route completion rewards",
        source: "Completed route sessions",
        priority: "Medium",
        note: "Adds steady item and progression value."
      },
      {
        reward: "Buddy progress",
        source: "Distance and interactions",
        priority: "High",
        note: "Supports best buddy boosts and candy gains."
      },
      {
        reward: "Exploration XP",
        source: "Route and catch activity",
        priority: "Medium",
        note: "Excellent passive progression for active walkers."
      },
      {
        reward: "Additional encounters",
        source: "Route-integrated spawns",
        priority: "Low",
        note: "Variable value depending on local route quality."
      }
    ],
    featuredPokemon: [
      {
        name: "Zygarde",
        dexId: 718,
        role: "Long-term route objective",
        fastMove: "Dragon Tail",
        chargedMove: "Crunch"
      },
      {
        name: "Talonflame",
        dexId: 663,
        role: "Mobility-themed PvP pick",
        fastMove: "Incinerate",
        chargedMove: "Flame Charge"
      },
      {
        name: "Lucario",
        dexId: 448,
        role: "Buddy and hatch milestone payoff",
        fastMove: "Counter",
        chargedMove: "Aura Sphere"
      }
    ],
    searchTags: ["routes", "walking", "adventure sync", "buddy", "exploration"]
  },
  {
    id: 9,
    slug: "gym-coin-economy",
    title: "Gym Coin Economy",
    category: "economy",
    categoryLabel: "Resource Economy",
    description:
      "Maintain gym defenders and daily coin consistency to support premium play without overspending.",
    cadence: "Daily check-ins",
    intensity: 2,
    idealFor: ["Free-to-play stability", "Item shop budgeting", "Defender strategy"],
    prepChecklist: [
      "Keep a rotation of high-bulk defenders ready.",
      "Target gyms with moderate turnover for reliable returns.",
      "Use berries to extend key defender windows when needed.",
      "Track daily coin cap and stop overcommitting once reached."
    ],
    actionLoop: [
      "Drop defenders in multiple locations instead of one stack.",
      "Check return timing and redistribute defenders later in the day.",
      "Spend coins only on planned upgrades and event prep items.",
      "Review defender performance and replace weak anchors."
    ],
    proTips: [
      "A stable daily coin routine compounds more than sporadic big gym pushes.",
      "Balanced defenders across locations reduce full-team wipe risk.",
      "Coin discipline protects raid pass and bag upgrade progress."
    ],
    commonMistakes: [
      "Placing all top defenders in one contested gym.",
      "Buying impulse shop items that delay storage upgrades.",
      "Ignoring local gym turnover patterns and losing consistency."
    ],
    rewards: [
      {
        reward: "Daily Pokecoins",
        source: "Returned gym defenders",
        priority: "High",
        note: "Primary free-to-play premium currency stream."
      },
      {
        reward: "Defender Stardust",
        source: "Gym interactions",
        priority: "Low",
        note: "Small extra value over long periods."
      },
      {
        reward: "Berry feed value",
        source: "Remote and local feeding",
        priority: "Low",
        note: "Minor progression plus defender sustain."
      },
      {
        reward: "Strategic map control",
        source: "Gym presence",
        priority: "Medium",
        note: "Improves local raid convenience and visibility."
      }
    ],
    featuredPokemon: [
      {
        name: "Blissey",
        dexId: 242,
        role: "Bulk defender anchor",
        fastMove: "Zen Headbutt",
        chargedMove: "Dazzling Gleam"
      },
      {
        name: "Metagross",
        dexId: 376,
        role: "Steel defense pressure",
        fastMove: "Bullet Punch",
        chargedMove: "Meteor Mash"
      },
      {
        name: "Dragonite",
        dexId: 149,
        role: "Generalist gym holder",
        fastMove: "Dragon Breath",
        chargedMove: "Dragon Claw"
      }
    ],
    searchTags: ["gym", "coins", "defenders", "economy", "f2p"]
  },
  {
    id: 10,
    slug: "friendship-trade-engine",
    title: "Friendship & Trade Engine",
    category: "social",
    categoryLabel: "Social Network",
    description:
      "Use friendship milestones and trade loops to cut costs, reroll IVs, and unlock lucky upgrades.",
    cadence: "Daily gifts + weekly trade sessions",
    intensity: 3,
    idealFor: ["Stardust efficiency", "Lucky collections", "Regional dex growth"],
    prepChecklist: [
      "Maintain active friend list with daily interaction cadence.",
      "Queue trade targets by rarity and power-up cost impact.",
      "Coordinate lucky friend trades for expensive legendaries.",
      "Stockpile duplicate event species for IV rerolls."
    ],
    actionLoop: [
      "Send and open gifts daily for friendship progression.",
      "Batch trades during dedicated windows to reduce friction.",
      "Prioritize high-dust savings targets in lucky opportunities.",
      "Track special trade limits before major event weekends."
    ],
    proTips: [
      "Lucky trades can save massive Stardust on endgame projects.",
      "Friendship XP spikes are strongest with coordinated level-ups.",
      "Build a trade backlog so special-trade slots are never wasted."
    ],
    commonMistakes: [
      "Using lucky trades on low-impact species.",
      "Missing coordinated friendship level-up timing and losing XP boosts.",
      "Special trading without clear priority and burning limited slots."
    ],
    rewards: [
      {
        reward: "Lucky Pokemon",
        source: "Lucky friend and random lucky trades",
        priority: "High",
        note: "Lower power-up cost and strong IV floor."
      },
      {
        reward: "Friendship XP",
        source: "Daily interactions and milestones",
        priority: "High",
        note: "Major account-leveling accelerator."
      },
      {
        reward: "IV rerolls",
        source: "Regular trades",
        priority: "Medium",
        note: "Great for hunting PvP and raid optimization spreads."
      },
      {
        reward: "Regional dex progress",
        source: "Cross-region trading",
        priority: "Medium",
        note: "Efficient way to close missing dex entries."
      }
    ],
    featuredPokemon: [
      {
        name: "Lucario",
        dexId: 448,
        role: "High-value lucky trade target",
        fastMove: "Counter",
        chargedMove: "Aura Sphere"
      },
      {
        name: "Gardevoir",
        dexId: 282,
        role: "Fairy specialist build",
        fastMove: "Charm",
        chargedMove: "Dazzling Gleam"
      },
      {
        name: "Gengar",
        dexId: 94,
        role: "Efficient lucky raid attacker",
        fastMove: "Lick",
        chargedMove: "Shadow Ball"
      }
    ],
    searchTags: ["friendship", "trades", "lucky", "xp", "social"]
  }
];

const POKEMON_GO_ACTIVITY_SEARCH_INDEX = POKEMON_GO_ACTIVITIES.map((activity) => ({
  activity,
  haystack: [
    activity.title,
    activity.categoryLabel,
    activity.description,
    activity.cadence,
    ...activity.idealFor,
    ...activity.prepChecklist,
    ...activity.actionLoop,
    ...activity.proTips,
    ...activity.commonMistakes,
    ...activity.rewards.map((entry) => `${entry.reward} ${entry.source} ${entry.note}`),
    ...activity.featuredPokemon.map((entry) => `${entry.name} ${entry.role}`),
    ...activity.searchTags
  ]
    .map(normalize)
    .join(" ")
}));
const POKEMON_GO_ACTIVITY_BY_ID = new Map(
  POKEMON_GO_ACTIVITIES.map((activity) => [activity.id, activity])
);

export function searchPokemonGoActivities(query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return POKEMON_GO_ACTIVITIES;
  }

  return POKEMON_GO_ACTIVITY_SEARCH_INDEX.filter((entry) =>
    entry.haystack.includes(normalizedQuery)
  ).map((entry) => entry.activity);
}

export function getPokemonGoActivityById(activityId: number | null) {
  if (activityId === null) {
    return null;
  }
  return POKEMON_GO_ACTIVITY_BY_ID.get(activityId) ?? null;
}

export function getPokemonGoCategoryOptions() {
  const map = new Map<PokemonGoActivityCategory, string>();
  for (const entry of POKEMON_GO_ACTIVITIES) {
    if (!map.has(entry.category)) {
      map.set(entry.category, entry.categoryLabel);
    }
  }
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
}
