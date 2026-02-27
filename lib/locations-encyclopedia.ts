import { REGION_MAPS } from "@/lib/maps-encyclopedia";
import { type PokemonRegionMapDetail } from "@/types/map";

export interface LocationWikiEntry {
  slug: string;
  name: string;
  regionKey: string;
  regionName: string;
  locationType: "city" | "landmark";
  description: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mapRegionCities(region: PokemonRegionMapDetail): LocationWikiEntry[] {
  return region.keyCities.map((city) => ({
    slug: `${region.key}-${slugify(city.name)}`,
    name: city.name,
    regionKey: region.key,
    regionName: region.name,
    locationType: "city",
    description: city.highlight
  }));
}

function mapRegionLandmarks(region: PokemonRegionMapDetail): LocationWikiEntry[] {
  return region.landmarks.map((landmark) => ({
    slug: `${region.key}-${slugify(landmark.name)}`,
    name: landmark.name,
    regionKey: region.key,
    regionName: region.name,
    locationType: "landmark",
    description: landmark.summary
  }));
}

export const LOCATION_WIKI_INDEX: LocationWikiEntry[] = REGION_MAPS.flatMap((region) => [
  ...mapRegionCities(region),
  ...mapRegionLandmarks(region)
]).sort((a, b) => a.name.localeCompare(b.name));

export function getLocationBySlug(slug: string) {
  return LOCATION_WIKI_INDEX.find((entry) => entry.slug === slug) ?? null;
}

