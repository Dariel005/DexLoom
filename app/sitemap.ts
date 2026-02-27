import { type MetadataRoute } from "next";
import { CHARACTER_WIKI_INDEX } from "@/lib/characters-encyclopedia";
import { LOCATION_WIKI_INDEX } from "@/lib/locations-encyclopedia";
import { MEGA_EVOLUTION_INDEX } from "@/lib/mega-evolutions-encyclopedia";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://pokedex-wiki-pro.vercel.app";
  const maxPokemonId = 1025;

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: `${baseUrl}/items`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.86
    },
    {
      url: `${baseUrl}/tools/filters`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.82
    },
    {
      url: `${baseUrl}/tools/comparator`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.82
    },
    {
      url: `${baseUrl}/tools/team-builder`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.82
    },
    {
      url: `${baseUrl}/tools/move-planner`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.82
    },
    {
      url: `${baseUrl}/tools/audio`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8
    },
    {
      url: `${baseUrl}/moves`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8
    },
    {
      url: `${baseUrl}/abilities`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8
    },
    {
      url: `${baseUrl}/types`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8
    },
    {
      url: `${baseUrl}/maps`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8
    },
    {
      url: `${baseUrl}/games`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8
    },
    {
      url: `${baseUrl}/rom-hacks`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.78
    },
    {
      url: `${baseUrl}/cards`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8
    },
    {
      url: `${baseUrl}/pokemon-go`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8
    },
    {
      url: `${baseUrl}/mechanics`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.78
    },
    {
      url: `${baseUrl}/mega-evolutions`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.78
    },
    {
      url: `${baseUrl}/mega-evolutions/stones`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.76
    },
    {
      url: `${baseUrl}/characters`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.78
    },
    {
      url: `${baseUrl}/sources`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7
    },
    {
      url: `${baseUrl}/credits`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65
    },
    ...LOCATION_WIKI_INDEX.map((location) => ({
      url: `${baseUrl}/locations/${location.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.68
    })),
    ...CHARACTER_WIKI_INDEX.map((character) => ({
      url: `${baseUrl}/characters/${character.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.68
    })),
    ...MEGA_EVOLUTION_INDEX.map((entry) => ({
      url: `${baseUrl}/mega-evolutions/${entry.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7
    })),
    ...Array.from({ length: maxPokemonId }, (_, index) => ({
      url: `${baseUrl}/pokemon/${index + 1}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  ];
}
