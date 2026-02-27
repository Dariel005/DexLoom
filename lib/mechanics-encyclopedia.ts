export interface MechanicsTopic {
  slug: string;
  title: string;
  summary: string;
  checklist: string[];
  focusSystems: string[];
  advancedNotes: string[];
  commonMistakes: string[];
  practiceLoop: string[];
  tags: string[];
}

export interface MechanicsHudFrame {
  slug: string;
  eraLabel: string;
  gamesLabel: string;
  imageSrc: string;
  imageAlt: string;
  sourceLabel: string;
  sourceHref: string;
  uiHighlights: string[];
}

export interface MechanicsBattleFlowEntry {
  phase: string;
  priorityWindow: string;
  details: string;
  failurePattern: string;
}

export interface MechanicsPowerSystemEntry {
  generationWindow: string;
  mechanic: string;
  activation: string;
  offensiveEdge: string;
  counterplay: string;
}

export interface MechanicsRecipe {
  title: string;
  objective: string;
  steps: string[];
  expectedOutcome: string;
}

export const MECHANICS_TOPICS: MechanicsTopic[] = [
  {
    slug: "type-effectiveness",
    title: "Type Effectiveness",
    summary:
      "Damage multipliers, immunities, resistance stacking, and role compression for both singles and doubles.",
    checklist: [
      "2x/4x weakness identification before team lock",
      "1/2x/1/4x defensive pivot planning",
      "Immunity pivots (Ground, Ghost, Electric, Dragon/Fairy)",
      "Coverage overlap and move-slot efficiency audit"
    ],
    focusSystems: [
      "STAB + Terastal or legacy boost interactions",
      "Defensive cores and safe-switch routing",
      "Lead matchup matrix and endgame clean routes"
    ],
    advancedNotes: [
      "Map offensive coverage in pairs (primary + emergency neutral hit) rather than isolated move slots.",
      "Use immunities to force turn advantage instead of only chasing raw OHKO ranges.",
      "Track role compression: one Pokemon should solve at least two matchup families."
    ],
    commonMistakes: [
      "Overinvesting in super-effective hits with no defensive fallback.",
      "Ignoring neutral damage breakpoints from high-BP options.",
      "Building six attackers with no pivot immunity chain."
    ],
    practiceLoop: [
      "Build a six-mon draft -> mark every 4x weakness -> assign one hard answer.",
      "Run five matchups and document the turn where typing advantage flipped.",
      "Adjust only one slot and repeat to isolate true weaknesses."
    ],
    tags: ["mechanics", "types", "battle", "coverage", "team-building"]
  },
  {
    slug: "breeding-iv-ev-nature",
    title: "Breeding / IV / EV / Nature",
    summary:
      "Stat engineering pipeline for competitive-ready monsters with minimal wasted resources.",
    checklist: [
      "Target nature + ability lock before egg cycle",
      "IV inheritance route with Destiny Knot and parent filter",
      "EV spread blueprint by role and speed tier",
      "Final benchmark test against known meta threats"
    ],
    focusSystems: [
      "Speed tier control and creep planning",
      "Damage roll optimization by EV breakpoints",
      "Nature and IV tradeoffs by role"
    ],
    advancedNotes: [
      "EVs should be bought by benchmark, not by habit (ex: survive specific spread move).",
      "Speed investment is a strategic contract; every extra point must beat a known tier.",
      "Hidden wasted EVs usually appear after item and ability modifiers are ignored."
    ],
    commonMistakes: [
      "Copy-pasting spreads without checking current format speed tiers.",
      "Maxing two stats on support Pokemon with no utility benchmark.",
      "Ignoring imperfect IV benefits (ex: low Atk to reduce confusion/Foul Play damage)."
    ],
    practiceLoop: [
      "Pick one role target (pivot/sweeper/wall).",
      "Define 3 benchmark threats.",
      "Tune IV/EV/Nature until all three are covered, then freeze spread."
    ],
    tags: ["mechanics", "training", "breeding", "iv", "ev", "nature"]
  },
  {
    slug: "shiny-status-weather-terrain",
    title: "Shiny / Status / Weather / Terrain",
    summary:
      "Probability systems and field-state modifiers that transform both tempo and win conditions.",
    checklist: [
      "Shiny method + odds stack understanding by era",
      "Primary status condition impact map",
      "Weather and terrain turn economy tracking",
      "Field-state denial and overwrite strategy"
    ],
    focusSystems: [
      "Status pressure for tempo denial",
      "Weather-terrain damage/survival breakpoints",
      "Field control and resource attrition"
    ],
    advancedNotes: [
      "Burn and paralysis are often tempo tools, not only chip effects.",
      "Weather and terrain should be timed for sweep windows, not activated immediately.",
      "Shiny farming routes are optimized by encounter speed and chain stability."
    ],
    commonMistakes: [
      "Triggering weather too early and losing turns before your win condition enters.",
      "Treating status as random utility instead of planned turn control.",
      "Ignoring opposing field overwrite options."
    ],
    practiceLoop: [
      "Run one weather offense script and one anti-weather script.",
      "Track terrain turns consumed before your carry enters.",
      "Log status infliction success to identify over/under-committing."
    ],
    tags: ["mechanics", "status", "weather", "terrain", "shiny"]
  },
  {
    slug: "generation-mechanics",
    title: "Generation Mechanics",
    summary:
      "Feature timeline from legacy formulas to modern transformation systems and regional battle identities.",
    checklist: [
      "Generation feature timeline alignment",
      "Mega/Z/Dynamax/Terastal activation logic",
      "Regional forms and signature gimmick impact",
      "Format-dependent adaptation notes"
    ],
    focusSystems: [
      "Power system window control",
      "Counter-gimmick planning",
      "Cross-generation adaptation and role translation"
    ],
    advancedNotes: [
      "Every generation-specific power system changes turn value, not only damage output.",
      "The best adaptation pattern is role translation: keep role, replace mechanic.",
      "Counterplay should be prepared before activation turn, not as reaction."
    ],
    commonMistakes: [
      "Forcing previous-gen habits into new gimmick ecosystems.",
      "Using high-impact mechanics on the first safe turn without scouting.",
      "Ignoring format ruleset limits when evaluating a system."
    ],
    practiceLoop: [
      "Pick one archetype (balance/offense/trick room).",
      "Port it across two generations with different gimmicks.",
      "Document what changed in win condition timing."
    ],
    tags: ["mechanics", "generations", "meta-systems", "timeline", "battle-flow"]
  }
];

export const MECHANICS_HUD_GALLERY: MechanicsHudFrame[] = [
  {
    slug: "hud-gen1",
    eraLabel: "Generation I",
    gamesLabel: "Red / Blue / Yellow",
    imageSrc: "/images/mechanics/battle-hud/gen1.png",
    imageAlt: "Generation I battle HUD screenshot",
    sourceLabel: "Bulbagarden Archives - Supersonic I",
    sourceHref: "https://archives.bulbagarden.net/wiki/File:Supersonic_I.png",
    uiHighlights: [
      "Minimal HP/level panels",
      "No abilities or weather overlay",
      "Core move log and status-first readability"
    ]
  },
  {
    slug: "hud-gen3",
    eraLabel: "Generation III",
    gamesLabel: "Ruby / Sapphire / Emerald",
    imageSrc: "/images/mechanics/battle-hud/gen3.png",
    imageAlt: "Generation III battle HUD screenshot",
    sourceLabel: "Bulbagarden Archives - Supersonic III",
    sourceHref: "https://archives.bulbagarden.net/wiki/File:Supersonic_III.png",
    uiHighlights: [
      "Cleaner HP bar readout with icon polish",
      "Improved move feedback text rhythm",
      "Still compact and low-clutter layout"
    ]
  },
  {
    slug: "hud-gen5",
    eraLabel: "Generation V",
    gamesLabel: "Black / White",
    imageSrc: "/images/mechanics/battle-hud/gen5.png",
    imageAlt: "Generation V battle HUD screenshot",
    sourceLabel: "Bulbagarden Archives - Supersonic V",
    sourceHref: "https://archives.bulbagarden.net/wiki/File:Supersonic_V.png",
    uiHighlights: [
      "Dynamic camera framing and depth feel",
      "Higher visual separation between battlers",
      "Better readability of action state"
    ]
  },
  {
    slug: "hud-gen7",
    eraLabel: "Generation VII",
    gamesLabel: "Sun / Moon",
    imageSrc: "/images/mechanics/battle-hud/gen7.png",
    imageAlt: "Generation VII battle HUD screenshot",
    sourceLabel: "Bulbagarden Archives - Supersonic VII",
    sourceHref: "https://archives.bulbagarden.net/wiki/File:Supersonic_VII.png",
    uiHighlights: [
      "Modernized battle scene framing",
      "Expanded UI clarity for status and actions",
      "High contrast text and panel language"
    ]
  },
  {
    slug: "hud-gen8",
    eraLabel: "Generation VIII",
    gamesLabel: "Sword / Shield",
    imageSrc: "/images/mechanics/battle-hud/gen8.png",
    imageAlt: "Generation VIII battle HUD screenshot",
    sourceLabel: "Bulbagarden Archives - Supersonic VIII",
    sourceHref: "https://archives.bulbagarden.net/wiki/File:Supersonic_VIII.png",
    uiHighlights: [
      "Arena-scale staging with broadcast feel",
      "HUD tuned for spectacle mechanics",
      "Strong telegraphing of attack sequence"
    ]
  },
  {
    slug: "hud-gen9",
    eraLabel: "Generation IX",
    gamesLabel: "Scarlet / Violet",
    imageSrc: "/images/mechanics/battle-hud/gen9.png",
    imageAlt: "Generation IX battle HUD screenshot",
    sourceLabel: "Bulbagarden Archives - Supersonic IX",
    sourceHref: "https://archives.bulbagarden.net/wiki/File:Supersonic_IX.png",
    uiHighlights: [
      "Open-battle identity with updated panel style",
      "Cinematic camera and updated action framing",
      "Modern iconography and readability balance"
    ]
  }
];

export const MECHANICS_BATTLE_FLOW: MechanicsBattleFlowEntry[] = [
  {
    phase: "Preview / Lead Selection",
    priorityWindow: "Before turn 1",
    details: "Evaluate matchups, hazards, speed control, and immediate pivot lines.",
    failurePattern: "Choosing a lead with no safe switch chain."
  },
  {
    phase: "Turn Order Resolution",
    priorityWindow: "Action declaration",
    details: "Priority brackets, speed ties, and temporary speed modifiers define execution order.",
    failurePattern: "Ignoring hidden speed control (paralysis, Tailwind, item boosts)."
  },
  {
    phase: "Damage & Effect Resolution",
    priorityWindow: "Mid-turn",
    details: "Move power, type interaction, stats, ability/item modifiers, and random roll resolve.",
    failurePattern: "Overcommitting to low-probability KO ranges."
  },
  {
    phase: "Secondary & Field Effects",
    priorityWindow: "Post-action",
    details: "Status procs, recoil, weather, terrain, and field chips update board state.",
    failurePattern: "Forgetting end-of-turn chip math before next commitment."
  },
  {
    phase: "Win Condition Shift",
    priorityWindow: "After each KO/trade",
    details: "Re-evaluate remaining defensive pivots and sweep windows after every removal.",
    failurePattern: "Following preplanned script after board state changed."
  }
];

export const MECHANICS_POWER_SYSTEMS: MechanicsPowerSystemEntry[] = [
  {
    generationWindow: "Gen VI",
    mechanic: "Mega Evolution",
    activation: "One-time transformation of selected species mid-battle.",
    offensiveEdge: "Stat spikes and ability swaps create immediate pressure.",
    counterplay: "Force timing early or pivot around revealed Mega role."
  },
  {
    generationWindow: "Gen VII",
    mechanic: "Z-Moves",
    activation: "One burst move per battle with crystal/type constraints.",
    offensiveEdge: "Breaks defensive cores through guaranteed high-power strike.",
    counterplay: "Scout the carrier and preserve one sacrificial or resistant pivot."
  },
  {
    generationWindow: "Gen VIII",
    mechanic: "Dynamax / Gigantamax",
    activation: "Three-turn HP boost and move conversion window.",
    offensiveEdge: "Tempo swing via bulk + weather/terrain setup from Max moves.",
    counterplay: "Defensive stalling, Protect cycles, and forced positioning."
  },
  {
    generationWindow: "Gen IX",
    mechanic: "Terastalization",
    activation: "One-time type shift with STAB realignment.",
    offensiveEdge: "Rewrites matchup chart and can create surprise resist/offense lines.",
    counterplay: "Read likely tera profile and keep flexible neutral coverage."
  }
];

export const MECHANICS_BUILD_RECIPES: MechanicsRecipe[] = [
  {
    title: "Balanced Ladder Core",
    objective: "Build a stable team with low matchup volatility.",
    steps: [
      "Start with one defensive anchor and one speed controller.",
      "Add one wallbreaker that punishes passive teams.",
      "Cover at least two immunity axes (Ground + Ghost recommended).",
      "Finalize with hazard control and emergency revenge option."
    ],
    expectedOutcome: "Safer game plans across unknown opponents."
  },
  {
    title: "Weather Pressure Script",
    objective: "Create a tempo offense around limited weather turns.",
    steps: [
      "Define weather setter and immediate abuser pair.",
      "Assign one anti-weather pivot for mirror matchups.",
      "Plan weather turns as resource windows, not default state.",
      "Reserve a late cleaner that works even without weather."
    ],
    expectedOutcome: "Controlled explosive turns without auto-losing when weather drops."
  },
  {
    title: "Tournament Prep Loop",
    objective: "Convert theory into repeatable match execution.",
    steps: [
      "Identify three meta threats and write first-three-turn plans.",
      "Run 10 test games and track failure turns.",
      "Patch one matchup gap at a time; avoid full rebuild panic.",
      "Lock final six and practice only lead/pivot discipline."
    ],
    expectedOutcome: "Cleaner decision speed and fewer high-risk misreads."
  }
];
