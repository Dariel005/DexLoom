export type ToolSlug =
  | "filters"
  | "comparator"
  | "team-builder"
  | "move-planner"
  | "audio";

export type ToolTone =
  | "emerald"
  | "cyan"
  | "amber"
  | "violet"
  | "rose";

export interface ToolDefinition {
  slug: ToolSlug;
  href: `/tools/${ToolSlug}`;
  navLabel: string;
  title: string;
  description: string;
  objective: string;
  tone: ToolTone;
  order: number;
  keywords: string[];
}

const TOOL_DEFINITION_LIST: ToolDefinition[] = [
  {
    slug: "filters",
    href: "/tools/filters",
    navLabel: "Filters",
    title: "Filters Console",
    description:
      "Global filtering workspace for Dex ID, type, generation, and attack floor.",
    objective:
      "Lock list constraints quickly before switching into deeper tactical tools.",
    tone: "emerald",
    order: 1,
    keywords: ["filters", "search", "generation", "type", "dex id", "attack"]
  },
  {
    slug: "comparator",
    href: "/tools/comparator",
    navLabel: "Comparator",
    title: "Comparator Engine",
    description:
      "A/B profile comparison with focus scoring for offense, defense, speed, or total spread.",
    objective:
      "Pick the better candidate for a role based on measurable stat profile outcomes.",
    tone: "cyan",
    order: 2,
    keywords: ["comparator", "compare", "a/b", "bst", "role"]
  },
  {
    slug: "team-builder",
    href: "/tools/team-builder",
    navLabel: "Team Builder",
    title: "Team Builder Matrix",
    description:
      "Six-slot builder with defensive risk diagnostics, repeated type detection, and synergy scoring.",
    objective:
      "Assemble balanced squads with fewer stacking weaknesses and stronger coverage stability.",
    tone: "amber",
    order: 3,
    keywords: ["team builder", "team", "coverage", "synergy", "resist", "weakness"]
  },
  {
    slug: "move-planner",
    href: "/tools/move-planner",
    navLabel: "Move Planner",
    title: "Move Planner Desk",
    description:
      "Move routing panel with method filter, search, and quick-learning plan presets.",
    objective:
      "Plan practical move acquisition paths instead of scanning full learnsets manually.",
    tone: "violet",
    order: 4,
    keywords: ["move planner", "learnset", "moves", "tm", "tutor", "egg move"]
  },
  {
    slug: "audio",
    href: "/tools/audio",
    navLabel: "Audio",
    title: "Audio Deck",
    description:
      "Session-level sound controls for interface feedback, focus mode, and accessibility comfort.",
    objective:
      "Tune interaction sounds without leaving the tools workspace.",
    tone: "rose",
    order: 5,
    keywords: ["audio", "sound", "volume", "ui feedback", "accessibility"]
  }
];

export const TOOL_DEFINITIONS = TOOL_DEFINITION_LIST.slice().sort(
  (a, b) => a.order - b.order
);

export const TOOL_DEFINITIONS_BY_SLUG: Record<ToolSlug, ToolDefinition> =
  TOOL_DEFINITIONS.reduce(
    (acc, tool) => {
      acc[tool.slug] = tool;
      return acc;
    },
    {} as Record<ToolSlug, ToolDefinition>
  );

export function getToolDefinition(slug: ToolSlug) {
  return TOOL_DEFINITIONS_BY_SLUG[slug];
}

