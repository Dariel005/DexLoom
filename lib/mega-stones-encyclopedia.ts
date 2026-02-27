import { MEGA_EVOLUTION_INDEX } from "@/lib/mega-evolutions-encyclopedia";

type MegaStoneCategory =
  | "starter-gift"
  | "kalos-core"
  | "oras-only"
  | "lucario-gift"
  | "eon-story"
  | "event-only"
  | "special-protocol";

export interface MegaStoneArchiveEntry {
  itemName: string;
  category: MegaStoneCategory;
  isStone: boolean;
  imageSrc: string;
  imageAlt: string;
  linkedSpecies: string[];
  linkedMegaForms: string[];
  linkedMegaSlugs: string[];
  description: string;
  acquisition: string[];
  availabilityNote?: string;
  searchTokens: string;
}

const STARTER_GIFT_STONES = new Set([
  "Venusaurite",
  "Charizardite X",
  "Charizardite Y",
  "Blastoisinite"
]);

const ORAS_ONLY_STONES = new Set([
  "Altarianite",
  "Audinite",
  "Banettite",
  "Beedrillite",
  "Cameruptite",
  "Galladite",
  "Glalitite",
  "Lopunnite",
  "Metagrossite",
  "Pidgeotite",
  "Sablenite",
  "Salamencite",
  "Sceptilite",
  "Sharpedonite",
  "Slowbronite",
  "Steelixite",
  "Swampertite"
]);

function buildCategory(itemName: string): MegaStoneCategory {
  if (itemName === "Dragon Ascent (no stone)") {
    return "special-protocol";
  }
  if (itemName === "Diancite") {
    return "event-only";
  }
  if (STARTER_GIFT_STONES.has(itemName)) {
    return "starter-gift";
  }
  if (itemName === "Lucarionite") {
    return "lucario-gift";
  }
  if (itemName === "Latiasite" || itemName === "Latiosite") {
    return "eon-story";
  }
  if (ORAS_ONLY_STONES.has(itemName)) {
    return "oras-only";
  }
  return "kalos-core";
}

function formatSpeciesLabel(species: string[]) {
  if (species.length === 0) {
    return "the matching species";
  }
  if (species.length === 1) {
    return species[0];
  }
  return species.join(" / ");
}

function buildDescription(
  itemName: string,
  category: MegaStoneCategory,
  linkedSpecies: string[]
) {
  if (category === "special-protocol") {
    return "Rayquaza uses a move trigger instead of a held stone to activate Mega Evolution.";
  }
  const speciesLabel = formatSpeciesLabel(linkedSpecies);
  return `${itemName} is tuned for ${speciesLabel}. Have the matching Pokemon hold it while your trainer uses a Key Stone in battle.`;
}

function toDreamStoneFileName(itemName: string) {
  return itemName
    .replace(/\(.*?\)/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

function buildAcquisition(
  itemName: string,
  category: MegaStoneCategory
): { acquisition: string[]; availabilityNote?: string } {
  switch (category) {
    case "starter-gift":
      return {
        acquisition: [
          "Pokemon X/Y: Gift route tied to Professor Sycamore's Kanto starter sequence.",
          "ORAS: Usually obtained through postgame Kalos-link gift routes or trade."
        ],
        availabilityNote:
          "Starter-linked stones are typically among the earliest guaranteed mega unlocks."
      };
    case "lucario-gift":
      return {
        acquisition: [
          "Pokemon X/Y: Reward from Korrina's Tower of Mastery progression.",
          "ORAS: Commonly acquired via postgame NPC/trade channels."
        ],
        availabilityNote:
          "Lucarionite is a scripted progression stone in Kalos and a transfer/trade target elsewhere."
      };
    case "eon-story":
      return {
        acquisition: [
          "ORAS: Storyline-linked reward around the Eon Pokemon route.",
          "Pokemon X/Y: Not normally obtained in-world; usually traded or transferred from ORAS-era saves."
        ],
        availabilityNote:
          "Latiasite and Latiosite are strongly tied to version/story progression in Hoenn remakes."
      };
    case "oras-only":
      return {
        acquisition: [
          "ORAS: Hidden sparkle pickup or NPC reward unlocked after major story milestones/postgame.",
          "Pokemon X/Y: Not naturally obtainable; requires trade/transfer support."
        ],
        availabilityNote:
          "This stone belongs to the ORAS expansion wave of Mega Evolutions."
      };
    case "event-only":
      return {
        acquisition: [
          "Gen VI: Event-distributed item tied to Diancie promotions.",
          "No regular overworld pickup route in standard XY/ORAS progression."
        ],
        availabilityNote:
          "Availability depends on limited-time distributions or legacy/event save transfer."
      };
    case "special-protocol":
      return {
        acquisition: [
          "Teach Rayquaza the move Dragon Ascent.",
          "Bring Rayquaza into battle with a trainer Key Stone; no held Mega Stone is required."
        ],
        availabilityNote:
          "This is the only Mega trigger in this module that is move-based instead of item-based."
      };
    case "kalos-core":
    default:
      return {
        acquisition: [
          "Pokemon X/Y: Usually found in late-game Kalos via post-upgrade Mega Ring searches and NPC rewards.",
          "ORAS: Usually found as hidden sparkles or postgame NPC rewards around Hoenn."
        ],
        availabilityNote:
          "Exact pickup spots can vary by version/time window, but the route is generally post-story."
      };
  }
}

const groupedByItem = MEGA_EVOLUTION_INDEX.reduce((map, entry) => {
  const current = map.get(entry.activationItem) ?? [];
  current.push(entry);
  map.set(entry.activationItem, current);
  return map;
}, new Map<string, typeof MEGA_EVOLUTION_INDEX>());

export const MEGA_STONE_ARCHIVE: MegaStoneArchiveEntry[] = Array.from(groupedByItem.entries())
  .map(([itemName, entries]) => {
    const linkedSpecies = Array.from(new Set(entries.map((entry) => entry.baseSpecies))).sort(
      (a, b) => a.localeCompare(b)
    );
    const linkedMegaForms = Array.from(new Set(entries.map((entry) => entry.megaName))).sort(
      (a, b) => a.localeCompare(b)
    );
    const category = buildCategory(itemName);
    const isStone = category !== "special-protocol";
    const dreamStoneFile = isStone ? toDreamStoneFileName(itemName) : null;
    const acquisitionProfile = buildAcquisition(itemName, category);
    const description = buildDescription(itemName, category, linkedSpecies);

    return {
      itemName,
      category,
      isStone,
      imageSrc: isStone
        ? `/images/mega-stones/Dream_${dreamStoneFile}_Sprite.png`
        : "/images/mega-stones/Mega_Evolution_symbol.png",
      imageAlt: isStone
        ? `${itemName} official item icon`
        : "Mega Evolution activation symbol",
      linkedSpecies,
      linkedMegaForms,
      linkedMegaSlugs: Array.from(new Set(entries.map((entry) => entry.slug))).sort((a, b) =>
        a.localeCompare(b)
      ),
      description,
      acquisition: acquisitionProfile.acquisition,
      availabilityNote: acquisitionProfile.availabilityNote,
      searchTokens: [
        itemName,
        category,
        ...linkedSpecies,
        ...linkedMegaForms,
        ...acquisitionProfile.acquisition
      ]
        .join(" ")
        .toLowerCase()
    };
  })
  .sort((a, b) => {
    if (a.isStone !== b.isStone) {
      return a.isStone ? -1 : 1;
    }
    return a.itemName.localeCompare(b.itemName);
  });

const byItemName = new Map(MEGA_STONE_ARCHIVE.map((entry) => [entry.itemName, entry]));

export const MEGA_STONE_OVERVIEW = {
  totalEntries: MEGA_STONE_ARCHIVE.length,
  totalStones: MEGA_STONE_ARCHIVE.filter((entry) => entry.isStone).length,
  specialProtocols: MEGA_STONE_ARCHIVE.filter((entry) => !entry.isStone).length
};

export function getMegaStoneByItem(itemName: string) {
  return byItemName.get(itemName) ?? null;
}
