import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FavoriteStarButton } from "@/components/FavoriteStarButton";
import { PokedexFrame } from "@/components/PokedexFrame";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { ReferencesBlock } from "@/components/wiki/ReferencesBlock";
import {
  GAME_ENTRY_SECTION_KEYS,
  type GameEntrySectionKey,
  ALL_GAME_DETAILS,
  getMainlineGameDetailBySlug,
} from "@/lib/mainline-games";
import { resolveBulbagardenImageSrc } from "@/lib/remote-image";

interface GameDetailPageProps {
  params: { slug: string };
}

interface SectionNavEntry {
  id: string;
  key: GameEntrySectionKey;
  label: string;
}

const SECTION_NAV: SectionNavEntry[] = [
  { id: "identity", key: "identity", label: "Identity" },
  { id: "release-matrix", key: "release_matrix", label: "Release Matrix" },
  { id: "version-differences", key: "version_differences", label: "Version Differences" },
  { id: "core-mechanics", key: "core_mechanics", label: "Core Mechanics Introduced" },
  { id: "pokedex-data", key: "pokedex_data", label: "Pokedex Data" },
  { id: "story-progression", key: "story_progression", label: "Story & Progression" },
  { id: "world-map", key: "world_map", label: "World & Map" },
  { id: "content-modes", key: "content_modes", label: "Content & Modes" },
  { id: "postgame", key: "postgame", label: "Postgame" },
  { id: "connectivity", key: "connectivity", label: "Connectivity" },
  { id: "technical-profile", key: "technical_profile", label: "Technical Profile" },
  { id: "dlc-updates", key: "dlc_updates", label: "DLC & Update History" },
  { id: "reception-sales", key: "reception_sales", label: "Reception & Sales" },
  { id: "references-verification", key: "references_verification", label: "References & Verification" }
];

export function generateStaticParams() {
  return ALL_GAME_DETAILS.map((entry) => ({ slug: entry.slug }));
}

export function generateMetadata({ params }: GameDetailPageProps): Metadata {
  const entry = getMainlineGameDetailBySlug(params.slug);

  if (!entry) {
    return {
      title: "Game Entry Not Found"
    };
  }

  return {
    title: `${entry.title} | Pokemon Games`,
    description:
      `${entry.title} complete game dossier with release matrix, mechanics, no-spoiler progression, connectivity profile, and source verification.`
  };
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/75">
      <span className="pixel-font mr-1 text-[10px] uppercase tracking-[0.12em] text-black/66">
        {label}:
      </span>
      {value}
    </p>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
      {title}
    </h2>
  );
}

function metricToRating(value: string) {
  const match = value.match(/(\d{2,3})(?:\s*\/\s*100)?/);
  if (!match) {
    return null;
  }
  const score = Number(match[1]);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return null;
  }
  return score;
}

export default function GameDetailPage({ params }: GameDetailPageProps) {
  const game = getMainlineGameDetailBySlug(params.slug);

  if (!game) {
    notFound();
  }

  const relatedEntries = game.relatedSlugs
    .map((slug) => getMainlineGameDetailBySlug(slug))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  const resolvedGameImageSrc = resolveBulbagardenImageSrc(game.imageSrc) ?? game.imageSrc;

  const sourceById = new Map(game.references.map((reference) => [reference.id, reference] as const));
  const hasCompleteSectionMap = GAME_ENTRY_SECTION_KEYS.every(
    (sectionKey) => Array.isArray(game.sectionSourceMap[sectionKey]) && game.sectionSourceMap[sectionKey].length > 0
  );
  const referencesForBlock = game.references.map((reference) => ({
    label: reference.label,
    href: reference.href,
    note: reference.note
      ? `${reference.note} (Accessed ${reference.accessedOn})`
      : `Accessed ${reference.accessedOn}`
  }));

  const releaseDateForSchema = game.releaseMatrix.find((row) => row.dateISO !== null)?.dateISO ?? undefined;
  const metacriticMetric = game.receptionAndSales.find((metric) => /metacritic/i.test(metric.label));
  const parsedMetacriticScore = metacriticMetric ? metricToRating(metacriticMetric.value) : null;

  const sectionSourceRows = SECTION_NAV.map((entry) => {
    const sourceIds = game.sectionSourceMap[entry.key] ?? [];
    const labels = sourceIds.map((sourceId) => sourceById.get(sourceId)?.label ?? sourceId);
    return {
      label: entry.label,
      value: labels.join(" | ")
    };
  });

  const leftPanel = (
    <article className="space-y-4">
      <section id="identity" className="scroll-mt-28 rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/65">Game Entry</p>
        <h1 className="pixel-font mt-2 text-[14px] uppercase tracking-[0.12em] text-black/85">
          {game.title}
        </h1>
        <p className="mt-1 text-sm text-black/70">
          {game.generationLabel} | {game.regionLabel}
        </p>
        <div className="mt-3 grid gap-3 lg:grid-cols-[260px_1fr]">
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-black/20 bg-white/75">
            <Image
              src={resolvedGameImageSrc}
              alt={game.imageAlt}
              fill
              sizes="(max-width: 1024px) 70vw, 260px"
              className="object-contain p-2"
            />
          </div>
          <div className="space-y-2">
            <FactRow label="Official Title" value={game.identity.officialTitle} />
            <FactRow label="Category" value={game.identity.category} />
            <FactRow label="Classification" value={game.classification} />
            <FactRow label="Release" value={game.releaseDate} />
            <FactRow label="Platform" value={game.platform} />
            <FactRow label="Era" value={game.eraLabel} />
            <FactRow label="Developers" value={game.developers.join(" / ")} />
            <FactRow label="Publisher" value={game.publisher} />
            <FactRow label="Mascots" value={game.identity.mascots.join(", ")} />
          </div>
        </div>
        <div className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/75">
          <span className="pixel-font mr-1 text-[10px] uppercase tracking-[0.12em] text-black/66">
            Alternate Titles:
          </span>
          {game.identity.alternateTitles.join(", ")}
        </div>
      </section>

      <section id="release-matrix" className="scroll-mt-28 rounded-2xl border border-black/20 bg-white/60 p-4">
        <SectionHeader title="Release Matrix" />
        <div className="mt-2 space-y-2">
          {game.releaseMatrix.map((row, index) => (
            <article key={`${game.slug}-release-${row.region}-${index}`} className="rounded-xl border border-black/20 bg-white/72 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="pixel-font text-[10px] uppercase tracking-[0.12em] text-black/72">{row.region}</p>
                <p className="text-sm text-black/74">{row.dateLabel}</p>
              </div>
              <p className="mt-1 text-xs text-black/62">ISO: {row.dateISO ?? "Unknown"}</p>
              <ul className="mt-2 space-y-1 text-sm text-black/75">
                {row.notes.map((note) => (
                  <li key={`${game.slug}-${row.region}-${note}`} className="rounded-lg border border-black/15 bg-white/70 px-2 py-1">
                    {note}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="version-differences" className="scroll-mt-28 rounded-2xl border border-black/20 bg-white/60 p-4">
        <SectionHeader title="Version Differences" />
        <div className="mt-2 space-y-2">
          {game.versionDifferences.map((difference, index) => (
            <article key={`${game.slug}-difference-${index}`} className="rounded-xl border border-black/20 bg-white/72 p-3">
              <p className="pixel-font text-[10px] uppercase tracking-[0.12em] text-black/72">{difference.category}</p>
              <p className="mt-1 text-sm text-black/74">
                {difference.leftVersion} vs {difference.rightVersion}
              </p>
              <p className="mt-1 text-sm text-black/75">{difference.notes}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="core-mechanics" className="scroll-mt-28 rounded-2xl border border-black/20 bg-white/60 p-4">
        <SectionHeader title="Core Mechanics Introduced" />
        <ul className="mt-2 space-y-2 text-sm text-black/75">
          {game.mechanicsIntroduced.map((mechanic) => (
            <li key={`${game.slug}-mechanic-${mechanic}`} className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
              {mechanic}
            </li>
          ))}
        </ul>
      </section>

      <section id="pokedex-data" className="scroll-mt-28 rounded-2xl border border-black/20 bg-white/60 p-4">
        <SectionHeader title="Pokedex Data" />
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <FactRow label="Regional Dex Size" value={game.pokedexProfile.regionalDexSize} />
          <FactRow label="New Species Count" value={game.pokedexProfile.newSpeciesCount} />
        </div>
        <div className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/75">
          <span className="pixel-font mr-1 text-[10px] uppercase tracking-[0.12em] text-black/66">
            Starters:
          </span>
          {game.pokedexProfile.starterPokemon.join(", ")}
        </div>
        <div className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/75">
          <span className="pixel-font mr-1 text-[10px] uppercase tracking-[0.12em] text-black/66">
            Legendary Focus:
          </span>
          {game.pokedexProfile.legendaryPokemon.join(", ")}
        </div>
        <div className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/75">
          <span className="pixel-font mr-1 text-[10px] uppercase tracking-[0.12em] text-black/66">
            Notable Forms:
          </span>
          {game.pokedexProfile.notableForms.join(", ")}
        </div>
      </section>

      <section id="story-progression" className="scroll-mt-28 rounded-2xl border border-black/20 bg-white/60 p-4">
        <SectionHeader title="Story & Progression (No Spoilers)" />
        <p className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/75">
          {game.storySummaryNoSpoiler}
        </p>
        <ul className="mt-2 space-y-2 text-sm text-black/75">
          {game.progressionOutline.map((step, index) => (
            <li key={`${game.slug}-progression-${index}`} className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
              {index + 1}. {step}
            </li>
          ))}
        </ul>
      </section>

      <section id="world-map" className="scroll-mt-28 rounded-2xl border border-black/20 bg-white/60 p-4">
        <SectionHeader title="World & Map" />
        <FactRow label="Primary Region" value={game.worldProfile.primaryRegion} />
        <FactRow label="Route Structure" value={game.worldProfile.routeStructure} />
        <div className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/75">
          <span className="pixel-font mr-1 text-[10px] uppercase tracking-[0.12em] text-black/66">
            Key Hubs:
          </span>
          {game.worldProfile.keyHubs.join(", ")}
        </div>
        <div className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/75">
          <span className="pixel-font mr-1 text-[10px] uppercase tracking-[0.12em] text-black/66">
            Standout Areas:
          </span>
          {game.worldProfile.standoutAreas.join(", ")}
        </div>
      </section>

      <section id="content-modes" className="scroll-mt-28 rounded-2xl border border-black/20 bg-white/60 p-4">
        <SectionHeader title="Content & Modes" />
        <p className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/75">
          {game.contentModes.mainStory}
        </p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <div className="rounded-xl border border-black/20 bg-white/72 p-3">
            <p className="pixel-font text-[10px] uppercase tracking-[0.12em] text-black/66">Side Modes</p>
            <ul className="mt-1 space-y-1 text-sm text-black/75">
              {game.contentModes.sideModes.map((mode) => (
                <li key={`${game.slug}-side-${mode}`} className="rounded-md border border-black/15 bg-white/70 px-2 py-1">
                  {mode}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-black/20 bg-white/72 p-3">
            <p className="pixel-font text-[10px] uppercase tracking-[0.12em] text-black/66">Online / Local</p>
            <ul className="mt-1 space-y-1 text-sm text-black/75">
              {game.contentModes.onlineLocal.map((mode) => (
                <li key={`${game.slug}-network-${mode}`} className="rounded-md border border-black/15 bg-white/70 px-2 py-1">
                  {mode}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="postgame" className="scroll-mt-28 rounded-2xl border border-black/20 bg-white/60 p-4">
        <SectionHeader title="Postgame" />
        <ul className="mt-2 space-y-2 text-sm text-black/75">
          {game.postgameProfile.map((entry) => (
            <li key={`${game.slug}-postgame-${entry}`} className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
              {entry}
            </li>
          ))}
        </ul>
      </section>

      <section id="connectivity" className="scroll-mt-28 rounded-2xl border border-black/20 bg-white/60 p-4">
        <SectionHeader title="Connectivity" />
        <div className="mt-2 space-y-2">
          <FactRow label="Pokemon HOME" value={game.connectivityProfile.pokemonHome} />
          <FactRow label="Transfer Route" value={game.connectivityProfile.transferRoute} />
          <FactRow label="Event Distribution" value={game.connectivityProfile.eventDistribution} />
        </div>
      </section>

      <section id="technical-profile" className="scroll-mt-28 rounded-2xl border border-black/20 bg-white/60 p-4">
        <SectionHeader title="Technical Profile" />
        <FactRow label="Render Target" value={game.technicalProfile.renderTarget} />
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <div className="rounded-xl border border-black/20 bg-white/72 p-3">
            <p className="pixel-font text-[10px] uppercase tracking-[0.12em] text-black/66">Performance Notes</p>
            <ul className="mt-1 space-y-1 text-sm text-black/75">
              {game.technicalProfile.performanceNotes.map((note) => (
                <li key={`${game.slug}-perf-${note}`} className="rounded-md border border-black/15 bg-white/70 px-2 py-1">
                  {note}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-black/20 bg-white/72 p-3">
            <p className="pixel-font text-[10px] uppercase tracking-[0.12em] text-black/66">Known Issues</p>
            <ul className="mt-1 space-y-1 text-sm text-black/75">
              {game.technicalProfile.knownIssues.map((issue) => (
                <li key={`${game.slug}-issue-${issue}`} className="rounded-md border border-black/15 bg-white/70 px-2 py-1">
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="dlc-updates" className="scroll-mt-28 rounded-2xl border border-black/20 bg-white/60 p-4">
        <SectionHeader title="DLC & Update History" />
        <ul className="mt-2 space-y-2 text-sm text-black/75">
          {game.dlcAndPatchHistory.map((entry) => (
            <li key={`${game.slug}-dlc-${entry}`} className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
              {entry}
            </li>
          ))}
        </ul>
      </section>

      <section id="reception-sales" className="scroll-mt-28 rounded-2xl border border-black/20 bg-white/60 p-4">
        <SectionHeader title="Reception & Sales (As Of)" />
        <div className="mt-2 space-y-2">
          {game.receptionAndSales.map((metric) => (
            <article key={`${game.slug}-metric-${metric.label}`} className="rounded-xl border border-black/20 bg-white/72 p-3">
              <p className="pixel-font text-[10px] uppercase tracking-[0.12em] text-black/66">{metric.label}</p>
              <p className="mt-1 text-sm text-black/75">{metric.value}</p>
              <p className="mt-1 text-xs text-black/62">As of {metric.asOf}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="references-verification" className="scroll-mt-28 rounded-2xl border border-black/20 bg-white/60 p-4">
        <SectionHeader title="References & Verification" />
        <FactRow label="Last Verified On" value={game.lastVerifiedOn} />
        <FactRow label="Section Source Coverage" value={hasCompleteSectionMap ? "Complete" : "Incomplete"} />
        <div className="mt-2 space-y-2">
          {sectionSourceRows.map((row) => (
            <FactRow key={`${game.slug}-source-${row.label}`} label={row.label} value={row.value} />
          ))}
        </div>
      </section>

      <ReferencesBlock title="Reference Registry" references={referencesForBlock} />
    </article>
  );

  const rightPanel = (
    <section className="space-y-4">
      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Game Navigation</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <FavoriteStarButton
            favorite={{
              entityType: "game",
              entityId: game.slug,
              title: game.title,
              href: `/games/${game.slug}`,
              imageUrl: resolvedGameImageSrc,
              subtitle: `${game.generationLabel} (${game.regionLabel})`,
              tags: ["game", game.generationKey]
            }}
            showLabel
          />
          <RouteTransitionLink
            href="/games"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Back to Games
          </RouteTransitionLink>
          <RouteTransitionLink
            href="/"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Back to Pokedex
          </RouteTransitionLink>
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Snapshot</p>
        <div className="mt-2 space-y-2">
          <FactRow label="Generation" value={game.generationLabel} />
          <FactRow label="Region" value={game.regionLabel} />
          <FactRow label="Category" value={game.identity.category} />
          <FactRow label="Platform" value={game.platform} />
          <FactRow label="Verified" value={game.lastVerifiedOn} />
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Jump Nav</p>
        <div className="mt-2 space-y-1.5">
          {SECTION_NAV.map((entry) => (
            <a
              key={`${game.slug}-nav-${entry.id}`}
              href={`#${entry.id}`}
              className="block rounded-lg border border-black/20 bg-white/72 px-3 py-2 text-xs text-black/75 transition hover:bg-white"
            >
              {entry.label}
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Related Games</p>
        <div className="mt-2 grid gap-2">
          {relatedEntries.length > 0 ? (
            relatedEntries.map((entry) => (
              <RouteTransitionLink
                key={`${game.slug}-related-${entry.slug}`}
                href={`/games/${entry.slug}`}
                className="rounded-lg border border-black/20 bg-white/75 px-3 py-2 text-sm text-black/75 transition hover:bg-white"
              >
                {entry.title}
              </RouteTransitionLink>
            ))
          ) : (
            <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/75">
              No related game links configured.
            </p>
          )}
        </div>
      </section>

    </section>
  );

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    genre: "RPG",
    gamePlatform: game.platform,
    publisher: game.publisher,
    image: game.mediaGallery.find((item) => item.src)?.src ?? game.imageSrc,
    sameAs: game.references.map((reference) => reference.href)
  };

  if (releaseDateForSchema) {
    schema.releaseDate = releaseDateForSchema;
  }

  if (parsedMetacriticScore !== null) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: parsedMetacriticScore,
      bestRating: 100
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <PokedexFrame
          title={game.title}
          status="success"
          leftPanel={leftPanel}
          rightPanel={rightPanel}
          rightPanelSticky
        />
      </main>
    </>
  );
}
