"use client";

import { m } from "framer-motion";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useUiTone } from "@/hooks/useUiTone";
import { GENERATIONS } from "@/lib/generations";
import { cn } from "@/lib/utils";
import { type GenerationKey } from "@/types/pokemon";

interface RegionFilterBarProps {
  activeGeneration: GenerationKey;
  onChange: (generation: GenerationKey) => void;
}

const REGION_CARD_PALETTE: Record<
  GenerationKey,
  { accent: string; tint: string }
> = {
  gen1: { accent: "#67b95f", tint: "#e0f2dc" },
  gen2: { accent: "#c89a35", tint: "#f2e8d1" },
  gen3: { accent: "#369f63", tint: "#d8eee2" },
  gen4: { accent: "#7d6dc7", tint: "#e5e1f1" },
  gen5: { accent: "#707b88", tint: "#e1e5ea" },
  gen6: { accent: "#3f7fd6", tint: "#dce7f7" },
  gen7: { accent: "#d07036", tint: "#f3e3d8" },
  gen8: { accent: "#2a8ca4", tint: "#d8e9ee" },
  gen9: { accent: "#ad5b96", tint: "#efdfeb" }
};

export const RegionFilterBar = memo(function RegionFilterBar({
  activeGeneration,
  onChange
}: RegionFilterBarProps) {
  const playUiTone = useUiTone();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const generationButtonRefs = useRef<
    Partial<Record<GenerationKey, HTMLButtonElement | null>>
  >({});

  const active = useMemo(
    () => GENERATIONS.find((generation) => generation.key === activeGeneration) ?? GENERATIONS[0],
    [activeGeneration]
  );

  const activePalette = useMemo(
    () => REGION_CARD_PALETTE[activeGeneration] ?? REGION_CARD_PALETTE.gen1,
    [activeGeneration]
  );

  const progress = useMemo(() => {
    const clamped = Number.isFinite(scrollProgress) ? scrollProgress : 0;
    return Math.max(0, Math.min(100, clamped));
  }, [scrollProgress]);

  const handleSelectGeneration = useCallback(
    (generation: GenerationKey) => {
      playUiTone(generation === activeGeneration ? "switch" : "select");
      onChange(generation);
    },
    [activeGeneration, onChange, playUiTone]
  );

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      const dominantDelta =
        Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

      if (dominantDelta === 0) {
        return;
      }

      // Keep wheel interaction locked to the region lane, preventing page scroll.
      event.preventDefault();
      event.stopPropagation();

      node.scrollBy({
        left: dominantDelta * 0.9,
        behavior: "auto"
      });
    };

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      node.removeEventListener("wheel", onWheel);
    };
  }, []);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) {
      return;
    }

    const syncProgress = () => {
      const maxScroll = node.scrollWidth - node.clientWidth;
      if (maxScroll <= 0) {
        const index = Math.max(
          0,
          GENERATIONS.findIndex((generation) => generation.key === activeGeneration)
        );
        const denominator = Math.max(1, GENERATIONS.length - 1);
        setScrollProgress((index / denominator) * 100);
        return;
      }
      setScrollProgress((node.scrollLeft / maxScroll) * 100);
    };

    syncProgress();
    node.addEventListener("scroll", syncProgress, { passive: true });
    window.addEventListener("resize", syncProgress);

    return () => {
      node.removeEventListener("scroll", syncProgress);
      window.removeEventListener("resize", syncProgress);
    };
  }, [activeGeneration]);

  useEffect(() => {
    const activeButton = generationButtonRefs.current[activeGeneration];
    activeButton?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center"
    });
  }, [activeGeneration]);

  return (
    <div className="region-control-shell rounded-2xl p-2">
      <div className="region-control-head rounded-xl px-2.5 py-1.5 text-left">
        <div className="region-control-head-row flex w-full items-center justify-between gap-2">
          <p className="region-control-title pixel-font text-[8px] uppercase tracking-[0.18em] text-black/70">
            Region Control
          </p>
          <span className="region-control-status pixel-font rounded-md px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] text-black/65">
            ACTIVE
          </span>
        </div>
        <p className="region-control-subtitle mt-0.5 text-[11px] text-black/65">
          {active.label} - {active.region} (#{active.startId}-{active.endId})
        </p>
      </div>

      <div className="region-lane mt-2">
        <div className="region-scroll-track">
          <div className="region-fade-left" aria-hidden />
          <div className="region-fade-right" aria-hidden />
          <div
            ref={scrollerRef}
            style={
              {
                "--region-active-accent": activePalette.accent
              } as CSSProperties
            }
            className="region-scroll-modern flex gap-1.5 overflow-x-auto overflow-y-hidden pb-1 pt-0.5"
          >
            {GENERATIONS.map((generation, index) => {
              const isActive = generation.key === activeGeneration;
              const palette = REGION_CARD_PALETTE[generation.key] ?? REGION_CARD_PALETTE.gen1;
              const cardStyle = {
                "--region-accent": palette.accent,
                "--region-tint": palette.tint
              } as CSSProperties;

              return (
                <m.button
                  key={generation.key}
                  type="button"
                  ref={(node) => {
                    generationButtonRefs.current[generation.key] = node;
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.025 }}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleSelectGeneration(generation.key)}
                  style={cardStyle}
                  className={cn(
                    "region-gen-card relative min-w-[128px] snap-start overflow-hidden rounded-xl border px-3 py-1.5 text-left transition",
                    isActive
                      ? "region-gen-card-active text-black/80"
                      : "region-gen-card-idle text-black/75"
                  )}
                >
                  {isActive ? (
                    <m.span
                      layoutId="active-generation-highlight"
                      className="region-gen-active-fill pointer-events-none absolute inset-0"
                      transition={{ type: "spring", stiffness: 280, damping: 30 }}
                    />
                  ) : null}
                  <p className="region-gen-label pixel-font relative z-10 inline-flex items-center gap-1 text-[8px] uppercase tracking-wide">
                    <span className="region-gen-mini-icon" aria-hidden />
                    {generation.label}
                  </p>
                  <p className="region-gen-name relative z-10 mt-0.5 text-[11px]">{generation.region}</p>
                  <p className="region-gen-range relative z-10 mt-0.5 text-[10px] text-black/55">
                    #{generation.startId}-{generation.endId}
                  </p>
                </m.button>
              );
            })}
          </div>
        </div>
        <span className="sr-only" aria-live="polite">
          Region list scroller
        </span>
      </div>

      <div className="region-control-footer mt-1.5">
        <p className="region-control-hint text-[10px] text-black/55">Swipe or scroll to browse regions</p>
      </div>

      <div
        className="region-scroll-progress mt-1.5"
        aria-hidden
      >
        <m.span
          className="region-scroll-progress-fill"
          style={
            {
              "--region-active-accent": activePalette.accent
            } as CSSProperties
          }
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 24 }}
        />
        <m.span
          className="region-scroll-progress-thumb"
          initial={false}
          animate={{ left: `${Math.max(2, Math.min(98, progress))}%` }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
        />
      </div>
    </div>
  );
});
