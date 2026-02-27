"use client";

import { useCallback, useEffect, useRef } from "react";
import { type UiToneKey, useUiTone } from "@/hooks/useUiTone";

interface MechanicsSectionNavTopic {
  slug: string;
  title: string;
}

interface MechanicsSectionNavProps {
  topics: MechanicsSectionNavTopic[];
}

const TOP_OFFSET_PX = 118;
const HIGHLIGHT_CLASS = "mechanics-section-jump-highlight";
const HIGHLIGHT_DURATION_MS = 1300;

export function MechanicsSectionNav({ topics }: MechanicsSectionNavProps) {
  const playUiTone = useUiTone();
  const highlightedSectionRef = useRef<HTMLElement | null>(null);
  const highlightDelayTimerRef = useRef<number | null>(null);
  const highlightCleanupTimerRef = useRef<number | null>(null);

  const clearHighlight = useCallback(() => {
    if (highlightDelayTimerRef.current !== null) {
      window.clearTimeout(highlightDelayTimerRef.current);
      highlightDelayTimerRef.current = null;
    }
    if (highlightCleanupTimerRef.current !== null) {
      window.clearTimeout(highlightCleanupTimerRef.current);
      highlightCleanupTimerRef.current = null;
    }
    if (highlightedSectionRef.current) {
      highlightedSectionRef.current.classList.remove(HIGHLIGHT_CLASS);
      highlightedSectionRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearHighlight();
    };
  }, [clearHighlight]);

  const triggerHighlight = useCallback(
    (target: HTMLElement, delayMs: number) => {
      const applyHighlight = () => {
        highlightedSectionRef.current = target;
        target.classList.remove(HIGHLIGHT_CLASS);
        // Restart the animation if the same section is selected repeatedly.
        void target.offsetWidth;
        target.classList.add(HIGHLIGHT_CLASS);

        highlightCleanupTimerRef.current = window.setTimeout(() => {
          target.classList.remove(HIGHLIGHT_CLASS);
          if (highlightedSectionRef.current === target) {
            highlightedSectionRef.current = null;
          }
          highlightCleanupTimerRef.current = null;
        }, HIGHLIGHT_DURATION_MS);
      };

      clearHighlight();
      if (delayMs <= 0) {
        applyHighlight();
        return;
      }

      highlightDelayTimerRef.current = window.setTimeout(() => {
        highlightDelayTimerRef.current = null;
        applyHighlight();
      }, delayMs);
    },
    [clearHighlight]
  );

  const scrollToSection = useCallback(
    (sectionId: string, tone: UiToneKey = "select") => {
      const target = document.getElementById(sectionId);
      if (!target) {
        return;
      }

      playUiTone(tone);

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const fromTop = window.scrollY;
      const destinationTop = Math.max(
        0,
        target.getBoundingClientRect().top + fromTop - TOP_OFFSET_PX
      );

      window.scrollTo({
        top: destinationTop,
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });

      const travelDistance = Math.abs(destinationTop - fromTop);
      const highlightDelay = prefersReducedMotion
        ? 0
        : Math.min(780, Math.max(180, Math.round(travelDistance * 0.35)));

      triggerHighlight(target, highlightDelay);
    },
    [playUiTone, triggerHighlight]
  );

  const scrollToTop = useCallback(() => {
    scrollToSection("mechanics-top", "switch");
  }, [scrollToSection]);

  return (
    <div className="mt-2 grid gap-1.5 text-xs">
      <button
        type="button"
        onClick={scrollToTop}
        className="rounded-md border border-black/20 bg-white/72 px-2 py-1 text-left text-black/74 hover:bg-white"
      >
        Back to top
      </button>
      <button
        type="button"
        onClick={() => scrollToSection("hud-evolution", "select")}
        className="rounded-md border border-black/20 bg-white/72 px-2 py-1 text-left text-black/74 hover:bg-white"
      >
        HUD evolution gallery
      </button>
      {topics.map((topic) => (
        <button
          key={`nav-${topic.slug}`}
          type="button"
          onClick={() => scrollToSection(topic.slug, "select")}
          className="rounded-md border border-black/20 bg-white/72 px-2 py-1 text-left text-black/74 hover:bg-white"
        >
          {topic.title}
        </button>
      ))}
      <button
        type="button"
        onClick={() => scrollToSection("battle-flow", "select")}
        className="rounded-md border border-black/20 bg-white/72 px-2 py-1 text-left text-black/74 hover:bg-white"
      >
        Battle flow matrix
      </button>
      <button
        type="button"
        onClick={() => scrollToSection("generation-power-systems", "select")}
        className="rounded-md border border-black/20 bg-white/72 px-2 py-1 text-left text-black/74 hover:bg-white"
      >
        Generation power systems
      </button>
      <button
        type="button"
        onClick={() => scrollToSection("build-recipes", "select")}
        className="rounded-md border border-black/20 bg-white/72 px-2 py-1 text-left text-black/74 hover:bg-white"
      >
        Build recipes
      </button>
    </div>
  );
}
