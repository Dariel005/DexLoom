"use client";

import { usePathname, useRouter } from "next/navigation";
import { type CSSProperties, useCallback, useEffect } from "react";
import { MegaEvolutionNavLabel } from "@/components/MegaEvolutionNavLabel";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { prewarmRouteModules } from "@/lib/route-prewarm";
import { cn } from "@/lib/utils";

interface SectionModuleNavProps {
  className?: string;
}

const MODULE_LINKS: Array<{ label: string; href: string }> = [
  { label: "Tools", href: "/tools" },
  { label: "Items", href: "/items" },
  { label: "Moves", href: "/moves" },
  { label: "Abilities", href: "/abilities" },
  { label: "Types", href: "/types" },
  { label: "Cards", href: "/cards" },
  { label: "Maps", href: "/maps" },
  { label: "Games", href: "/games" },
  { label: "ROM Hacks", href: "/rom-hacks" },
  { label: "Pokemon GO", href: "/pokemon-go" },
  { label: "Mechanics", href: "/mechanics" },
  { label: "Mega Evolutions", href: "/mega-evolutions" },
  { label: "Characters", href: "/characters" },
  { label: "Profile", href: "/profile/me" },
  { label: "Sources", href: "/sources" }
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SectionModuleNav({ className }: SectionModuleNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const warmRoute = useCallback(
    (href: string) => {
      const normalizedHref = href.split("#")[0].split("?")[0];
      if (!normalizedHref) {
        return;
      }

      router.prefetch(normalizedHref);
      void prewarmRouteModules(normalizedHref);
    },
    [router]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const warmHeavyRoutes = () => {
      warmRoute("/mega-evolutions");
      warmRoute("/characters");
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(() => warmHeavyRoutes(), { timeout: 1200 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(warmHeavyRoutes, 420);
    return () => window.clearTimeout(timeoutId);
  }, [warmRoute]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-black/20 bg-white/35 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <RouteTransitionLink
          href="/"
          onMouseEnter={() => warmRoute("/")}
          onFocus={() => warmRoute("/")}
          onTouchStart={() => warmRoute("/")}
          style={{ "--pulse-delay": "0s" } as CSSProperties}
          className={cn(
            "explorer-nav-btn pixel-font rounded-lg border px-2.5 py-2 text-[10px] uppercase tracking-[0.14em] transition sm:min-w-[118px]",
            isActivePath(pathname, "/")
              ? "explorer-nav-btn-active border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-black/85 pokedex-accent-glow"
              : "border-black/20 bg-white/65 text-black/70 hover:bg-white/85"
          )}
        >
          Back to Pokedex
        </RouteTransitionLink>

        {MODULE_LINKS.map((entry, index) => (
          <RouteTransitionLink
            key={entry.href}
            href={entry.href}
            onMouseEnter={() => warmRoute(entry.href)}
            onFocus={() => warmRoute(entry.href)}
            onTouchStart={() => warmRoute(entry.href)}
            style={{ "--pulse-delay": `${(index + 1) * 0.15}s` } as CSSProperties}
            className={cn(
              "explorer-nav-btn pixel-font rounded-lg border px-2.5 py-2 text-[10px] uppercase tracking-[0.14em] transition",
              entry.label === "Pokemon GO"
                ? "sm:min-w-[104px]"
                : entry.label === "ROM Hacks"
                  ? "rom-hacks-nav-btn rom-hacks-nav-btn-highlight sm:min-w-[122px]"
                : entry.label === "Mega Evolutions"
                  ? "mega-nav-btn mega-nav-btn-highlight text-[11px] tracking-[0.16em] sm:min-w-[160px]"
                  : "sm:min-w-[88px]",
              isActivePath(pathname, entry.href)
                ? "explorer-nav-btn-active border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-black/85 pokedex-accent-glow"
                : "border-black/20 bg-white/65 text-black/70 hover:bg-white/85"
            )}
          >
            {entry.label === "Mega Evolutions" ? (
              <>
                <span className="mega-nav-beacon" aria-hidden />
                <MegaEvolutionNavLabel />
              </>
            ) : entry.label === "ROM Hacks" ? (
              <>
                <span className="rom-hacks-nav-core" aria-hidden />
                <span>ROM Hacks</span>
              </>
            ) : (
              entry.label
            )}
          </RouteTransitionLink>
        ))}
      </div>
    </div>
  );
}
