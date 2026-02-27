import { ReferencesBlock, type ReferenceEntry } from "@/components/wiki/ReferencesBlock";
import { WikiTagList } from "@/components/wiki/WikiTagList";

export interface PokemonPageTemplateData {
  name: string;
  nationalDexNumber: string;
  regionalDexNumber: string;
  generationLabel: string;
  types: string[];
  abilities: Array<{
    name: string;
    isHidden?: boolean;
  }>;
  baseStats: Array<{
    stat: string;
    value: string;
  }>;
  evolutionChain: Array<{
    stage: string;
    method: string;
  }>;
  weaknessResistanceTable: Array<{
    label: string;
    values: string[];
  }>;
  moveBuckets: Array<{
    method: string;
    moves: string[];
  }>;
  locationsByGame: Array<{
    game: string;
    areas: string[];
  }>;
  mediaEntries: Array<{
    label: string;
    value: string;
  }>;
  tags: string[];
  references?: ReferenceEntry[];
}

const DEFAULT_POKEMON_TEMPLATE_DATA: PokemonPageTemplateData = {
  name: "{{POKEMON_NAME}}",
  nationalDexNumber: "{{NATIONAL_DEX_NUMBER}}",
  regionalDexNumber: "{{REGIONAL_DEX_NUMBER}}",
  generationLabel: "{{GENERATION_LABEL}}",
  types: ["{{TYPE_1}}", "{{TYPE_2}}"],
  abilities: [
    { name: "{{ABILITY_PRIMARY}}" },
    { name: "{{ABILITY_SECONDARY}}" },
    { name: "{{ABILITY_HIDDEN}}", isHidden: true }
  ],
  baseStats: [
    { stat: "HP", value: "{{HP}}" },
    { stat: "Attack", value: "{{ATTACK}}" },
    { stat: "Defense", value: "{{DEFENSE}}" },
    { stat: "Sp. Atk", value: "{{SP_ATTACK}}" },
    { stat: "Sp. Def", value: "{{SP_DEFENSE}}" },
    { stat: "Speed", value: "{{SPEED}}" }
  ],
  evolutionChain: [
    { stage: "{{STAGE_1}}", method: "{{EVOLUTION_METHOD_STAGE_1_TO_2}}" },
    { stage: "{{STAGE_2}}", method: "{{EVOLUTION_METHOD_STAGE_2_TO_3}}" },
    { stage: "{{STAGE_3}}", method: "{{FINAL_STAGE}}" }
  ],
  weaknessResistanceTable: [
    { label: "4x Weak", values: ["{{TYPE}}"] },
    { label: "2x Weak", values: ["{{TYPE}}"] },
    { label: "1/2 Resist", values: ["{{TYPE}}"] },
    { label: "1/4 Resist", values: ["{{TYPE}}"] },
    { label: "Immune", values: ["{{TYPE}}"] }
  ],
  moveBuckets: [
    { method: "Level-up", moves: ["{{MOVE_LEVEL_1}}", "{{MOVE_LEVEL_2}}"] },
    { method: "TM / TR", moves: ["{{MOVE_TM_1}}", "{{MOVE_TM_2}}"] },
    { method: "Tutor", moves: ["{{MOVE_TUTOR_1}}"] },
    { method: "Egg", moves: ["{{MOVE_EGG_1}}"] }
  ],
  locationsByGame: [
    { game: "{{GAME_VERSION}}", areas: ["{{LOCATION_AREA_1}}", "{{LOCATION_AREA_2}}"] }
  ],
  mediaEntries: [
    { label: "Official artwork", value: "{{OFFICIAL_ARTWORK_URL}}" },
    { label: "Default sprite", value: "{{SPRITE_DEFAULT_URL}}" },
    { label: "Shiny sprite", value: "{{SPRITE_SHINY_URL}}" }
  ],
  tags: ["pokemon", "{{GENERATION_TAG}}", "{{REGION_TAG}}", "{{TYPE_TAG}}"]
};

interface PokemonPageTemplateProps {
  data?: Partial<PokemonPageTemplateData>;
}

function mergeTemplateData(
  data: Partial<PokemonPageTemplateData> | undefined
): PokemonPageTemplateData {
  return {
    ...DEFAULT_POKEMON_TEMPLATE_DATA,
    ...data,
    types: data?.types ?? DEFAULT_POKEMON_TEMPLATE_DATA.types,
    abilities: data?.abilities ?? DEFAULT_POKEMON_TEMPLATE_DATA.abilities,
    baseStats: data?.baseStats ?? DEFAULT_POKEMON_TEMPLATE_DATA.baseStats,
    evolutionChain: data?.evolutionChain ?? DEFAULT_POKEMON_TEMPLATE_DATA.evolutionChain,
    weaknessResistanceTable:
      data?.weaknessResistanceTable ?? DEFAULT_POKEMON_TEMPLATE_DATA.weaknessResistanceTable,
    moveBuckets: data?.moveBuckets ?? DEFAULT_POKEMON_TEMPLATE_DATA.moveBuckets,
    locationsByGame: data?.locationsByGame ?? DEFAULT_POKEMON_TEMPLATE_DATA.locationsByGame,
    mediaEntries: data?.mediaEntries ?? DEFAULT_POKEMON_TEMPLATE_DATA.mediaEntries,
    tags: data?.tags ?? DEFAULT_POKEMON_TEMPLATE_DATA.tags,
    references: data?.references ?? DEFAULT_POKEMON_TEMPLATE_DATA.references
  };
}

export function PokemonPageTemplate({ data }: PokemonPageTemplateProps) {
  const entry = mergeTemplateData(data);

  return (
    <article className="space-y-4">
      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/65">
          Pokemon Entry Template
        </p>
        <h1 className="pixel-font mt-2 text-[14px] uppercase tracking-[0.12em] text-black/85">
          {entry.name}
        </h1>
        <p className="mt-1 text-sm text-black/70">
          National Dex #{entry.nationalDexNumber} | Regional Dex #{entry.regionalDexNumber}
        </p>
        <p className="mt-1 text-sm text-black/65">{entry.generationLabel}</p>
        <div className="mt-3">
          <WikiTagList tags={entry.tags} />
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Core Data
        </h2>
        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
            Types: {entry.types.join(", ")}
          </p>
          <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
            Abilities: {entry.abilities.map((ability) => ability.name).join(", ")}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Ability Slots
        </h2>
        <div className="mt-2 space-y-2 text-sm">
          {entry.abilities.map((ability) => (
            <p
              key={`${ability.name}-${ability.isHidden ? "hidden" : "regular"}`}
              className="rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-black/78"
            >
              {ability.name}
              {ability.isHidden ? " (Hidden Ability)" : ""}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Base Stats
        </h2>
        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {entry.baseStats.map((stat) => (
            <p
              key={stat.stat}
              className="rounded-lg border border-black/20 bg-white/70 px-3 py-2"
            >
              {stat.stat}: {stat.value}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Evolution Chain
        </h2>
        <div className="mt-2 space-y-2 text-sm">
          {entry.evolutionChain.map((stage) => (
            <p
              key={`${stage.stage}-${stage.method}`}
              className="rounded-lg border border-black/20 bg-white/70 px-3 py-2"
            >
              {stage.stage} - {stage.method}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Weakness / Resistance Table
        </h2>
        <div className="mt-2 space-y-2 text-sm">
          {entry.weaknessResistanceTable.map((row) => (
            <p
              key={row.label}
              className="rounded-lg border border-black/20 bg-white/70 px-3 py-2"
            >
              {row.label}: {row.values.join(", ")}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Moves by Learn Method
        </h2>
        <div className="mt-2 space-y-2 text-sm">
          {entry.moveBuckets.map((bucket) => (
            <p
              key={bucket.method}
              className="rounded-lg border border-black/20 bg-white/70 px-3 py-2"
            >
              {bucket.method}: {bucket.moves.join(", ")}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Locations by Game
        </h2>
        <div className="mt-2 space-y-2 text-sm">
          {entry.locationsByGame.map((location) => (
            <p
              key={location.game}
              className="rounded-lg border border-black/20 bg-white/70 px-3 py-2"
            >
              {location.game}: {location.areas.join(", ")}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Sprites & Art
        </h2>
        <div className="mt-2 space-y-2 text-sm">
          {entry.mediaEntries.map((media) => (
            <p
              key={media.label}
              className="rounded-lg border border-black/20 bg-white/70 px-3 py-2"
            >
              {media.label}: {media.value}
            </p>
          ))}
        </div>
      </section>

      <ReferencesBlock references={entry.references} />
    </article>
  );
}

