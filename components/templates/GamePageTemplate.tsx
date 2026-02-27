import { ReferencesBlock, type ReferenceEntry } from "@/components/wiki/ReferencesBlock";
import { WikiTagList } from "@/components/wiki/WikiTagList";

export interface GamePageTemplateData {
  title: string;
  generationLabel: string;
  regionLabel: string;
  regionalDexNotes: string[];
  exclusiveNotes: string[];
  featureNotes: string[];
  leagueStructure: Array<{
    label: string;
    value: string;
  }>;
  legendaryAvailability: string[];
  keyMachinesAndItems: string[];
  tags: string[];
  references?: ReferenceEntry[];
}

const DEFAULT_GAME_DATA: GamePageTemplateData = {
  title: "{{GAME_TITLE}}",
  generationLabel: "{{GENERATION_LABEL}}",
  regionLabel: "{{REGION_LABEL}}",
  regionalDexNotes: [
    "{{REGIONAL_DEX_SCOPE}}",
    "{{REGIONAL_DEX_UNLOCK_NOTES}}"
  ],
  exclusiveNotes: ["{{VERSION_EXCLUSIVE_POKEMON_A}}", "{{VERSION_EXCLUSIVE_POKEMON_B}}"],
  featureNotes: ["{{MAJOR_FEATURE_1}}", "{{MAJOR_FEATURE_2}}"],
  leagueStructure: [
    { label: "Gym Leaders", value: "{{GYM_LEADERS_STRUCTURE}}" },
    { label: "Elite Four", value: "{{ELITE_FOUR_STRUCTURE}}" },
    { label: "Champion", value: "{{CHAMPION_STRUCTURE}}" }
  ],
  legendaryAvailability: ["{{LEGENDARY_1}}", "{{LEGENDARY_2}}"],
  keyMachinesAndItems: ["{{TM_OR_TR_GROUP}}", "{{KEY_ITEM_GROUP}}"],
  tags: ["game", "{{GENERATION_TAG}}", "{{REGION_TAG}}"]
};

interface GamePageTemplateProps {
  data?: Partial<GamePageTemplateData>;
}

function mergeGameData(data: Partial<GamePageTemplateData> | undefined): GamePageTemplateData {
  return {
    ...DEFAULT_GAME_DATA,
    ...data,
    regionalDexNotes: data?.regionalDexNotes ?? DEFAULT_GAME_DATA.regionalDexNotes,
    exclusiveNotes: data?.exclusiveNotes ?? DEFAULT_GAME_DATA.exclusiveNotes,
    featureNotes: data?.featureNotes ?? DEFAULT_GAME_DATA.featureNotes,
    leagueStructure: data?.leagueStructure ?? DEFAULT_GAME_DATA.leagueStructure,
    legendaryAvailability:
      data?.legendaryAvailability ?? DEFAULT_GAME_DATA.legendaryAvailability,
    keyMachinesAndItems: data?.keyMachinesAndItems ?? DEFAULT_GAME_DATA.keyMachinesAndItems,
    tags: data?.tags ?? DEFAULT_GAME_DATA.tags,
    references: data?.references ?? DEFAULT_GAME_DATA.references
  };
}

export function GamePageTemplate({ data }: GamePageTemplateProps) {
  const entry = mergeGameData(data);

  return (
    <article className="space-y-4">
      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/65">
          Game Entry Template
        </p>
        <h1 className="pixel-font mt-2 text-[14px] uppercase tracking-[0.12em] text-black/85">
          {entry.title}
        </h1>
        <p className="mt-1 text-sm text-black/70">
          {entry.generationLabel} | {entry.regionLabel}
        </p>
        <div className="mt-3">
          <WikiTagList tags={entry.tags} />
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Regional Pokedex
        </h2>
        <div className="mt-2 space-y-2 text-sm">
          {entry.regionalDexNotes.map((note) => (
            <p key={note} className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
              {note}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Version Exclusives
        </h2>
        <div className="mt-2 space-y-2 text-sm">
          {entry.exclusiveNotes.map((exclusive) => (
            <p
              key={exclusive}
              className="rounded-lg border border-black/20 bg-white/70 px-3 py-2"
            >
              {exclusive}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Changes / Features
        </h2>
        <div className="mt-2 space-y-2 text-sm">
          {entry.featureNotes.map((feature) => (
            <p key={feature} className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
              {feature}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Leaders / Elite / Champion
        </h2>
        <div className="mt-2 space-y-2 text-sm">
          {entry.leagueStructure.map((row) => (
            <p
              key={row.label}
              className="rounded-lg border border-black/20 bg-white/70 px-3 py-2"
            >
              {row.label}: {row.value}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Available Legendaries
        </h2>
        <div className="mt-2 space-y-2 text-sm">
          {entry.legendaryAvailability.map((legendary) => (
            <p
              key={legendary}
              className="rounded-lg border border-black/20 bg-white/70 px-3 py-2"
            >
              {legendary}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          TMs / Key Items Structure
        </h2>
        <div className="mt-2 space-y-2 text-sm">
          {entry.keyMachinesAndItems.map((group) => (
            <p key={group} className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
              {group}
            </p>
          ))}
        </div>
      </section>

      <ReferencesBlock references={entry.references} />
    </article>
  );
}

