import iconManifest from "@/data/pokemon-go-item-icons.json";
import { type PokemonGoItem, type PokemonGoItemCategory } from "@/types/pokemon-go";

const LOCAL_ITEM_ICON_BASE = "/assets/pokemon-go/items";

const categoryFallback = iconManifest.categoryFallback as Record<PokemonGoItemCategory, string>;
const slugMap = iconManifest.slugMap as Record<string, string>;
const knownItemIconSlugs = new Set(Object.keys(slugMap));

export function getPokemonGoItemIconPath(item: Pick<PokemonGoItem, "slug" | "category">) {
  if (knownItemIconSlugs.has(item.slug)) {
    return `${LOCAL_ITEM_ICON_BASE}/${item.slug}.png`;
  }
  return `${LOCAL_ITEM_ICON_BASE}/category-${item.category}.png`;
}

export function getPokemonGoItemIconManifest() {
  return {
    sourceBasePath: iconManifest.sourceBasePath,
    categoryFallback,
    slugMap
  };
}
