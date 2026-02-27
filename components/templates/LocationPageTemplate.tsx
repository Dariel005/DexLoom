import { ReferencesBlock, type ReferenceEntry } from "@/components/wiki/ReferencesBlock";
import { WikiTagList } from "@/components/wiki/WikiTagList";

export interface LocationPageTemplateData {
  name: string;
  region: string;
  locationType: string;
  description: string;
  encountersByArea: Array<{
    area: string;
    notes: string;
  }>;
  tags: string[];
  references?: ReferenceEntry[];
}

const DEFAULT_LOCATION_DATA: LocationPageTemplateData = {
  name: "{{LOCATION_NAME}}",
  region: "{{REGION_NAME}}",
  locationType: "{{LOCATION_TYPE}}",
  description: "{{LOCATION_DESCRIPTION}}",
  encountersByArea: [
    { area: "{{AREA_1}}", notes: "{{ENCOUNTER_NOTES_1}}" },
    { area: "{{AREA_2}}", notes: "{{ENCOUNTER_NOTES_2}}" }
  ],
  tags: ["location", "{{REGION_TAG}}", "{{AREA_TAG}}"]
};

interface LocationPageTemplateProps {
  data?: Partial<LocationPageTemplateData>;
}

function mergeLocationData(
  data: Partial<LocationPageTemplateData> | undefined
): LocationPageTemplateData {
  return {
    ...DEFAULT_LOCATION_DATA,
    ...data,
    encountersByArea: data?.encountersByArea ?? DEFAULT_LOCATION_DATA.encountersByArea,
    tags: data?.tags ?? DEFAULT_LOCATION_DATA.tags,
    references: data?.references ?? DEFAULT_LOCATION_DATA.references
  };
}

export function LocationPageTemplate({ data }: LocationPageTemplateProps) {
  const entry = mergeLocationData(data);

  return (
    <article className="space-y-4">
      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/65">
          Location Entry Template
        </p>
        <h1 className="pixel-font mt-2 text-[14px] uppercase tracking-[0.12em] text-black/85">
          {entry.name}
        </h1>
        <p className="mt-1 text-sm text-black/70">
          {entry.region} | {entry.locationType}
        </p>
        <div className="mt-3">
          <WikiTagList tags={entry.tags} />
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Description
        </h2>
        <p className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/78">
          {entry.description}
        </p>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Encounters by Area
        </h2>
        <div className="mt-2 space-y-2 text-sm">
          {entry.encountersByArea.map((entryArea) => (
            <div
              key={`${entryArea.area}-${entryArea.notes}`}
              className="rounded-lg border border-black/20 bg-white/70 px-3 py-2"
            >
              <p className="font-medium text-black/80">{entryArea.area}</p>
              <p className="mt-1 text-black/70">{entryArea.notes}</p>
            </div>
          ))}
        </div>
      </section>

      <ReferencesBlock references={entry.references} />
    </article>
  );
}

