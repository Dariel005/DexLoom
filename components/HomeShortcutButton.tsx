"use client";

import { usePathname } from "next/navigation";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";

export function HomeShortcutButton() {
  const pathname = usePathname();
  if (!pathname || pathname === "/") {
    return null;
  }

  return (
    <RouteTransitionLink
      href="/"
      aria-label="Back to home page"
      className="pokedex-home-shortcut pixel-font fixed left-2 top-2 z-[80] inline-flex h-5 items-center gap-1 rounded-md border px-1.5 text-[7px] uppercase tracking-[0.08em] sm:text-[8px]"
    >
      <span aria-hidden className="pokedex-home-shortcut-icon">
        {"<"}
      </span>
      <span>Back to Home</span>
    </RouteTransitionLink>
  );
}
