import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteStarButton } from "@/components/FavoriteStarButton";
import { LocationPageTemplate } from "@/components/templates/LocationPageTemplate";
import { PokedexFrame } from "@/components/PokedexFrame";
import { ReferencesBlock } from "@/components/wiki/ReferencesBlock";
import { getLocationBySlug, LOCATION_WIKI_INDEX } from "@/lib/locations-encyclopedia";

interface LocationDetailPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return LOCATION_WIKI_INDEX.map((entry) => ({ slug: entry.slug }));
}

export function generateMetadata({ params }: LocationDetailPageProps): Metadata {
  const location = getLocationBySlug(params.slug);
  if (!location) {
    return {
      title: "Location Entry Not Found",
      description: "The requested location entry does not exist."
    };
  }

  return {
    title: `${location.name} Location Entry`,
    description:
      "Location entry with description and encounter-by-area template structure."
  };
}

export default function LocationDetailPage({ params }: LocationDetailPageProps) {
  const location = getLocationBySlug(params.slug);
  if (!location) {
    notFound();
  }

  const leftPanel = (
    <LocationPageTemplate
      data={{
        name: location.name,
        region: location.regionName,
        locationType: location.locationType === "city" ? "City" : "Landmark / Zone",
        description: location.description,
        encountersByArea: [
          {
            area: "{{AREA_SEGMENT_DAY}}",
            notes: "{{ENCOUNTER_TABLE_DAY}}"
          },
          {
            area: "{{AREA_SEGMENT_NIGHT}}",
            notes: "{{ENCOUNTER_TABLE_NIGHT}}"
          },
          {
            area: "{{SPECIAL_ENCOUNTER_LAYER}}",
            notes: "{{SURF_CAVE_FISHING_OR_EVENT_ENCOUNTERS}}"
          }
        ],
        tags: ["location", location.regionKey, location.locationType],
        references: [
          {
            label: "Encounter tables pending: fill per game version and method."
          }
        ]
      }}
    />
  );

  const rightPanel = (
    <section className="space-y-4">
      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Location Navigation
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <FavoriteStarButton
            favorite={{
              entityType: "location",
              entityId: location.slug,
              title: location.name,
              href: `/locations/${location.slug}`,
              subtitle: `${location.regionName} ${location.locationType}`,
              tags: ["location", location.regionKey, location.locationType]
            }}
            showLabel
          />
          <Link
            href="/"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Back to Pokedex
          </Link>
          <Link
            href="/maps"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Open maps explorer
          </Link>
        </div>
      </section>

      <ReferencesBlock
        references={[
          {
            label: "Use this entry as the canonical location page for area-specific encounter tables."
          }
        ]}
      />
    </section>
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${location.name} Location Entry`,
    about: ["pokemon location", location.name, location.regionName]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <PokedexFrame
          title={`${location.name} - Location Encyclopedia`}
          status="success"
          leftPanel={leftPanel}
          rightPanel={rightPanel}
        />
      </main>
    </>
  );
}
