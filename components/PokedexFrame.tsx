"use client";

import { m, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { PokedexHeaderAccess } from "@/components/PokedexHeaderAccess";
import { LedIndicator, type LedStatus } from "@/components/LedIndicator";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { cn } from "@/lib/utils";

type FrameVariant = "pokedex" | "wiki";

interface PokedexFrameProps {
  leftPanel: ReactNode;
  rightPanel?: ReactNode;
  title?: string;
  status?: LedStatus;
  variant?: FrameVariant;
  rightPanelSticky?: boolean;
  className?: string;
}

export function PokedexFrame({
  leftPanel,
  rightPanel,
  title = "DexLoom",
  status = "idle",
  variant = "pokedex",
  rightPanelSticky = false,
  className,
}: PokedexFrameProps) {
  const prefersReducedMotion = useReducedMotion();
  const pathname = usePathname();
  const hasRightPanel = rightPanel !== undefined && rightPanel !== null;
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
        initial={
          prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.992 }
        }
        animate={
          prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }
        }
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
        }
      >
        <div className="relative z-10 space-y-[clamp(0.85rem,1.15vw,1.25rem)]">
          <header className="wiki-interactive-header px-[clamp(0.75rem,1vw,1rem)] py-[clamp(0.55rem,0.8vw,0.85rem)]">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
              <div className="min-w-0 flex items-center gap-2.5">
                <LedIndicator
                  status={status}
                  className="h-3 w-3 border-black/30"
                />
                <span className="pokedex-led h-2.5 w-2.5 bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.62)]" />
                <span className="pokedex-led h-2.5 w-2.5 bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.58)]" />
                {homeShortcut}
              </div>
              <div className="pixel-font justify-self-center text-[11px] uppercase tracking-wide text-black/82">
                {title}
              </div>
              <div className="min-w-0 justify-self-end">
                <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
                  <PokedexHeaderAccess />
                </div>
              </div>
            </div>
          </header>

          <div
            className={cn(
              "grid gap-[clamp(0.85rem,1.1vw,1.25rem)]",
              hasRightPanel && "lg:grid-cols-[1.04fr_0.96fr]",
            )}
          >
            <div className="wiki-interactive-panel wiki-interactive-panel-primary min-h-[var(--layout-panel-min-h)] p-[clamp(0.7rem,0.95vw,1.25rem)]">
              <div className="h-full">{leftPanel}</div>
            </div>

            {hasRightPanel ? (
              <div className="wiki-interactive-panel wiki-interactive-panel-secondary min-h-[var(--layout-panel-min-h)] p-[clamp(0.7rem,0.95vw,1.25rem)]">
                <div className="h-full">{rightPanel}</div>
              </div>
            ) : null}
          </div>
        </div>
      </m.section>
    );
  }

  return (
    <m.section
      className={cn(
        "route-transition-surface pokedex-shell mx-auto w-full max-w-[var(--layout-max-width)] p-[var(--layout-pad-fluid)]",
        rightPanelSticky && "pokedex-shell-right-sticky",
        className,
      )}
      initial={
        prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.992 }
      }
      animate={
        prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }
      }
      transition={
        prefersReducedMotion
          ? undefined
          : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
      }
    >
      <div className="relative z-10 space-y-[clamp(1rem,1.2vw,1.5rem)]">
        <header className="rounded-2xl border border-black/20 bg-black/10 px-[clamp(0.75rem,1vw,1rem)] py-[clamp(0.55rem,0.8vw,0.85rem)]">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
            <div className="min-w-0 flex items-center gap-3">
              <LedIndicator
                status={status}
                className="h-4 w-4 border-black/35"
              />
              <span className="pokedex-led pokedex-led-signal pokedex-led-delay-1 h-2.5 w-2.5 bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.64)]" />
              <span className="pokedex-led pokedex-led-signal pokedex-led-delay-2 h-2.5 w-2.5 bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.58)]" />
              {homeShortcut}
            </div>
            <div className="pixel-font justify-self-center text-xs uppercase tracking-wide text-white/90">
              {title}
            </div>
            <div className="min-w-0 justify-self-end">
              <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
                <PokedexHeaderAccess tone="dark" />
              </div>
            </div>
          </div>
        </header>

        <div
          className={cn(
            "grid gap-[clamp(1rem,1.25vw,1.5rem)]",
            hasRightPanel && "lg:grid-cols-[1.06fr_0.94fr]",
          )}
        >
          <div className="retro-screen min-h-[var(--layout-panel-min-h)] p-[clamp(0.7rem,0.95vw,1.25rem)]">
            <div className="relative z-10 h-full">{leftPanel}</div>
            <div className="scan-overlay" />
          </div>

          {hasRightPanel ? (
            <div
              className={cn(
                "metal-plate min-h-[var(--layout-panel-min-h)] rounded-[clamp(1rem,1.3vw,1.25rem)] p-[clamp(0.7rem,0.95vw,1.25rem)]",
                rightPanelSticky &&
                  "xl:sticky xl:top-4 xl:h-[calc(100vh-2.5rem)] xl:min-h-0 xl:overflow-hidden",
              )}
            >
              <div
                className={cn(
                  "h-full",
                  rightPanelSticky && "xl:overflow-y-auto xl:pr-1",
                )}
              >
                {rightPanel}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </m.section>
  );
}
