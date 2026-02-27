import { CHARACTER_WIKI_INDEX } from "@/lib/characters-encyclopedia";
import { LOCATION_WIKI_INDEX } from "@/lib/locations-encyclopedia";
import { MECHANICS_TOPICS } from "@/lib/mechanics-encyclopedia";

export interface WikiMenuLink {
  label: string;
  href: string;
  required?: boolean;
}

export interface WikiSearchEntry {
  title: string;
  href: string;
  keywords: string[];
}

export const WIKI_PRIMARY_MENU: WikiMenuLink[] = [
  { label: "Pokemon", href: "/", required: true },
  { label: "Tools", href: "/tools", required: true },
  { label: "Moves", href: "/moves", required: true },
  { label: "Items", href: "/items", required: true },
  { label: "Abilities", href: "/abilities", required: true },
  { label: "Maps", href: "/maps", required: true },
  { label: "Games", href: "/games", required: true },
  { label: "Mechanics", href: "/mechanics", required: true }
];

export const WIKI_SECONDARY_MENU: WikiMenuLink[] = [
  { label: "Types", href: "/types" },
  { label: "Cards", href: "/cards" },
  { label: "ROM Hacks", href: "/rom-hacks" },
  { label: "Pokemon GO", href: "/pokemon-go" },
  { label: "Characters", href: "/characters", required: true },
  { label: "Favorites", href: "/favorites", required: true },
  { label: "Social", href: "/social", required: true },
  { label: "Profile", href: "/profile/me", required: true },
  { label: "Sources", href: "/sources", required: true }
];

const baseSearchEntries: WikiSearchEntry[] = [
  { title: "Home Pokedex", href: "/", keywords: ["pokemon", "pokedex", "home"] },
  { title: "Tools Workspace", href: "/tools", keywords: ["tools", "pro tools", "filters", "audio"] },
  {
    title: "Tools Filters Console",
    href: "/tools/filters",
    keywords: ["tools", "filters", "search", "generation", "type", "attack"]
  },
  {
    title: "Tools Comparator Engine",
    href: "/tools/comparator",
    keywords: ["tools", "comparator", "compare", "role", "bst", "offense", "defense"]
  },
  {
    title: "Tools Team Builder Matrix",
    href: "/tools/team-builder",
    keywords: ["tools", "team builder", "synergy", "coverage", "weakness", "resist"]
  },
  {
    title: "Tools Move Planner Desk",
    href: "/tools/move-planner",
    keywords: ["tools", "move planner", "learnset", "method", "tm", "tutor"]
  },
  {
    title: "Tools Audio Deck",
    href: "/tools/audio",
    keywords: ["tools", "audio", "sound", "volume", "feedback"]
  },
  { title: "Moves Encyclopedia", href: "/moves", keywords: ["moves", "attacks"] },
  { title: "Items Encyclopedia", href: "/items", keywords: ["items", "objects"] },
  { title: "Abilities Encyclopedia", href: "/abilities", keywords: ["abilities"] },
  { title: "Types Encyclopedia", href: "/types", keywords: ["types", "effectiveness"] },
  { title: "Cards Encyclopedia", href: "/cards", keywords: ["cards", "tcg"] },
  { title: "Maps Encyclopedia", href: "/maps", keywords: ["maps", "regions"] },
  { title: "Games Encyclopedia", href: "/games", keywords: ["games", "video games", "mainline", "spin-off"] },
  {
    title: "ROM Hacks Directory",
    href: "/rom-hacks",
    keywords: ["rom hacks", "fan games", "patch projects", "community projects"]
  },
  { title: "Pokemon GO Encyclopedia", href: "/pokemon-go", keywords: ["pokemon go"] },
  { title: "Mechanics Guide", href: "/mechanics", keywords: ["mechanics"] },
  { title: "Characters Directory", href: "/characters", keywords: ["characters", "trainers"] },
  { title: "My Favorites", href: "/favorites", keywords: ["favorites", "saved", "bookmarks"] },
  { title: "Trainer Social", href: "/social", keywords: ["friends", "social", "network"] },
  { title: "My Trainer Profile", href: "/profile/me", keywords: ["profile", "avatar", "privacy"] },
  { title: "Sources & Credits", href: "/sources", keywords: ["sources", "credits", "copyright"] }
];

const characterSearchEntries: WikiSearchEntry[] = CHARACTER_WIKI_INDEX.map((character) => ({
  title: character.name,
  href: `/characters/${character.slug}`,
  keywords: ["character", character.roleHint, ...character.gameTags]
}));

const mechanicsSearchEntries: WikiSearchEntry[] = MECHANICS_TOPICS.map((topic) => ({
  title: topic.title,
  href: `/mechanics#${topic.slug}`,
  keywords: topic.tags
}));

const locationSearchEntries: WikiSearchEntry[] = LOCATION_WIKI_INDEX.map((location) => ({
  title: `${location.name} (${location.regionName})`,
  href: `/locations/${location.slug}`,
  keywords: ["location", location.regionName, location.locationType]
}));

export const WIKI_SEARCH_INDEX: WikiSearchEntry[] = [
  ...baseSearchEntries,
  ...locationSearchEntries,
  ...characterSearchEntries,
  ...mechanicsSearchEntries
];
