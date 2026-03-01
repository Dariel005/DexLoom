import { type ReactNode } from "react";
import { MobileDexBottomNav } from "@/components/MobileDexBottomNav";
import { PokedexFrame } from "@/components/PokedexFrame";
import { cn } from "@/lib/utils";

interface ToolsHeroChip {
  label: string;
  tone?: "neutral" | "green" | "amber" | "sky" | "violet" | "rose";
}

interface ToolsPageShellProps {
  frameTitle: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroChips?: ToolsHeroChip[];
  leftContent: ReactNode;
  rightContent: ReactNode;
  schema?: Record<string, unknown>;
  heroVariant?: "default" | "compact";
}

function chipToneClass(tone: ToolsHeroChip["tone"]) {
  if (tone === "green") {
    return "border-emerald-300/85 bg-emerald-100/72 text-emerald-900";
  }
  if (tone === "amber") {
    return "border-amber-300/85 bg-amber-100/72 text-amber-900";
  }
  if (tone === "sky") {
    return "border-sky-300/85 bg-sky-100/72 text-sky-900";
  }
  if (tone === "violet") {
    return "border-violet-300/85 bg-violet-100/72 text-violet-900";
  }
  if (tone === "rose") {
    return "border-rose-300/85 bg-rose-100/72 text-rose-900";
  }
  return "border-black/20 bg-white/70 text-black/72";
}

export function ToolsPageShell({
  frameTitle,
  heroEyebrow,
  heroTitle,
  heroDescription,
  heroChips = [],
  leftContent,
  rightContent,
  schema,
  heroVariant = "default"
}: ToolsPageShellProps) {
  const isCompactHero = heroVariant === "compact";
  const leftPanel = (
    <section className="tools-mobile-left space-y-4">
      <section
        className={cn(
          "tools-hero-panel tools-mobile-hero rounded-2xl border border-black/20",
          isCompactHero ? "p-3" : "p-4"
        )}
      >
        <p
          className={cn(
            "pixel-font uppercase tracking-[0.16em] text-black/68",
            isCompactHero ? "text-[9px]" : "text-[10px]"
          )}
        >
          {heroEyebrow}
        </p>
        <h1
          className={cn(
            "pixel-font uppercase tracking-[0.12em] text-black/86",
            isCompactHero ? "mt-1.5 text-[12px]" : "mt-2 text-[14px]"
          )}
        >
          {heroTitle}
        </h1>
        <p className={cn("text-black/76", isCompactHero ? "mt-1.5 text-[13px]" : "mt-2 text-sm")}>
          {heroDescription}
        </p>
        {heroChips.length > 0 ? (
          <div className={cn("flex flex-wrap gap-1.5", isCompactHero ? "mt-2" : "mt-3")}>
            {heroChips.map((chip) => (
              <span
                key={chip.label}
                className={cn(
                  "rounded-md border px-2 py-1",
                  isCompactHero ? "text-[11px]" : "text-xs",
                  chipToneClass(chip.tone)
                )}
              >
                {chip.label}
              </span>
            ))}
          </div>
        ) : null}
      </section>
      <div id="tools-workspace" className="tools-mobile-workspace">
        {leftContent}
      </div>
    </section>
  );

  return (
    <>
      {schema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ) : null}
      <main
        className={cn(
          "tools-mobile-page pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 sm:px-4 lg:px-5",
          isCompactHero ? "py-3 sm:py-4" : "py-5 sm:py-8"
        )}
      >
        <PokedexFrame
          title={frameTitle}
          status="success"
          leftPanel={leftPanel}
          rightPanel={<div className="tools-mobile-right space-y-4">{rightContent}</div>}
          rightPanelSticky
          className="tools-mobile-frame"
        />
        <MobileDexBottomNav
          activeKey="explore"
          exploreHref="#tools-workspace"
          settingsHref="#tools-guide"
          className="tools-mobile-bottom-nav"
        />
      </main>
    </>
  );
}
