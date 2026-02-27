"use client";

import { usePathname } from "next/navigation";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { TOOL_DEFINITIONS } from "@/lib/tools-directory";
import { cn } from "@/lib/utils";

interface ToolsSectionNavProps {
  className?: string;
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ToolsSectionNav({ className }: ToolsSectionNavProps) {
  const pathname = usePathname();

  return (
    <div className={cn("grid gap-1.5 text-xs", className)}>
      <RouteTransitionLink
        href="/tools"
        className={cn(
          "rounded-md border border-black/20 bg-white/72 px-2 py-1 text-left text-black/74 hover:bg-white",
          pathname === "/tools" && "border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-black/86"
        )}
      >
        Tools hub
      </RouteTransitionLink>
      {TOOL_DEFINITIONS.map((tool) => (
        <RouteTransitionLink
          key={tool.slug}
          href={tool.href}
          className={cn(
            "rounded-md border border-black/20 bg-white/72 px-2 py-1 text-left text-black/74 hover:bg-white",
            isActivePath(pathname, tool.href) &&
              "border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-black/86"
          )}
        >
          {tool.navLabel}
        </RouteTransitionLink>
      ))}
    </div>
  );
}

