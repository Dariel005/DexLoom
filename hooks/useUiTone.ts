"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSoundStore } from "@/store/sound-store";

export type UiToneKey = "select" | "switch" | "scroll";

const UI_TONE_CONFIG: Record<
  UiToneKey,
  { type: OscillatorType; startFrequency: number; endFrequency: number; duration: number; gain: number }
> = {
  select: {
    type: "triangle",
    startFrequency: 740,
    endFrequency: 520,
    duration: 0.092,
    gain: 0.054
  },
  switch: {
    type: "square",
    startFrequency: 620,
    endFrequency: 440,
    duration: 0.108,
    gain: 0.05
  },
  scroll: {
    type: "sine",
    startFrequency: 420,
    endFrequency: 340,
    duration: 0.07,
    gain: 0.038
  }
};

export function useUiTone() {
  const soundEnabled = useSoundStore((state) => state.enabled);
  const soundVolume = useSoundStore((state) => state.volume);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const playUiTone = useCallback(
    (tone: UiToneKey = "select") => {
      if (
        !soundEnabled ||
        soundVolume <= 0 ||
        typeof window === "undefined" ||
        typeof window.AudioContext === "undefined"
      ) {
        return;
      }

      const config = UI_TONE_CONFIG[tone];
      const audioContext = audioContextRef.current ?? new window.AudioContext();
      audioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        void audioContext.resume();
      }

      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const peakGain = Math.max(config.gain * soundVolume, 0.0001);

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.startFrequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(config.endFrequency, 1),
        now + config.duration
      );

      gainNode.gain.setValueAtTime(peakGain, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + config.duration + 0.014);
    },
    [soundEnabled, soundVolume]
  );

  return playUiTone;
}

