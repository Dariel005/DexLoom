"use client";

import { AnimatePresence, m } from "framer-motion";
import { useCallback, useState, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { useSoundStore } from "@/store/sound-store";
import { useShallow } from "zustand/react/shallow";

interface SoundControlPanelProps {
  className?: string;
  defaultExpanded?: boolean;
}

export function SoundControlPanel({
  className,
  defaultExpanded = false
}: SoundControlPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const {
    soundEnabled,
    soundVolume,
    toggleSoundEnabled,
    setSoundVolume,
    increaseSoundVolume,
    decreaseSoundVolume
  } = useSoundStore(
    useShallow((state) => ({
      soundEnabled: state.enabled,
      soundVolume: state.volume,
      toggleSoundEnabled: state.toggleEnabled,
      setSoundVolume: state.setVolume,
      increaseSoundVolume: state.increaseVolume,
      decreaseSoundVolume: state.decreaseVolume
    }))
  );

  const soundVolumePercent = Math.round(soundVolume * 100);

  const handleVolumeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSoundVolume(Number(event.target.value) / 100);
    },
    [setSoundVolume]
  );

  return (
    <m.aside
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className={cn(
        "rounded-2xl border border-black/25 bg-white/75 p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.14)] backdrop-blur-md",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-black/20 bg-white/65 px-2.5 py-1.5 text-left"
      >
        <div>
          <p className="pixel-font text-[9px] uppercase tracking-[0.16em] text-black/75">
            Audio Control
          </p>
          <p className="mt-0.5 text-[11px] text-black/60">
            {soundEnabled ? `On - ${soundVolumePercent}%` : "Off"}
          </p>
        </div>
        <span className="text-xs text-black/70">{isOpen ? "Hide" : "Show"}</span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <m.div
            key="sound-controls"
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <m.button
                  type="button"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={decreaseSoundVolume}
                  disabled={!soundEnabled || soundVolume <= 0}
                  className="pixel-font rounded-lg border border-black/25 bg-white px-2.5 py-1 text-[9px] uppercase tracking-wide disabled:opacity-45"
                >
                  Lower
                </m.button>
                <m.button
                  type="button"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={increaseSoundVolume}
                  disabled={!soundEnabled || soundVolume >= 1}
                  className="pixel-font rounded-lg border border-black/25 bg-white px-2.5 py-1 text-[9px] uppercase tracking-wide disabled:opacity-45"
                >
                  Raise
                </m.button>
              </div>

              <m.button
                type="button"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.97 }}
                onClick={toggleSoundEnabled}
                className="pixel-font w-full rounded-lg border border-black/25 bg-electric-yellow px-2.5 py-1.5 text-[9px] uppercase tracking-wide"
              >
                {soundEnabled ? "Disable sound" : "Enable sound"}
              </m.button>

              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] text-black/70">
                  <span>Volume</span>
                  <span>{soundVolumePercent}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={soundVolumePercent}
                  onChange={handleVolumeChange}
                  disabled={!soundEnabled}
                  className="w-full accent-pokedex-red disabled:opacity-45"
                  aria-label="Sound volume"
                />
              </div>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </m.aside>
  );
}

