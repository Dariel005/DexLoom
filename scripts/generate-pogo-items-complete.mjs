import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outputPath = path.join(repoRoot, "data", "pokemon-go-items-complete.json");

const GAME_MASTER_URL =
  "https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json";

const SLUG_OVERRIDES = {
  ITEM_POKE_BALL: "poke-ball",
  ITEM_GREAT_BALL: "great-ball",
  ITEM_ULTRA_BALL: "ultra-ball",
  ITEM_MASTER_BALL: "master-ball",
  ITEM_PREMIER_BALL: "premier-ball",
  ITEM_BEAST_BALL: "beast-ball",
  ITEM_RAZZ_BERRY: "razz-berry",
  ITEM_PINAP_BERRY: "pinap-berry",
  ITEM_GOLDEN_RAZZ_BERRY: "golden-razz-berry",
  ITEM_GOLDEN_PINAP_BERRY: "silver-pinap-berry",
  ITEM_NANAB_BERRY: "nanab-berry",
  ITEM_POTION: "potion",
  ITEM_SUPER_POTION: "super-potion",
  ITEM_HYPER_POTION: "hyper-potion",
  ITEM_MAX_POTION: "max-potion",
  ITEM_REVIVE: "revive",
  ITEM_MAX_REVIVE: "max-revive",
  ITEM_MOVE_REROLL_FAST_ATTACK: "fast-tm",
  ITEM_MOVE_REROLL_SPECIAL_ATTACK: "charged-tm",
  ITEM_MOVE_REROLL_ELITE_FAST_ATTACK: "elite-fast-tm",
  ITEM_MOVE_REROLL_ELITE_SPECIAL_ATTACK: "elite-charged-tm",
  ITEM_GEN4_EVOLUTION_STONE: "sinnoh-stone",
  ITEM_GEN5_EVOLUTION_STONE: "unova-stone",
  ITEM_KINGS_ROCK: "kings-rock",
  ITEM_METAL_COAT: "metal-coat",
  ITEM_DRAGON_SCALE: "dragon-scale",
  ITEM_SUN_STONE: "sun-stone",
  ITEM_UP_GRADE: "up-grade",
  ITEM_FREE_RAID_TICKET: "raid-pass",
  ITEM_PAID_RAID_TICKET: "premium-battle-pass",
  ITEM_REMOTE_RAID_TICKET: "remote-raid-pass",
  ITEM_INCENSE_ORDINARY: "incense",
  ITEM_INCENSE_DAILY_ADVENTURE: "daily-adventure-incense",
  ITEM_INCUBATOR_SUPER: "super-incubator",
  ITEM_INCUBATOR_BASIC: "incubator",
  ITEM_INCUBATOR_BASIC_UNLIMITED: "egg-incubator",
  ITEM_LEADER_MAP: "rocket-radar",
  ITEM_GIOVANNI_MAP: "super-rocket-radar",
  ITEM_LEADER_MAP_FRAGMENT: "mysterious-component",
  ITEM_LUCKY_EGG: "lucky-egg",
  ITEM_STAR_PIECE: "star-piece",
  ITEM_POFFIN: "poffin",
  ITEM_RARE_CANDY: "rare-candy",
  ITEM_XL_RARE_CANDY: "rare-candy-xl",
  ITEM_TROY_DISK_MOSSY: "mossy-lure-module",
  ITEM_TROY_DISK_GLACIAL: "glacial-lure-module",
  ITEM_TROY_DISK_MAGNETIC: "magnetic-lure-module",
  ITEM_TROY_DISK_RAINY: "rainy-lure-module",
  ITEM_TROY_DISK_SPARKLY: "golden-lure-module",
  ITEM_ITEM_STORAGE_UPGRADE: "item-bag-upgrade",
  ITEM_POKEMON_STORAGE_UPGRADE: "pokemon-storage-upgrade",
  ITEM_POSTCARD_STORAGE_UPGRADE: "postcard-book",
  ITEM_TEAM_CHANGE: "team-medallion",
  ITEM_FRIEND_GIFT_BOX: "gift",
  ITEM_STICKER_INVENTORY: "sticker",
  ITEM_INCENSE_BELUGA_BOX: "coin-bag",
  ITEM_CANDY: "xl-candy",
  ITEM_POSTCARD_INVENTORY: "postcard-book-inventory",
  ITEM_BATTLE_PASS_TICKET: "go-pass-ticket",
  ITEM_EVENT_PASS_POINT_GO_FEST_01: "go-fest-pass-point-01",
  ITEM_EVENT_PASS_POINT_GO_FEST_02: "go-fest-pass-point-02",
  ITEM_EVENT_PASS_POINT_GO_TOUR_01: "go-tour-pass-point-01",
  ITEM_EVENT_PASS_POINT_GO_TOUR_02: "go-tour-pass-point-02",
  ITEM_EVENT_PASS_POINT_GO_WILD_AREA_01: "go-wild-area-pass-point-01",
  ITEM_TICKET_CITY_SAFARI_00: "city-safari-ticket-00",
  ITEM_TICKET_CITY_SAFARI_01: "city-safari-ticket-01",
  ITEM_TICKET_CITY_SAFARI_02: "city-safari-ticket-02",
  ITEM_TICKET_CITY_SAFARI_04: "city-safari-ticket-04",
  ITEM_EVENT_TICKET_GRAY: "event-ticket-gray",
  ITEM_EVENT_TICKET_PINK: "event-ticket-pink",
  ITEM_GLOBAL_EVENT_TICKET: "global-event-ticket",
  ITEM_EVERGREEN_TICKET: "evergreen-ticket",
  ITEM_SPECIAL_CAMERA: "special-camera",
  ITEM_MP: "max-particle",
  ITEM_MP_REPLENISH: "max-particle-pack",
  ITEM_ROUTE_MAKER: "route-maker-kit",
  ITEM_SHADOW_GEM_FRAGMENT: "shadow-shard",
  ITEM_SHADOW_GEM: "shadow-gem",
  ITEM_RESOURCE_CROWNED_ZACIAN: "crowned-zacian-resource",
  ITEM_RESOURCE_CROWNED_ZAMAZENTA: "crowned-zamazenta-resource",
  FUSION_RESOURCE_BLACK_KYUREM: "black-kyurem-fusion-energy",
  FUSION_RESOURCE_WHITE_KYUREM: "white-kyurem-fusion-energy",
  FUSION_RESOURCE_DUSKMANE_NECROZMA: "duskmane-necrozma-fusion-energy",
  FUSION_RESOURCE_DAWNWINGS_NECROZMA: "dawnwings-necrozma-fusion-energy"
};

const NAME_OVERRIDES = {
  ITEM_MOVE_REROLL_FAST_ATTACK: "Fast TM",
  ITEM_MOVE_REROLL_SPECIAL_ATTACK: "Charged TM",
  ITEM_MOVE_REROLL_ELITE_FAST_ATTACK: "Elite Fast TM",
  ITEM_MOVE_REROLL_ELITE_SPECIAL_ATTACK: "Elite Charged TM",
  ITEM_MOVE_REROLL_OTHER_SPECIAL_ATTACK_A: "Legacy Charged TM A",
  ITEM_GEN4_EVOLUTION_STONE: "Sinnoh Stone",
  ITEM_GEN5_EVOLUTION_STONE: "Unova Stone",
  ITEM_FREE_RAID_TICKET: "Raid Pass",
  ITEM_PAID_RAID_TICKET: "Premium Battle Pass",
  ITEM_REMOTE_RAID_TICKET: "Remote Raid Pass",
  ITEM_LEADER_MAP: "Rocket Radar",
  ITEM_GIOVANNI_MAP: "Super Rocket Radar",
  ITEM_LEADER_MAP_FRAGMENT: "Mysterious Component",
  ITEM_INCUBATOR_BASIC_UNLIMITED: "Egg Incubator",
  ITEM_INCENSE_ORDINARY: "Incense",
  ITEM_INCENSE_DAILY_ADVENTURE: "Daily Adventure Incense",
  ITEM_INCENSE_BELUGA_BOX: "Coin Bag",
  ITEM_FRIEND_GIFT_BOX: "Gift",
  ITEM_STICKER_INVENTORY: "Sticker Inventory",
  ITEM_ITEM_STORAGE_UPGRADE: "Item Bag Upgrade",
  ITEM_POKEMON_STORAGE_UPGRADE: "Pokemon Storage Upgrade",
  ITEM_POSTCARD_STORAGE_UPGRADE: "Postcard Storage Upgrade",
  ITEM_POSTCARD_INVENTORY: "Postcard Book",
  ITEM_TROY_DISK: "Lure Module",
  ITEM_TROY_DISK_MOSSY: "Mossy Lure Module",
  ITEM_TROY_DISK_GLACIAL: "Glacial Lure Module",
  ITEM_TROY_DISK_MAGNETIC: "Magnetic Lure Module",
  ITEM_TROY_DISK_RAINY: "Rainy Lure Module",
  ITEM_TROY_DISK_SPARKLY: "Golden Lure Module",
  ITEM_XL_RARE_CANDY: "Rare Candy XL",
  ITEM_MP: "Max Particle",
  ITEM_MP_REPLENISH: "Max Particle Pack",
  ITEM_SPECIAL_CAMERA: "AR Camera",
  ITEM_TEAM_CHANGE: "Team Medallion",
  ITEM_BATTLE_PASS_TICKET: "GO Pass Ticket",
  ITEM_EVENT_TICKET_GRAY: "Event Ticket (Gray)",
  ITEM_EVENT_TICKET_PINK: "Event Ticket (Pink)",
  ITEM_GLOBAL_EVENT_TICKET: "Global Event Ticket",
  ITEM_GLOBAL_EVENT_TICKET_TO_GIFT: "Global Event Ticket (Gift)",
  ITEM_EVERGREEN_TICKET: "Evergreen Ticket",
  ITEM_EVERGREEN_TICKET_TO_GIFT: "Evergreen Ticket (Gift)",
  ITEM_SHADOW_GEM: "Purified Gem",
  ITEM_SHADOW_GEM_FRAGMENT: "Shadow Shard",
  FUSION_RESOURCE_BLACK_KYUREM: "Black Kyurem Fusion Energy",
  FUSION_RESOURCE_WHITE_KYUREM: "White Kyurem Fusion Energy",
  FUSION_RESOURCE_DUSKMANE_NECROZMA: "Dusk Mane Fusion Energy",
  FUSION_RESOURCE_DAWNWINGS_NECROZMA: "Dawn Wings Fusion Energy",
  ITEM_RESOURCE_CROWNED_ZACIAN: "Crowned Zacian Energy",
  ITEM_RESOURCE_CROWNED_ZAMAZENTA: "Crowned Zamazenta Energy"
};

const CATEGORY_MAP = {
  ITEM_CATEGORY_POKEBALL: ["balls", "Capture Balls"],
  ITEM_CATEGORY_FOOD: ["berries", "Berries"],
  ITEM_CATEGORY_MEDICINE: ["healing", "Healing"],
  ITEM_CATEGORY_MOVE_REROLL: ["battle", "Battle Tech"],
  ITEM_CATEGORY_EVOLUTION_REQUIREMENT: ["evolution", "Evolution Items"],
  ITEM_CATEGORY_RAID_TICKET: ["raid", "Raid Passes"],
  ITEM_CATEGORY_INCENSE: ["spawn", "Spawn Tools"],
  ITEM_CATEGORY_DISK: ["spawn", "Spawn Tools"],
  ITEM_CATEGORY_INCUBATOR: ["incubator", "Eggs"],
  ITEM_CATEGORY_BOOST: ["boost", "Boosters"],
  ITEM_CATEGORY_XP_BOOST: ["boost", "Boosters"],
  ITEM_CATEGORY_STARDUST_BOOST: ["boost", "Boosters"],
  ITEM_CATEGORY_BUDDY_EXCLUSIVE_FOOD: ["boost", "Boosters"],
  ITEM_CATEGORY_BREAD: ["boost", "Boosters"],
  ITEM_CATEGORY_CANDY: ["special", "Special Access"],
  ITEM_CATEGORY_INVENTORY_UPGRADE: ["special", "Special Access"],
  ITEM_CATEGORY_TEAM_CHANGE: ["special", "Special Access"],
  ITEM_CATEGORY_GLOBAL_EVENT_TICKET: ["special", "Special Access"],
  ITEM_CATEGORY_EVENT_PASS_POINT: ["special", "Special Access"],
  ITEM_CATEGORY_INCIDENT_TICKET: ["special", "Special Access"],
  ITEM_CATEGORY_MP: ["special", "Special Access"],
  ITEM_CATEGORY_POSTCARD_INVENTORY: ["utility", "Utility"],
  ITEM_CATEGORY_STICKER: ["utility", "Utility"],
  ITEM_CATEGORY_FRIEND_GIFT_BOX: ["utility", "Utility"],
  ITEM_CATEGORY_CAMERA: ["utility", "Utility"],
  ITEM_CATEGORY_UTILITES: ["utility", "Utility"],
  ITEM_CATEGORY_ROUTE_MAKER: ["utility", "Utility"],
  "30": ["special", "Special Access"]
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function capitalizeToken(token) {
  const upper = token.toUpperCase();
  if (upper === "TM" || upper === "XP" || upper === "XL" || upper === "GO" || upper === "AR") {
    return upper;
  }
  if (/^\d+$/.test(token)) {
    return token;
  }
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

function prettifyTemplateName(templateId) {
  const base = templateId
    .replace(/^ITEM_/, "")
    .replace(/^FUSION_RESOURCE_/, "")
    .replace(/^RESOURCE_/, "")
    .replace(/_TO_GIFT$/, " GIFT");

  const tokens = base.split("_").filter(Boolean);
  return tokens.map(capitalizeToken).join(" ");
}

function resolveSlug(templateId, itemId) {
  if (SLUG_OVERRIDES[templateId]) {
    return SLUG_OVERRIDES[templateId];
  }
  const base = templateId || `ITEM_${itemId}`;
  return slugify(base.replace(/^ITEM_/, "").replace(/^FUSION_RESOURCE_/, "fusion-resource-"));
}

function resolveName(templateId, itemId) {
  if (NAME_OVERRIDES[templateId]) {
    return NAME_OVERRIDES[templateId];
  }
  return prettifyTemplateName(templateId || `ITEM_${itemId}`);
}

function resolveCategory(templateId, itemSettings) {
  if (templateId === "ITEM_POFFIN") {
    return ["boost", "Boosters"];
  }
  if (templateId === "ITEM_STICKER_INVENTORY") {
    return ["utility", "Utility"];
  }
  const mapped = CATEGORY_MAP[itemSettings.category];
  if (mapped) {
    return mapped;
  }
  return ["special", "Special Access"];
}

function inferRarity(templateId, itemSettings, category) {
  if (
    /MASTER|ELITE|FUSION_RESOURCE|GLOBAL_EVENT|EVENT_TICKET|CITY_SAFARI|WILD_BALL|BEAST_BALL|XL/i.test(
      templateId
    )
  ) {
    return "Epic";
  }
  if (
    /PREMIUM|REMOTE|RAID|SUPER|GOLDEN|POFFIN|LUCKY|STAR|TROY|SHADOW|STORAGE|TEAM_CHANGE|MP|DISK/i.test(
      templateId
    )
  ) {
    return "Rare";
  }
  if (
    /GREAT|HYPER|REVIVE|GEN4|GEN5|STONE|UP_GRADE|KINGS|METAL|DRAGON|MOVE_REROLL|INCUBATOR/i.test(
      templateId
    ) ||
    category === "battle" ||
    category === "evolution"
  ) {
    return "Uncommon";
  }
  return "Common";
}

function inferAvailability(templateId, itemSettings) {
  if (/EVENT_TICKET|EVENT_PASS_POINT|CITY_SAFARI|GO_FEST|GO_TOUR|GO_WILD_AREA|INCIDENT/i.test(templateId)) {
    return "Event";
  }
  if (
    /PAID|PREMIUM|REMOTE|TEAM_CHANGE|STORAGE_UPGRADE|BATTLE_PASS|POFFIN|INCUBATOR_SUPER|INCUBATOR_TIMED/.test(
      templateId
    )
  ) {
    return "Premium";
  }
  if (/FREE|BASIC_UNLIMITED|DAILY_ADVENTURE/.test(templateId)) {
    return "Free";
  }
  if (itemSettings.globalEventTicket) {
    return "Event";
  }
  return "Both";
}

function inferDescription(name, categoryLabel, templateId) {
  if (/TO_GIFT$/.test(templateId)) {
    return `Gift-form variant of ${name.replace(/\s*\(Gift\)$/i, "")} for trainer gifting flows.`;
  }
  return `${name} is a Pokemon GO ${categoryLabel.toLowerCase()} resource.`;
}

function inferEffect(itemSettings, category, templateId) {
  if (itemSettings.eggIncubator) {
    const uses = itemSettings.eggIncubator.uses;
    const multiplier = itemSettings.eggIncubator.distanceMultiplier ?? 1;
    const useText = Number.isFinite(uses) ? `${uses} uses` : "unlimited use";
    return `Hatches Eggs with distance multiplier x${multiplier} (${useText}).`;
  }
  if (itemSettings.food) {
    return "Applies berry-style effects for catching, buddies, or gym motivation.";
  }
  if (itemSettings.globalEventTicket) {
    return "Unlocks premium timed event content and event-specific rewards.";
  }
  if (itemSettings.eventPassPoint) {
    return "Tracks progression points for live pass systems.";
  }
  if (category === "balls") {
    return "Used during encounter capture phases.";
  }
  if (category === "healing") {
    return "Restores HP and/or revives fainted Pokemon.";
  }
  if (category === "battle") {
    return "Supports move optimization or battle state advantages.";
  }
  if (category === "raid") {
    return "Grants raid entry access under specific conditions.";
  }
  if (category === "spawn") {
    return "Increases, modifies, or targets wild encounter generation.";
  }
  if (category === "incubator") {
    return "Supports egg hatching progress through walking distance.";
  }
  if (category === "boost") {
    return "Temporarily increases XP, Stardust, or companion progression value.";
  }
  if (category === "utility") {
    return "Provides utility or meta-system support in Pokemon GO.";
  }
  return "Used in progression, events, or account-level systems.";
}

function inferStackCap(itemSettings) {
  if (itemSettings.ignoreInventorySpace) {
    return "Not stored in bag";
  }
  if (typeof itemSettings.itemCap === "number") {
    return String(itemSettings.itemCap);
  }
  return "Inventory based";
}

function inferConsumable(templateId, itemSettings) {
  if (/BASIC_UNLIMITED|POSTCARD_INVENTORY/.test(templateId)) {
    return false;
  }
  if (itemSettings.inventoryUpgrade || itemSettings.postcardInventory) {
    return false;
  }
  return true;
}

function inferAcquisition(category, availability) {
  if (availability === "Event") {
    return ["Limited-time events", "Timed research", "Event passes"];
  }
  if (availability === "Premium") {
    return ["Shop", "Premium bundles", "Paid tracks"];
  }
  if (availability === "Free") {
    return ["Daily rewards", "Core gameplay systems"];
  }

  if (category === "balls" || category === "berries" || category === "healing") {
    return ["Pokestops", "Gyms", "Gifts", "Research"];
  }
  if (category === "raid") {
    return ["Daily raid systems", "Shop bundles", "Research"];
  }
  if (category === "incubator") {
    return ["Shop", "Research", "Event rewards"];
  }
  if (category === "spawn" || category === "boost") {
    return ["Shop", "Research", "Event rewards"];
  }
  return ["Research", "Special systems", "Events"];
}

function inferUseCases(category) {
  if (category === "balls") {
    return ["Capture pipelines", "Rare encounter securing"];
  }
  if (category === "berries") {
    return ["Catch reliability", "Candy optimization"];
  }
  if (category === "healing") {
    return ["Raid sustain", "Rocket battle loops"];
  }
  if (category === "battle") {
    return ["Move tuning", "Meta adaptation"];
  }
  if (category === "evolution") {
    return ["Dex progression", "Evolution requirements"];
  }
  if (category === "raid") {
    return ["Daily raids", "High-value boss windows"];
  }
  if (category === "spawn") {
    return ["Spawn optimization", "Event catch sessions"];
  }
  if (category === "incubator") {
    return ["Egg projects", "Distance efficiency routes"];
  }
  if (category === "boost") {
    return ["XP/dust timing", "Value-stacking sessions"];
  }
  if (category === "utility") {
    return ["System progression", "Support loops"];
  }
  return ["Strategic progression", "Resource planning"];
}

function inferRelatedSystems(category, templateId) {
  const systems = [];
  if (category === "balls" || category === "berries") {
    systems.push("Catch flow");
  }
  if (category === "healing" || category === "raid") {
    systems.push("Raid loop");
  }
  if (category === "battle") {
    systems.push("PvP tuning");
  }
  if (category === "incubator") {
    systems.push("Egg hatching");
  }
  if (category === "spawn") {
    systems.push("Wild spawns");
  }
  if (category === "boost") {
    systems.push("XP/Stardust economy");
  }
  if (/ROCKET|SHADOW|GIOVANNI|LEADER/.test(templateId)) {
    systems.push("Team GO Rocket");
  }
  if (/EVENT|TICKET|PASS_POINT/.test(templateId)) {
    systems.push("Live events");
  }
  if (systems.length === 0) {
    systems.push("Core progression");
  }
  return systems;
}

function inferPvpRelevance(category, templateId) {
  if (category === "battle" || /XL|CANDY|MOVE_REROLL|ELITE/.test(templateId)) {
    return "High indirect value for competitive build quality.";
  }
  if (category === "healing" || category === "raid") {
    return "No direct battle-league use; supports preparation loops.";
  }
  return "Indirect value depending on progression goals.";
}

function inferRaidRelevance(category, templateId) {
  if (category === "raid" || /RAID|REVIVE|POTION|BOOST|MEGA|FUSION/.test(templateId)) {
    return "High relevance for raid readiness and sustained boss cycles.";
  }
  if (category === "balls") {
    return "Contextual relevance for event/raid capture phases.";
  }
  return "Indirect relevance through resource planning.";
}

function inferNotes(templateId, itemSettings) {
  const notes = [];
  if (itemSettings.ignoreInventorySpace) {
    notes.push("This item may bypass standard bag capacity.");
  }
  if (/TO_GIFT$/.test(templateId)) {
    notes.push("Gift-form variant used for trainer gifting flows.");
  }
  if (/EVENT|TICKET|PASS_POINT/.test(templateId)) {
    notes.push("Availability and rewards can change by live event schedule.");
  }
  if (notes.length === 0) {
    notes.push("Behavior may change slightly by season, event, or balancing update.");
  }
  return notes;
}

function buildSearchTags(name, slug, templateId, itemSettings, categoryLabel) {
  const tagSet = new Set([
    slug,
    name.toLowerCase(),
    String(itemSettings.itemId).toLowerCase(),
    templateId.toLowerCase(),
    categoryLabel.toLowerCase()
  ]);

  for (const token of slug.split("-")) {
    if (token) {
      tagSet.add(token);
    }
  }

  return Array.from(tagSet);
}

async function main() {
  const response = await fetch(GAME_MASTER_URL, {
    headers: {
      "User-Agent": "pokedex-wiki-pro-item-generator"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch Game Master (${response.status})`);
  }

  const gameMaster = await response.json();
  const itemEntries = (gameMaster ?? [])
    .filter((entry) => entry?.data?.itemSettings)
    .map((entry) => ({
      templateId: String(entry.templateId ?? ""),
      itemSettings: entry.data.itemSettings
    }))
    .sort((a, b) => a.templateId.localeCompare(b.templateId));

  const items = itemEntries.map(({ templateId, itemSettings }, index) => {
    const slug = resolveSlug(templateId, itemSettings.itemId);
    const name = resolveName(templateId, itemSettings.itemId);
    const [category, categoryLabel] = resolveCategory(templateId, itemSettings);
    const rarity = inferRarity(templateId, itemSettings, category);
    const availability = inferAvailability(templateId, itemSettings);

    return {
      id: 1000 + index + 1,
      slug,
      name,
      category,
      categoryLabel,
      rarity,
      availability,
      description: inferDescription(name, categoryLabel, templateId),
      inGameEffect: inferEffect(itemSettings, category, templateId),
      stackCap: inferStackCap(itemSettings),
      consumable: inferConsumable(templateId, itemSettings),
      acquisition: inferAcquisition(category, availability),
      bestUseCases: inferUseCases(category),
      relatedSystems: inferRelatedSystems(category, templateId),
      pvpRelevance: inferPvpRelevance(category, templateId),
      raidRelevance: inferRaidRelevance(category, templateId),
      notes: inferNotes(templateId, itemSettings),
      searchTags: buildSearchTags(name, slug, templateId, itemSettings, categoryLabel)
    };
  });

  await writeFile(outputPath, `${JSON.stringify(items, null, 2)}\n`, "utf8");
  console.log(
    `Generated ${items.length} Pokemon GO items from Game Master into ${path.relative(repoRoot, outputPath)}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
