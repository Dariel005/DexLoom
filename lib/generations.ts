import { type GenerationKey, type PokemonGeneration } from "@/types/pokemon";

export const GENERATIONS: PokemonGeneration[] = [
  { key: "gen1", label: "Gen 1", region: "Kanto", startId: 1, endId: 151 },
  { key: "gen2", label: "Gen 2", region: "Johto", startId: 152, endId: 251 },
  { key: "gen3", label: "Gen 3", region: "Hoenn", startId: 252, endId: 386 },
  { key: "gen4", label: "Gen 4", region: "Sinnoh", startId: 387, endId: 493 },
  { key: "gen5", label: "Gen 5", region: "Unova", startId: 494, endId: 649 },
  { key: "gen6", label: "Gen 6", region: "Kalos", startId: 650, endId: 721 },
  { key: "gen7", label: "Gen 7", region: "Alola", startId: 722, endId: 809 },
  { key: "gen8", label: "Gen 8", region: "Galar", startId: 810, endId: 905 },
  { key: "gen9", label: "Gen 9", region: "Paldea", startId: 906, endId: 1025 }
];

export const DEFAULT_GENERATION_KEY: GenerationKey = "gen1";

export function getGenerationByKey(key: GenerationKey) {
  return GENERATIONS.find((generation) => generation.key === key) ?? GENERATIONS[0];
}

export function getGenerationByPokemonId(id: number) {
  return (
    GENERATIONS.find((generation) => id >= generation.startId && id <= generation.endId) ??
    GENERATIONS[0]
  );
}
