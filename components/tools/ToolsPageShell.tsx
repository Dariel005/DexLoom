import { type ReactNode } from "react";
import { PokedexFrame } from "@/components/PokedexFrame";

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
  schema
}: ToolsPageShellProps) {
  const leftPanel = (
    <section className="space-y-4">
      <section className="tools-hero-panel rounded-2xl border border-black/20 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/68">
          {heroEyebrow}
        </p>
        <h1 className="pixel-font mt-2 text-[14px] uppercase tracking-[0.12em] text-black/86">
          {heroTitle}
        </h1>
        <p className="mt-2 text-sm text-black/76">{heroDescription}</p>
        {heroChips.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {heroChips.map((chip) => (
              <span
                key={chip.label}
                className={`rounded-md border px-2 py-1 text-xs ${chipToneClass(chip.tone)}`}
              >
                {chip.label}
              </span>
            ))}
          </div>
        ) : null}
      </section>
      {leftContent}
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
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <PokedexFrame
          title={frameTitle}
          status="success"
          leftPanel={leftPanel}
          rightPanel={rightContent}
          rightPanelSticky
        />
      </main>
    </>
  );
}
