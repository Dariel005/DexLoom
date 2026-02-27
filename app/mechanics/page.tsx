import type { Metadata } from "next";
import Image from "next/image";
import { EncyclopediaDataTable } from "@/components/EncyclopediaDataTable";
import { FavoriteStarButton } from "@/components/FavoriteStarButton";
import { MechanicsSectionNav } from "@/components/mechanics/MechanicsSectionNav";
import { PokedexFrame } from "@/components/PokedexFrame";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { WikiTagList } from "@/components/wiki/WikiTagList";
import {
  MECHANICS_BATTLE_FLOW,
  MECHANICS_BUILD_RECIPES,
  MECHANICS_HUD_GALLERY,
  MECHANICS_POWER_SYSTEMS,
  MECHANICS_TOPICS
} from "@/lib/mechanics-encyclopedia";

export const revalidate = 604800; // 7 days

export const metadata: Metadata = {
  title: "Mechanics",
  description:
    "Advanced mechanics deck with battle-flow analysis, generation systems, optimization checklists, and HUD evolution gallery."
};

function InfoChip({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "green" | "amber" | "sky" }) {
  const toneClass =
    tone === "green"
      ? "border-emerald-300/85 bg-emerald-100/72 text-emerald-900"
      : tone === "amber"
        ? "border-amber-300/85 bg-amber-100/72 text-amber-900"
        : tone === "sky"
          ? "border-sky-300/85 bg-sky-100/72 text-sky-900"
          : "border-black/20 bg-white/70 text-black/72";

  return <span className={`rounded-md border px-2 py-1 text-xs ${toneClass}`}>{label}</span>;
}

function TopicSection({
  title,
  rows
}: {
  title: string;
  rows: string[];
}) {
  return (
    <div>
      <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-black/62">{title}</p>
      <ul className="mt-1.5 space-y-1.5 text-sm text-black/78">
        {rows.map((row) => (
          <li key={`${title}-${row}`} className="rounded-lg border border-black/18 bg-white/70 px-3 py-2">
            {row}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MechanicsPage() {
  const leftPanel = (
    <section id="mechanics-top" className="space-y-4">
      <section className="rounded-2xl border border-black/20 bg-[radial-gradient(circle_at_12%_10%,rgba(255,255,255,0.58),transparent_38%),linear-gradient(160deg,rgba(255,255,255,0.82),rgba(225,238,223,0.72))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_10px_20px_rgba(0,0,0,0.08)]">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/68">Mechanics Command Deck</p>
        <h1 className="pixel-font mt-2 text-[14px] uppercase tracking-[0.12em] text-black/86">
          Combat Systems Intelligence
        </h1>
        <p className="mt-2 text-sm text-black/76">
          Advanced tactical reference for battle logic, stat engineering, field control, and
          generation-specific power systems.
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <InfoChip label={`Core topics ${MECHANICS_TOPICS.length}`} />
          <InfoChip label={`HUD frames ${MECHANICS_HUD_GALLERY.length}`} tone="sky" />
          <InfoChip label={`Battle phases ${MECHANICS_BATTLE_FLOW.length}`} tone="amber" />
          <InfoChip label={`Power systems ${MECHANICS_POWER_SYSTEMS.length}`} tone="green" />
        </div>
      </section>

      <section
        id="hud-evolution"
        className="scroll-mt-28 rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.8),rgba(223,236,229,0.72))] p-4"
      >
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/72">Battle HUD Evolution</p>
        <p className="mt-2 text-sm text-black/75">
          Visual comparison of battle interface language from early handheld to modern era.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {MECHANICS_HUD_GALLERY.map((entry) => (
            <article
              key={entry.slug}
              className="rounded-xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.88),rgba(230,241,232,0.76))] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-black/20 bg-white/70">
                <Image
                  src={entry.imageSrc}
                  alt={entry.imageAlt}
                  fill
                  sizes="(max-width: 768px) 94vw, (max-width: 1280px) 45vw, 30vw"
                  className="object-contain p-1"
                />
              </div>
              <div className="mt-2">
                <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-black/62">
                  {entry.eraLabel}
                </p>
                <h2 className="pixel-font mt-1 text-[10px] uppercase tracking-[0.11em] text-black/84">
                  {entry.gamesLabel}
                </h2>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-black/74">
                {entry.uiHighlights.map((highlight) => (
                  <li key={`${entry.slug}-${highlight}`} className="rounded-md border border-black/15 bg-white/70 px-2 py-1">
                    {highlight}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {MECHANICS_TOPICS.map((topic) => (
        <section
          id={topic.slug}
          key={topic.slug}
          className="scroll-mt-28 rounded-2xl border border-black/20 bg-[linear-gradient(162deg,rgba(255,255,255,0.78),rgba(229,241,227,0.68))] p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="pixel-font text-[11px] uppercase tracking-[0.15em] text-black/80">
                {topic.title}
              </h2>
              <p className="mt-2 text-sm text-black/76">{topic.summary}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <FavoriteStarButton
                favorite={{
                  entityType: "mechanics_topic",
                  entityId: topic.slug,
                  title: topic.title,
                  href: `/mechanics#${topic.slug}`,
                  subtitle: topic.summary,
                  tags: ["mechanics", ...topic.tags.slice(0, 4)]
                }}
              />
              <InfoChip label={`${topic.checklist.length} operator checks`} tone="amber" />
            </div>
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            <TopicSection title="Checklist" rows={topic.checklist} />
            <TopicSection title="Focus Systems" rows={topic.focusSystems} />
            <TopicSection title="Advanced Notes" rows={topic.advancedNotes} />
            <TopicSection title="Common Mistakes" rows={topic.commonMistakes} />
          </div>

          <div className="mt-3">
            <TopicSection title="Practice Loop" rows={topic.practiceLoop} />
          </div>
          <div className="mt-2">
            <WikiTagList tags={topic.tags} />
          </div>
        </section>
      ))}

      <section
        id="battle-flow"
        className="scroll-mt-28 rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.8),rgba(224,236,228,0.72))] p-4"
      >
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/72">Battle Flow Matrix</p>
        <p className="mt-2 text-sm text-black/75">
          Turn-by-turn control model to reduce execution errors and timing mistakes.
        </p>
        <div className="mt-3">
          <EncyclopediaDataTable
            className="border-black/22 bg-[linear-gradient(155deg,rgba(255,255,255,0.86),rgba(234,243,236,0.78))]"
            rows={MECHANICS_BATTLE_FLOW}
            rowKey={(row, index) => `${row.phase}-${index}`}
            columns={[
              {
                key: "phase",
                header: "Phase",
                headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/66",
                render: (row) => row.phase
              },
              {
                key: "priority",
                header: "Priority Window",
                headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/66",
                render: (row) => row.priorityWindow
              },
              {
                key: "details",
                header: "Resolution Detail",
                headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/66",
                render: (row) => row.details
              },
              {
                key: "failure",
                header: "Common Failure",
                headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/66",
                render: (row) => row.failurePattern
              }
            ]}
          />
        </div>
      </section>

      <section
        id="generation-power-systems"
        className="scroll-mt-28 rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.8),rgba(223,236,233,0.72))] p-4"
      >
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/72">Generation Power Systems</p>
        <p className="mt-2 text-sm text-black/75">
          Cross-era comparison of battle gimmicks and how to counterplay each one.
        </p>
        <div className="mt-3">
          <EncyclopediaDataTable
            className="border-black/22 bg-[linear-gradient(155deg,rgba(255,255,255,0.86),rgba(234,243,236,0.78))]"
            rows={MECHANICS_POWER_SYSTEMS}
            rowKey={(row, index) => `${row.generationWindow}-${index}`}
            columns={[
              {
                key: "window",
                header: "Era",
                headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/66",
                render: (row) => row.generationWindow
              },
              {
                key: "mechanic",
                header: "Mechanic",
                headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/66",
                render: (row) => row.mechanic
              },
              {
                key: "activation",
                header: "Activation Model",
                headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/66",
                render: (row) => row.activation
              },
              {
                key: "offense",
                header: "Offensive Edge",
                headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/66",
                render: (row) => row.offensiveEdge
              },
              {
                key: "counter",
                header: "Counterplay",
                headerClassName: "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/66",
                render: (row) => row.counterplay
              }
            ]}
          />
        </div>
      </section>

      <section
        id="build-recipes"
        className="scroll-mt-28 rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.8),rgba(223,236,226,0.72))] p-4"
      >
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/72">Build Recipes</p>
        <p className="mt-2 text-sm text-black/75">
          Practical templates to move from theory into repeatable battle preparation.
        </p>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {MECHANICS_BUILD_RECIPES.map((recipe) => (
            <article
              key={recipe.title}
              className="rounded-xl border border-black/20 bg-[linear-gradient(162deg,rgba(255,255,255,0.88),rgba(232,243,233,0.76))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]"
            >
              <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-black/62">Recipe</p>
              <h3 className="pixel-font mt-1 text-[10px] uppercase tracking-[0.12em] text-black/84">{recipe.title}</h3>
              <p className="mt-1 text-xs text-black/74">{recipe.objective}</p>
              <ol className="mt-2 space-y-1.5 text-xs text-black/78">
                {recipe.steps.map((step, index) => (
                  <li key={`${recipe.title}-${step}`} className="rounded-md border border-black/15 bg-white/72 px-2 py-1">
                    {index + 1}. {step}
                  </li>
                ))}
              </ol>
              <p className="mt-2 rounded-md border border-black/18 bg-emerald-50/60 px-2 py-1 text-xs text-black/76">
                Outcome: {recipe.expectedOutcome}
              </p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );

  const rightPanel = (
    <section className="space-y-4">
      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Quick Links</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <RouteTransitionLink
            href="/"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Back to Pokedex
          </RouteTransitionLink>
          <RouteTransitionLink
            href="/types"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Types matrix
          </RouteTransitionLink>
          <RouteTransitionLink
            href="/maps"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Maps atlas
          </RouteTransitionLink>
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Section Navigation</p>
        <MechanicsSectionNav topics={MECHANICS_TOPICS} />
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Operator Notes</p>
        <div className="mt-2 space-y-2 text-sm text-black/76">
          <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
            Mechanics are strongest when linked to repeatable decision loops, not isolated facts.
          </p>
          <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
            Always recalculate win conditions after each KO, status proc, or field overwrite.
          </p>
          <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
            HUD awareness matters: clean panel reading directly improves turn discipline.
          </p>
        </div>
      </section>
    </section>
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Pokemon Mechanics Intelligence Deck",
    about: ["pokemon mechanics", "battle hud", "iv ev", "generation battle systems"]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <PokedexFrame
          title="Pokemon Mechanics Intelligence Deck"
          status="success"
          leftPanel={leftPanel}
          rightPanel={rightPanel}
          rightPanelSticky
        />
      </main>
    </>
  );
}
