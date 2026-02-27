"use client";

import { create } from "zustand";
import { type CompareFocus } from "@/lib/pokedex-pro-tools";

const MAX_TEAM_SIZE = 6;

interface ToolsWorkbenchStore {
  compareAId: number | null;
  compareBId: number | null;
  compareFocus: CompareFocus;
  teamCandidateId: number | null;
  teamIds: number[];
  plannerPokemonId: number | null;
  plannerQuery: string;
  plannerMethodFilter: string;
  setCompareAId: (id: number | null) => void;
  setCompareBId: (id: number | null) => void;
  setCompareFocus: (focus: CompareFocus) => void;
  setTeamCandidateId: (id: number | null) => void;
  addTeamMember: (id: number) => void;
  removeTeamMember: (id: number) => void;
  clearTeam: () => void;
  setPlannerPokemonId: (id: number | null) => void;
  setPlannerQuery: (query: string) => void;
  setPlannerMethodFilter: (filter: string) => void;
}

export const useToolsWorkbenchStore = create<ToolsWorkbenchStore>((set) => ({
  compareAId: null,
  compareBId: null,
  compareFocus: "general",
  teamCandidateId: null,
  teamIds: [],
  plannerPokemonId: null,
  plannerQuery: "",
  plannerMethodFilter: "all",
  setCompareAId: (id) =>
    set((state) => (state.compareAId === id ? state : { compareAId: id })),
  setCompareBId: (id) =>
    set((state) => (state.compareBId === id ? state : { compareBId: id })),
  setCompareFocus: (focus) =>
    set((state) =>
      state.compareFocus === focus ? state : { compareFocus: focus }
    ),
  setTeamCandidateId: (id) =>
    set((state) =>
      state.teamCandidateId === id ? state : { teamCandidateId: id }
    ),
  addTeamMember: (id) =>
    set((state) => {
      if (state.teamIds.includes(id) || state.teamIds.length >= MAX_TEAM_SIZE) {
        return state;
      }
      return {
        teamIds: [...state.teamIds, id]
      };
    }),
  removeTeamMember: (id) =>
    set((state) => ({
      teamIds: state.teamIds.filter((entry) => entry !== id)
    })),
  clearTeam: () => set({ teamIds: [] }),
  setPlannerPokemonId: (id) =>
    set((state) =>
      state.plannerPokemonId === id ? state : { plannerPokemonId: id }
    ),
  setPlannerQuery: (query) =>
    set((state) =>
      state.plannerQuery === query ? state : { plannerQuery: query }
    ),
  setPlannerMethodFilter: (filter) =>
    set((state) =>
      state.plannerMethodFilter === filter
        ? state
        : { plannerMethodFilter: filter }
    )
}));

