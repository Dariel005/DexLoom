"use client";

import { m, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { type CSSProperties, type ReactNode } from "react";
import { PokedexHeaderAccess } from "@/components/PokedexHeaderAccess";
import { LedIndicator, type LedStatus } from "@/components/LedIndicator";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { cn } from "@/lib/utils";

type ChassisVariant = "pokedex" | "wiki";

interface PokedexChassisProps {
  title?: string;
  status?: LedStatus;
  explorerScreen: ReactNode;
  detailScreen: ReactNode;
  detailSticky?: boolean;
  detailScrollable?: boolean;
  leftEdgeControls?: ReactNode;
  rightEdgeControls?: ReactNode;
  themeStyle?: CSSProperties;
  variant?: ChassisVariant;
  className?: string;
}

export function PokedexChassis({
  title = "Pokedex Wiki",
  status = "success",
  explorerScreen,
  detailScreen,
  detailSticky = true,
  detailScrollable = true,
  leftEdgeControls,
  rightEdgeControls,
  themeStyle,
  variant = "pokedex",
  className,
}: PokedexChassisProps) {
  const prefersReducedMotion = useReducedMotion();
  const pathname = usePathname();
  const showHomeShortcut = pathname !== "/";
  const homeShortcut = showHomeShortcut ? (
    <RouteTransitionLink
      href="/"
      aria-label="Back to home page"
      className="pokedex-home-shortcut pixel-font inline-flex h-5 shrink-0 items-center gap-1 rounded-md border px-1.5 text-[7px] uppercase tracking-[0.08em] sm:text-[8px]"
    >
      <span aria-hidden className="pokedex-home-shortcut-icon">
        {"<"}
      </span>
      <span>Back to Home</span>
    </RouteTransitionLink>
  ) : null;

  if (variant === "wiki") {
    return (
      <m.section
        className={cn(
          "route-transition-surface wiki-interactive-shell mx-auto w-full max-w-[var(--layout-max-width)] p-[var(--layout-pad-fluid)]",
          className,
        )}
        style={themeStyle}
        initial={
          prefersReducedMotion ? false : { opacity: 0, y: 16, scale: 0.992 }
        }
        animate={
          prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }
        }
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
        }
      >
        <div className="relative z-10 space-y-[clamp(0.85rem,1.15vw,1.25rem)]">
          <header className="wiki-interactive-header rounded-2xl px-[clamp(0.75rem,1vw,1rem)] py-[clamp(0.55rem,0.8vw,0.85rem)]">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
              <div className="min-w-0 flex items-center gap-2.5">
                <LedIndicator
                  status={status}
                  className="h-4 w-4 border-black/30"
                />
                <span className="pokedex-led h-2.5 w-2.5 bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.62)]" />
                <span className="pokedex-led h-2.5 w-2.5 bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.58)]" />
                <span className="pokedex-led h-2.5 w-2.5 bg-red-300 shadow-[0_0_8px_rgba(252,165,165,0.58)]" />
                {homeShortcut}
              </div>
              <p className="pixel-font justify-self-center text-[10px] uppercase tracking-[0.18em] text-black/82">
                {title}
              </p>
              <div className="min-w-0 justify-self-end">
                <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
                  <PokedexHeaderAccess />
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-[clamp(0.85rem,1.1vw,1.25rem)] xl:grid-cols-2 xl:items-start">
            <div className="wiki-interactive-panel wiki-interactive-panel-primary min-h-[var(--layout-panel-min-h)] p-[clamp(0.7rem,0.9vw,1rem)]">
              {explorerScreen}
            </div>
            <div
              className={cn(
                "wiki-interactive-panel wiki-interactive-panel-secondary min-h-[var(--layout-panel-min-h)] p-[clamp(0.7rem,0.9vw,1rem)]",
                detailSticky &&
                  (detailScrollable
                    ? "xl:sticky xl:top-4 xl:h-[calc(100vh-2.5rem)] xl:min-h-0 xl:overflow-hidden"
                    : "xl:sticky xl:top-4"),
              )}
            >
              <div
                className={cn(
                  detailSticky && detailScrollable
                    ? "h-full xl:overflow-y-auto xl:pr-1"
                    : "h-auto",
                )}
              >
                {detailScreen}
              </div>
            </div>
          </div>
        </div>
      </m.section>
    );
  }

  return (
    <m.section
      className={cn(
        "route-transition-surface pokedex-chassis mx-auto w-full max-w-[var(--layout-max-width)] p-[var(--layout-pad-fluid)]",
        className,
      )}
      style={themeStyle}
      initial={
        prefersReducedMotion ? false : { opacity: 0, y: 16, scale: 0.992 }
      }
      animate={
        prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }
      }
      transition={
        prefersReducedMotion
          ? undefined
          : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {leftEdgeControls ? (
        <div className="pointer-events-none absolute left-[-26px] top-1/2 z-20 hidden -translate-y-1/2 lg:block">
          <div className="pointer-events-auto">{leftEdgeControls}</div>
        </div>
      ) : null}
      {rightEdgeControls ? (
        <div className="pointer-events-none absolute right-[-26px] top-1/2 z-20 hidden -translate-y-1/2 lg:block">
          <div className="pointer-events-auto">{rightEdgeControls}</div>
        </div>
      ) : null}

      <div className="pokedex-bevel relative z-10 space-y-[clamp(0.85rem,1.1vw,1.25rem)] rounded-[clamp(1.4rem,2vw,2rem)] p-[clamp(0.65rem,0.9vw,1rem)]">
        <header className="rounded-2xl border border-black/25 bg-black/15 px-[clamp(0.75rem,1vw,1rem)] py-[clamp(0.55rem,0.8vw,0.85rem)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
            <div className="min-w-0 flex items-center gap-2.5">
              <LedIndicator
                status={status}
                className="h-5 w-5 border-black/35"
              />
              <span className="pokedex-led pokedex-led-signal pokedex-led-delay-1 h-2.5 w-2.5 bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.64)]" />
              <span className="pokedex-led pokedex-led-signal pokedex-led-delay-2 h-2.5 w-2.5 bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.58)]" />
              <span className="pokedex-led pokedex-led-signal pokedex-led-delay-3 h-2.5 w-2.5 bg-red-300 shadow-[0_0_8px_rgba(252,165,165,0.58)]" />
              {homeShortcut}
            </div>
            <p className="pixel-font justify-self-center text-[10px] uppercase tracking-[0.18em]">
              {title}
            </p>
            <div className="min-w-0 justify-self-end">
              <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
                <PokedexHeaderAccess tone="dark" />
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-[clamp(0.85rem,1.1vw,1.25rem)] xl:[grid-template-columns:minmax(0,1.16fr)_minmax(0,0.84fr)] xl:items-start">
          <div className="pokedex-screen-a relative min-h-[var(--layout-panel-min-h)] overflow-hidden rounded-[clamp(1.1rem,1.45vw,1.4rem)] border border-black/35 p-[clamp(0.7rem,0.9vw,1rem)]">
            <div className="crt-lines pointer-events-none absolute inset-0 opacity-28" />
            <div className="relative z-10">
              <div className="metal-plate mb-3 flex items-center justify-between rounded-xl px-3 py-2">
                <p className="pixel-font text-[9px] uppercase tracking-[0.16em] text-black/65">
                  Explorer Console A
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="pokedex-led pokedex-led-signal pokedex-led-delay-1 h-2.5 w-2.5 border-black/20 bg-white/70" />
                  <span className="pokedex-led pokedex-led-signal pokedex-led-delay-2 h-2.5 w-2.5 border-black/20 bg-white/70" />
                </div>
              </div>
              {explorerScreen}
            </div>
          </div>
          <div
            className={cn(
              "pokedex-screen-b min-h-[var(--layout-panel-min-h)] rounded-[clamp(1.1rem,1.45vw,1.4rem)] border border-black/35 p-[clamp(0.7rem,0.9vw,1rem)]",
              detailSticky &&
                (detailScrollable
                  ? "xl:sticky xl:top-4 xl:h-[calc(100vh-2.5rem)] xl:min-h-0 xl:overflow-hidden"
                  : "xl:sticky xl:top-4"),
            )}
          >
            <div
              className={cn(
                detailSticky && detailScrollable
                  ? "h-full xl:overflow-y-auto xl:pr-1"
                  : "h-auto",
              )}
            >
              {detailScreen}
            </div>
          </div>
        </div>
      </div>
    </m.section>
  );
}
