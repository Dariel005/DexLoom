"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const MIN_VOLUME = 0;
const MAX_VOLUME = 1;
const VOLUME_STEP = 0.1;

function clampVolume(value: number) {
  return Math.min(MAX_VOLUME, Math.max(MIN_VOLUME, value));
}

interface SoundStore {
  enabled: boolean;
  volume: number;
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  setVolume: (volume: number) => void;
  increaseVolume: () => void;
  decreaseVolume: () => void;
}

export const useSoundStore = create<SoundStore>()(
  persist(
    (set) => ({
      enabled: true,
      volume: 0.65,
      setEnabled: (enabled) => set({ enabled }),
      toggleEnabled: () =>
        set((state) => ({
          enabled: !state.enabled
        })),
      setVolume: (volume) =>
        set({
          volume: clampVolume(volume)
        }),
      increaseVolume: () =>
        set((state) => ({
          volume: clampVolume(state.volume + VOLUME_STEP)
        })),
      decreaseVolume: () =>
        set((state) => ({
          volume: clampVolume(state.volume - VOLUME_STEP)
        }))
    }),
    {
      name: "pokedex.sound.settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        enabled: state.enabled,
        volume: state.volume
      })
    }
  )
);
