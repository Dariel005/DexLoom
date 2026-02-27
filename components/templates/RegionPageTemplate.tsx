import Link from "next/link";
import { ReferencesBlock, type ReferenceEntry } from "@/components/wiki/ReferencesBlock";
import { WikiTagList } from "@/components/wiki/WikiTagList";

export interface RegionPageTemplateLocation {
  name: string;
  slug: string;
  description: string;
}

export interface RegionPageTemplateData {
  name: string;
  generationLabel: string;
  mapImageUrl: string;
  mapImageAlt: string;
  overview: string;
  citiesAndRoutes: RegionPageTemplateLocation[];
  encountersStructureNote: string;
  tags: string[];
  references?: ReferenceEntry[];
}

const DEFAULT_REGION_DATA: RegionPageTemplateData = {
  name: "{{REGION_NAME}}",
  generationLabel: "{{GENERATION_LABEL}}",
  mapImageUrl: "{{MAP_IMAGE_URL}}",
  mapImageAlt: "{{REGION_MAP_ALT}}",
  overview: "{{REGION_OVERVIEW}}",
  citiesAndRoutes: [
    {
      name: "{{LOCATION_NAME_1}}",
      slug: "{{location-slug-1}}",
      description: "{{LOCATION_DESCRIPTION_1}}"
    }
  ],
  encountersStructureNote: "{{ENCOUNTER_STRUCTURE_NOTE}}",
  tags: ["region", "{{GENERATION_TAG}}", "{{MAP_TAG}}"]
};

interface RegionPageTemplateProps {
  data?: Partial<RegionPageTemplateData>;
}

function mergeRegionData(
  data: Partial<RegionPageTemplateData> | undefined
): RegionPageTemplateData {
  return {
    ...DEFAULT_REGION_DATA,
    ...data,
    citiesAndRoutes: data?.citiesAndRoutes ?? DEFAULT_REGION_DATA.citiesAndRoutes,
    tags: data?.tags ?? DEFAULT_REGION_DATA.tags,
    references: data?.references ?? DEFAULT_REGION_DATA.references
  };
}

export function RegionPageTemplate({ data }: RegionPageTemplateProps) {
  const entry = mergeRegionData(data);

  return (
    <article className="space-y-4">
      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/65">
          Region Entry Template
        </p>
        <h1 className="pixel-font mt-2 text-[14px] uppercase tracking-[0.12em] text-black/85">
          {entry.name}
        </h1>
        <p className="mt-1 text-sm text-black/70">{entry.generationLabel}</p>
        <div className="mt-3">
          <WikiTagList tags={entry.tags} />
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Region Map
        </h2>
        <p className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/75">
          Image source: {entry.mapImageUrl}
        </p>
        <p className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/75">
          Alt text: {entry.mapImageAlt}
        </p>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Overview
        </h2>
        <p className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/78">
          {entry.overview}
        </p>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Cities / Routes / Zones
        </h2>
        <div className="mt-2 space-y-2 text-sm">
          {entry.citiesAndRoutes.map((location) => (
            <div
              key={location.slug}
              className="rounded-lg border border-black/20 bg-white/70 px-3 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-black/80">{location.name}</p>
                <Link
                  href={`/locations/${location.slug}`}
                  className="rounded-md border border-black/20 bg-white/75 px-2 py-1 text-xs text-black/70 hover:bg-white"
                >
                  Open location
                </Link>
              </div>
              <p className="mt-1 text-black/70">{location.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Encounter Structure
        </h2>
        <p className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/78">
          {entry.encountersStructureNote}
        </p>
      </section>

      <ReferencesBlock references={entry.references} />
    </article>
  );
}

