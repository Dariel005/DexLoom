"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { TypeBadge } from "@/components/TypeBadge";
import { usePokemonDetailQuery } from "@/hooks/usePokemonDetailQuery";
import { useSoundStore } from "@/store/sound-store";

interface PokemonDrawerProps {
  selectedPokemonId: number | null;
  onClose: () => void;
}

function getFallbackSprite(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

function getStatBarWidth(value: number) {
  const normalized = Math.min((value / 130) * 100, 100);
  return `${Math.max(7, normalized)}%`;
}

function PokemonDrawerComponent({ selectedPokemonId, onClose }: PokemonDrawerProps) {
  const { data, isLoading, isError } = usePokemonDetailQuery(selectedPokemonId);
  const soundEnabled = useSoundStore((state) => state.enabled);
  const soundVolume = useSoundStore((state) => state.volume);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const [isCryPlaying, setIsCryPlaying] = useState(false);

  useEffect(() => {
    if (!data?.cryUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsCryPlaying(false);
      return;
    }

    const audio = new Audio(data.cryUrl);
    audio.preload = "auto";
    audio.volume = soundEnabled ? soundVolume : 0;
    const onEnded = () => setIsCryPlaying(false);
    audio.addEventListener("ended", onEnded);
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.removeEventListener("ended", onEnded);
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };
  }, [data?.cryUrl, soundEnabled, soundVolume]);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.volume = soundEnabled ? soundVolume : 0;
    if (!soundEnabled) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsCryPlaying(false);
    }
  }, [soundEnabled, soundVolume]);

  useEffect(() => {
    if (!selectedPokemonId || !contentScrollRef.current) {
      return;
    }

    contentScrollRef.current.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }, [selectedPokemonId]);

  const handlePlayCry = useCallback(async () => {
    if (!audioRef.current || !soundEnabled) {
      return;
    }

    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setIsCryPlaying(true);
    } catch {
      setIsCryPlaying(false);
    }
  }, [soundEnabled]);

  return (
    <AnimatePresence mode="wait">
      {selectedPokemonId ? (
        <m.aside
          key={selectedPokemonId}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: [0, -2, 2, 0] }}
          exit={{ opacity: 0, x: 18 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="pokemon-drawer-shell flex h-full min-h-0 flex-col rounded-[1.2rem] border p-2.5"
        >
          <div className="metal-plate mb-2 flex items-center justify-between rounded-xl border border-black/15 px-3 py-1.5">
            <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/72">
              Data Terminal
            </p>
            <span className="pokemon-drawer-status-led h-2.5 w-2.5 rounded-full" />
          </div>

          <div ref={contentScrollRef} className="pokemon-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="space-y-2 rounded-xl border border-black/15 bg-white/80 p-3">
                <div className="h-4 w-2/3 animate-pulse rounded bg-black/10" />
                <div className="h-28 animate-pulse rounded-2xl bg-black/10" />
                <div className="h-4 w-full animate-pulse rounded bg-black/10" />
                <div className="h-24 animate-pulse rounded-2xl bg-black/10" />
              </div>
            ) : null}

            {isError ? (
              <p className="rounded-xl border border-red-400/40 bg-red-50 px-3 py-2 text-sm text-red-700">
                Failed to load this Pokemon.
              </p>
            ) : null}

            {data ? (
              <div className="space-y-2">
                <section className="rounded-xl border border-black/15 bg-white/84 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <div className="pokemon-drawer-header flex items-start justify-between gap-2">
                    <div className="pokemon-drawer-header-copy">
                      <h2 className="pixel-font text-[13px] uppercase tracking-[0.12em] text-black/84">
                        {data.name}
                      </h2>
                      <p className="mt-0.5 text-[11px] text-black/58">
                        Dex #{data.id.toString().padStart(4, "0")} | {data.generation}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="pokemon-drawer-close rounded-lg border border-black/20 bg-white/82 px-2.5 py-1 text-[11px] text-black/65 transition hover:bg-white"
                    >
                      Close
                    </button>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {data.types.map((type) => (
                      <TypeBadge key={`${data.id}-${type}`} type={type} />
                    ))}
                  </div>

                  <div className="pokemon-drawer-art-stage relative mx-auto mt-2 h-[240px] w-full max-w-[340px] sm:h-[270px] sm:max-w-[380px]">
                    <Image
                      src={data.sprites.officialArtwork ?? data.sprites.home ?? getFallbackSprite(data.id)}
                      alt={data.name}
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 340px, 380px"
                      className="pokemon-drawer-artwork object-contain drop-shadow-[0_9px_16px_rgba(0,0,0,0.28)]"
                    />
                  </div>
                </section>

                <section className="pokemon-drawer-stats-panel rounded-xl border p-2.5">
                  <p className="pixel-font text-[11px] uppercase tracking-[0.12em] text-black/74">
                    Base Stats
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {data.stats.map((stat) => (
                      <li key={stat.name}>
                        <div className="mb-1 flex items-center justify-between text-[11px] text-black/74">
                          <span className="pixel-font uppercase tracking-[0.1em]">{stat.name}</span>
                          <span>{stat.baseStat}</span>
                        </div>
                        <div className="pokemon-drawer-stat-track h-2 rounded-full border">
                          <div
                            className="pokemon-drawer-stat-fill h-full rounded-full"
                            style={{ width: getStatBarWidth(stat.baseStat) }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-xl border border-black/15 bg-white/84 p-2.5">
                  <p className="pixel-font text-[11px] uppercase tracking-[0.12em] text-black/74">
                    Evolution Chain
                  </p>
                  {data.evolutionChain.stages.length > 0 ? (
                    <div className="pokemon-drawer-evolution-scroll pokemon-scrollbar mt-2 overflow-x-auto pb-2">
                      <ol className="pokemon-drawer-evolution-list flex w-max items-center gap-3 pt-1">
                        {data.evolutionChain.stages.map((stage, index) => (
                          <li key={`${stage.id}-${index}`} className="pokemon-drawer-evolution-stage flex items-center gap-3">
                            <Link
                              href={`/pokemon/${stage.id}`}
                              className="pokemon-drawer-evolution-link group flex shrink-0 flex-col items-center rounded-xl border px-2 py-1.5 transition"
                            >
                              <span className="relative flex h-20 w-20 shrink-0 items-center justify-center sm:h-24 sm:w-24">
                                <Image
                                  src={stage.sprite ?? getFallbackSprite(stage.id)}
                                  alt={stage.name}
                                  fill
                                  loading="lazy"
                                  sizes="(max-width: 640px) 80px, 96px"
                                  className="object-contain"
                                />
                              </span>
                              <span className="pixel-font mt-1 text-[8px] uppercase tracking-[0.08em] text-black/68 transition group-hover:text-black/84">
                                {stage.name}
                              </span>
                            </Link>
                            {index < data.evolutionChain.stages.length - 1 ? (
                              <span className="pokemon-drawer-evolution-arrow pixel-font -mt-2 px-0.5 text-[20px] leading-none text-black/40">
                                {"->"}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-black/58">No evolution data available.</p>
                  )}
                </section>

                <section className="rounded-xl border border-black/15 bg-white/84 p-2.5">
                  <p className="pixel-font text-[11px] uppercase tracking-[0.12em] text-black/74">
                    Abilities
                  </p>
                  <div className="mt-2 space-y-2">
                    {data.abilities.map((ability) => (
                      <article key={`${data.id}-${ability.name}-${ability.slot}`}>
                        <p className="pixel-font text-[10px] uppercase tracking-[0.1em] text-black/84">
                          {ability.name}
                          {ability.isHidden ? " (Hidden)" : ""}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-black/68">
                          {ability.shortEffect ?? ability.effect ?? "No ability description available."}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>

                <div className="grid grid-cols-1 gap-2 pb-1 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      void handlePlayCry();
                    }}
                    disabled={!data.cryUrl || !soundEnabled}
                    className="pokemon-drawer-cry-btn pixel-font rounded-lg border px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {isCryPlaying ? "Playing..." : "Play Cry"}
                  </button>
                  <RouteTransitionLink
                    href={`/pokemon/${data.id}`}
                    className="pokemon-drawer-entry-btn pixel-font rounded-lg border px-3 py-2 text-center text-[10px] uppercase tracking-[0.1em] text-white transition hover:brightness-110"
                  >
                    Open Full Entry
                  </RouteTransitionLink>
                </div>
              </div>
            ) : null}
          </div>
        </m.aside>
      ) : (
        <m.div
          key="drawer-empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex h-full items-center justify-center rounded-2xl border border-dashed border-black/30 bg-white/35 p-4"
        >
          <p className="pixel-font text-center text-[10px] uppercase tracking-[0.16em] text-black/60">
            Select a Pokemon card to open screen B
          </p>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export const PokemonDrawer = memo(PokemonDrawerComponent);
