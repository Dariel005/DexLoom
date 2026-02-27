"use client";

import { create } from "zustand";
import { type PokemonFilters } from "@/types/pokemon";

function createDefaultFilters(): PokemonFilters {
  return {
    query: "",
    id: "",
    type: "all",
    generation: "all",
    minAttack: ""
  };
}

interface PokedexStore {
  selectedPokemonId: number | null;
  filters: PokemonFilters;
  setSelectedPokemon: (id: number | null) => void;
  setFilter: <K extends keyof PokemonFilters>(
    key: K,
    value: PokemonFilters[K]
  ) => void;
  resetFilters: () => void;
}

export const usePokedexStore = create<PokedexStore>((set) => ({
  selectedPokemonId: null,
  filters: createDefaultFilters(),
  setSelectedPokemon: (id) =>
    set((state) =>
      state.selectedPokemonId === id ? state : { selectedPokemonId: id }
    ),
  setFilter: (key, value) =>
    set((state) => {
      if (state.filters[key] === value) {
        return state;
      }

      return {
        filters: {
          ...state.filters,
          [key]: value
        }
      };
    }),
  resetFilters: () => set({ filters: createDefaultFilters() })
}));
