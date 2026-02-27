"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { useSoundStore } from "@/store/sound-store";

interface CryButtonProps {
  cryUrl: string | null;
  pokemonName: string;
  autoPlayOnLoad?: boolean;
}

export function CryButton({
  cryUrl,
  pokemonName,
  autoPlayOnLoad = true
}: CryButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundVolumeRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayBlocked, setAutoPlayBlocked] = useState(false);
  const soundEnabled = useSoundStore((state) => state.enabled);
  const soundVolume = useSoundStore((state) => state.volume);

  useEffect(() => {
    soundVolumeRef.current = soundVolume;
  }, [soundVolume]);

  useEffect(() => {
    if (!cryUrl) {
      audioRef.current = null;
      return;
    }

    const audio = new Audio(cryUrl);
    audio.preload = "auto";
    audio.volume = soundEnabled ? soundVolumeRef.current : 0;
    audioRef.current = audio;

    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", onEnded);

    if (autoPlayOnLoad && soundEnabled) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setAutoPlayBlocked(true));
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.removeEventListener("ended", onEnded);
    };
  }, [autoPlayOnLoad, cryUrl, soundEnabled]);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.volume = soundEnabled ? soundVolume : 0;
    if (!soundEnabled) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setAutoPlayBlocked(false);
    }
  }, [soundEnabled, soundVolume]);

  const playCry = async () => {
    if (!audioRef.current || !soundEnabled) {
      return;
    }

    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setIsPlaying(true);
      setAutoPlayBlocked(false);
    } catch {
      setAutoPlayBlocked(true);
      setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-2">
      <m.button
        type="button"
        whileHover={{ y: -1.5, scale: 1.01 }}
        whileTap={{ scale: 0.96 }}
        className="pixel-font inline-flex items-center rounded-xl border border-black/35 bg-electric-yellow px-4 py-2 text-[10px] uppercase tracking-wide text-black disabled:cursor-not-allowed disabled:opacity-60"
        onClick={playCry}
        disabled={!cryUrl || !soundEnabled}
      >
        {!soundEnabled
          ? "Sound disabled"
          : isPlaying
            ? "Playing cry..."
            : `Play ${pokemonName} cry`}
      </m.button>
      {!cryUrl ? (
        <p className="text-xs text-black/60">No official cry is available for this Pokemon.</p>
      ) : null}
      {!soundEnabled ? (
        <p className="text-xs text-black/60">
          Sound is disabled. Activate it from the Audio Module.
        </p>
      ) : null}
      {autoPlayBlocked ? (
        <p className="text-xs text-black/60">
          Autoplay was blocked by the browser. Use the button to play audio.
        </p>
      ) : null}
    </div>
  );
}

