import { type PokemonItemDetail } from "@/types/item";

const POTION_KEYWORDS = [
  "potion",
  "revive",
  "elixir",
  "ether",
  "heal",
  "antidote",
  "awakening",
  "full-restore",
  "full-heal",
  "max-potion",
  "max-revive"
] as const;

export type ItemSectionKey =
  | "all"
  | "poke-balls"
  | "potions"
  | "berries"
  | "battle-items"
  | "held-items"
  | "tms-hms"
  | "key-items";

export interface ItemSectionDefinition {
  key: ItemSectionKey;
  label: string;
  description: string;
}

export interface ItemSectionTarget {
  name: string;
  pocketKey: string;
  categoryKey: string;
}

export interface SectionVisualTheme {
  accent: string;
  from: string;
  to: string;
  soft: string;
  chip: string;
}

export interface ItemKitDefinition {
  key: string;
  label: string;
  description: string;
  section: ItemSectionKey;
  query?: string;
}

export interface ItemTierMeta {
  tier: "S" | "A" | "B" | "C";
  reason: string;
  color: string;
  bg: string;
}

export const ITEM_SECTIONS: ItemSectionDefinition[] = [
  {
    key: "all",
    label: "All Items",
    description: "Complete catalog across every pocket."
  },
  {
    key: "poke-balls",
    label: "Poke Balls",
    description: "Capture tools for wild Pokemon."
  },
  {
    key: "potions",
    label: "Potions",
    description: "Recovery and status medicine."
  },
  {
    key: "berries",
    label: "Berries",
    description: "Natural items for healing, effects, and battle utility."
  },
  {
    key: "battle-items",
    label: "Battle Items",
    description: "In-battle boosts and tactical tools."
  },
  {
    key: "held-items",
    label: "Held Items",
    description: "Held, evolution, and general trainer items."
  },
  {
    key: "tms-hms",
    label: "TMs / HMs",
    description: "Move-teaching technical items."
  },
  {
    key: "key-items",
    label: "Key Items",
    description: "Story and progression-related special items."
  }
];

export const ITEM_KITS: ItemKitDefinition[] = [
  {
    key: "starter-journey",
    label: "Starter Journey",
    description: "Core route setup with healing and reliable catches.",
    section: "potions",
    query: "potion"
  },
  {
    key: "catching-pro",
    label: "Catching Pro",
    description: "Fast access to Poke Ball families for capture chains.",
    section: "poke-balls"
  },
  {
    key: "battle-lab",
    label: "Battle Lab",
    description: "In-battle boosters and tactical consumables.",
    section: "battle-items"
  },
  {
    key: "berry-lane",
    label: "Berry Lane",
    description: "Utility berries for sustain, status, and matchups.",
    section: "berries"
  },
  {
    key: "progression-path",
    label: "Progression Path",
    description: "Important key items and special progression tools.",
    section: "key-items"
  }
];

export const DEFAULT_SECTION_THEME: SectionVisualTheme = {
  accent: "#5b6b7b",
  from: "#f5f8fb",
  to: "#e6edf3",
  soft: "rgba(91, 107, 123, 0.14)",
  chip: "rgba(91, 107, 123, 0.18)"
};

const SECTION_THEME_BY_LABEL: Record<string, SectionVisualTheme> = {
  "All Items": {
    accent: "#64748b",
    from: "#f5f8fb",
    to: "#e6edf3",
    soft: "rgba(100, 116, 139, 0.16)",
    chip: "rgba(100, 116, 139, 0.22)"
  },
  "Poke Balls": {
    accent: "#d53b47",
    from: "#fff4f5",
    to: "#ffe8ec",
    soft: "rgba(213, 59, 71, 0.16)",
    chip: "rgba(213, 59, 71, 0.2)"
  },
  Potions: {
    accent: "#2a6fe8",
    from: "#f2f7ff",
    to: "#e3eeff",
    soft: "rgba(42, 111, 232, 0.18)",
    chip: "rgba(42, 111, 232, 0.22)"
  },
  Berries: {
    accent: "#d0642f",
    from: "#fff5ec",
    to: "#ffe7d4",
    soft: "rgba(208, 100, 47, 0.16)",
    chip: "rgba(208, 100, 47, 0.22)"
  },
  "Battle Items": {
    accent: "#6f42c1",
    from: "#f7f2ff",
    to: "#ece2ff",
    soft: "rgba(111, 66, 193, 0.18)",
    chip: "rgba(111, 66, 193, 0.23)"
  },
  "Held Items": {
    accent: "#2f855a",
    from: "#effcf4",
    to: "#ddf7e8",
    soft: "rgba(47, 133, 90, 0.18)",
    chip: "rgba(47, 133, 90, 0.24)"
  },
  "TMs / HMs": {
    accent: "#2d6a87",
    from: "#f0f9ff",
    to: "#dff2fb",
    soft: "rgba(45, 106, 135, 0.18)",
    chip: "rgba(45, 106, 135, 0.24)"
  },
  "Key Items": {
    accent: "#7d4c2f",
    from: "#fff8f0",
    to: "#f9ebdd",
    soft: "rgba(125, 76, 47, 0.16)",
    chip: "rgba(125, 76, 47, 0.22)"
  }
};

function includesAnyKeyword(value: string, keywords: readonly string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function formatCost(value: number) {
  if (!value || value <= 0) {
    return "Not sold";
  }
  return `P$ ${value.toLocaleString()}`;
}

export function matchesSection(item: ItemSectionTarget, sectionKey: ItemSectionKey) {
  if (sectionKey === "all") {
    return true;
  }
  if (sectionKey === "poke-balls") {
    return item.pocketKey === "pokeballs";
  }
  if (sectionKey === "potions") {
    return (
      item.pocketKey === "medicine" ||
      includesAnyKeyword(item.name, POTION_KEYWORDS) ||
      item.categoryKey.includes("healing") ||
      item.categoryKey.includes("status") ||
      item.categoryKey.includes("revival")
    );
  }
  if (sectionKey === "berries") {
    return item.pocketKey === "berries";
  }
  if (sectionKey === "battle-items") {
    return item.pocketKey === "battle";
  }
  if (sectionKey === "held-items") {
    return item.pocketKey === "items";
  }
  if (sectionKey === "tms-hms") {
    return item.pocketKey === "tm-hm";
  }
  if (sectionKey === "key-items") {
    return item.pocketKey === "key-items";
  }
  return false;
}

export function resolveSectionLabel(item: ItemSectionTarget) {
  const matched = ITEM_SECTIONS.find(
    (section) => section.key !== "all" && matchesSection(item, section.key)
  );
  return matched?.label ?? "All Items";
}

export function getSectionTheme(label: string | null | undefined): SectionVisualTheme {
  if (!label) {
    return DEFAULT_SECTION_THEME;
  }
  return SECTION_THEME_BY_LABEL[label] ?? DEFAULT_SECTION_THEME;
}

export function buildItemGuide(item: PokemonItemDetail) {
  const sectionLabel = resolveSectionLabel(item);

  if (sectionLabel === "Poke Balls") {
    return {
      role: "Capture utility",
      bestUse: "Use during wild encounters to improve catch control and efficiency.",
      trainerTip:
        "Prioritize specialized balls in the right situation (time, environment, species behavior) for better results."
    };
  }

  if (sectionLabel === "Potions") {
    return {
      role: "Recovery utility",
      bestUse: "Use between or during battles to stabilize HP, PP, and status conditions.",
      trainerTip:
        "Keep lower-cost healing for route grinding and save premium recovery for difficult fights."
    };
  }

  if (sectionLabel === "Berries") {
    return {
      role: "Consumable utility",
      bestUse: "Equip as held items or use directly depending on the berry effect.",
      trainerTip:
        "Pair berries with team weaknesses to reduce matchup risk in longer battles."
    };
  }

  if (sectionLabel === "Battle Items") {
    return {
      role: "Combat utility",
      bestUse: "Use in battle when immediate stat pressure or tempo advantage is needed.",
      trainerTip:
        "Time battle items around key turn windows, not at random, to maximize value."
    };
  }

  if (sectionLabel === "Key Items") {
    return {
      role: "Progression utility",
      bestUse: "Used for world navigation, quest triggers, and mechanical progression.",
      trainerTip:
        "Check key item clues in story routes; many unlock hidden traversal or event paths."
    };
  }

  if (sectionLabel === "TMs / HMs") {
    return {
      role: "Move-learning utility",
      bestUse: "Use to expand move coverage and role flexibility for your team.",
      trainerTip:
        "Teach moves around team synergy first, then optimize individual stats."
    };
  }

  return {
    role: "General utility",
    bestUse: "Use based on item effect, team needs, and current game context.",
    trainerTip:
      "Combine this item with your battle plan, held-item setup, and progression goals."
  };
}

export function buildItemTier(item: PokemonItemDetail): ItemTierMeta {
  const sectionLabel = resolveSectionLabel(item);
  const normalizedName = item.name.toLowerCase();
  let score = 0;

  if (sectionLabel === "Key Items") {
    score += 6;
  } else if (sectionLabel === "TMs / HMs") {
    score += 5;
  } else if (sectionLabel === "Poke Balls") {
    score += 3;
    if (normalizedName.includes("master-ball")) {
      score += 4;
    } else if (
      includesAnyKeyword(normalizedName, [
        "ultra-ball",
        "quick-ball",
        "timer-ball",
        "dusk-ball",
        "net-ball",
        "repeat-ball"
      ])
    ) {
      score += 2;
    }
  } else if (sectionLabel === "Potions") {
    score += 2;
    if (
      includesAnyKeyword(normalizedName, [
        "max-potion",
        "full-restore",
        "max-revive",
        "revive",
        "full-heal",
        "max-elixir"
      ])
    ) {
      score += 2;
    }
  } else if (sectionLabel === "Battle Items") {
    score += 3;
  } else if (sectionLabel === "Held Items") {
    score += 2;
  }

  if (item.cost >= 8_000) {
    score += 1;
  }
  if (item.shortEffect || item.effect) {
    score += 1;
  }
  if (item.attributes.length >= 3) {
    score += 1;
  }
  if (item.heldByPokemon.length > 0) {
    score += 1;
  }
  if (item.machineVersionGroups.length > 0) {
    score += 1;
  }

  if (score >= 8) {
    return {
      tier: "S",
      reason: "High strategic impact in most runs and matchups.",
      color: "#157347",
      bg: "rgba(21, 115, 71, 0.14)"
    };
  }
  if (score >= 6) {
    return {
      tier: "A",
      reason: "Very strong utility with consistent value.",
      color: "#1f6feb",
      bg: "rgba(31, 111, 235, 0.14)"
    };
  }
  if (score >= 4) {
    return {
      tier: "B",
      reason: "Solid role option for specific teams or moments.",
      color: "#a15c00",
      bg: "rgba(161, 92, 0, 0.14)"
    };
  }

  return {
    tier: "C",
    reason: "Niche or situational value.",
    color: "#7a4f9a",
    bg: "rgba(122, 79, 154, 0.14)"
  };
}

export function buildAcquisitionHints(item: PokemonItemDetail) {
  const hints: string[] = [];
  const sectionLabel = resolveSectionLabel(item);

  if (item.cost > 0) {
    hints.push(`Poke Mart purchase route (${formatCost(item.cost)}).`);
  }

  if (item.heldByPokemon.length > 0) {
    hints.push(
      `Wild hold drop source: ${item.heldByPokemon[0]?.name ?? "Pokemon encounters"}${
        item.heldByPokemon[0]?.rarity ? ` (${item.heldByPokemon[0].rarity}% max rate)` : ""
      }.`
    );
  }

  if (item.machineVersionGroups.length > 0) {
    hints.push("Machine-distributed item in selected version groups.");
  }

  if (sectionLabel === "Berries") {
    hints.push("Harvest and farming loops in berry-focused routes.");
  }

  if (sectionLabel === "Key Items") {
    hints.push("Story progression reward, quest unlock, or key interaction.");
  }

  if (hints.length === 0) {
    hints.push("Special events, side activities, and hidden pickups.");
  }

  return hints.slice(0, 4);
}

export function buildAvailabilitySummary(item: PokemonItemDetail) {
  const generationCount = item.availabilityGenerations.length;
  const versionCount = item.availabilityVersions.length;

  if (generationCount === 0 && versionCount === 0) {
    return "No direct generation metadata is exposed for this item in the API snapshot.";
  }

  if (generationCount > 0 && versionCount > 0) {
    return `Tracked across ${generationCount} generations and ${versionCount} game version entries.`;
  }

  if (generationCount > 0) {
    return `Tracked across ${generationCount} generations.`;
  }

  return `Tracked across ${versionCount} game version entries.`;
}

export function buildComboTips(item: PokemonItemDetail) {
  const sectionLabel = resolveSectionLabel(item);

  if (sectionLabel === "Poke Balls") {
    return [
      "Lead with Quick Ball, then pivot to Timer Ball in long turns.",
      "Use Net Ball and Dive Ball rotation for water-heavy routes."
    ];
  }

  if (sectionLabel === "Potions") {
    return [
      "Revive then heal immediately with Max Potion for tempo recovery.",
      "Pair Full Heal with HP recovery to avoid double-action item turns."
    ];
  }

  if (sectionLabel === "Battle Items") {
    return [
      "Stack one stat item early, then pressure with fast attackers.",
      "Save emergency X-items for boss phases or setup windows."
    ];
  }

  if (sectionLabel === "Berries") {
    return [
      "Assign resistance berries to patch team weakness pivots.",
      "Combine passive berry sustain with leftovers-style defense plans."
    ];
  }

  if (sectionLabel === "TMs / HMs") {
    return [
      "Teach coverage move first, then align held item around role.",
      "Avoid duplicate TM coverage unless your matchup plan needs it."
    ];
  }

  return [
    "Pair this item with your current route objective for best value.",
    "Combine with team role planning to avoid redundant inventory slots."
  ];
}
