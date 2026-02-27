import { ReferencesBlock, type ReferenceEntry } from "@/components/wiki/ReferencesBlock";
import { WikiTagList } from "@/components/wiki/WikiTagList";

export interface AbilityPageTemplateData {
  id: string;
  name: string;
  effect: string;
  pokemonList: string[];
  tags: string[];
  references?: ReferenceEntry[];
}

const DEFAULT_ABILITY_DATA: AbilityPageTemplateData = {
  id: "{{ABILITY_ID}}",
  name: "{{ABILITY_NAME}}",
  effect: "{{ABILITY_EFFECT}}",
  pokemonList: ["{{POKEMON_1}}", "{{POKEMON_2}}"],
  tags: ["ability", "{{GENERATION_TAG}}", "{{BATTLE_TAG}}"]
};

interface AbilityPageTemplateProps {
  data?: Partial<AbilityPageTemplateData>;
}

function mergeAbilityData(
  data: Partial<AbilityPageTemplateData> | undefined
): AbilityPageTemplateData {
  return {
    ...DEFAULT_ABILITY_DATA,
    ...data,
    pokemonList: data?.pokemonList ?? DEFAULT_ABILITY_DATA.pokemonList,
    tags: data?.tags ?? DEFAULT_ABILITY_DATA.tags,
    references: data?.references ?? DEFAULT_ABILITY_DATA.references
  };
}

export function AbilityPageTemplate({ data }: AbilityPageTemplateProps) {
  const entry = mergeAbilityData(data);

  return (
    <article className="space-y-4">
      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/65">
          Ability Entry Template
        </p>
        <h1 className="pixel-font mt-2 text-[14px] uppercase tracking-[0.12em] text-black/85">
          {entry.name}
        </h1>
        <p className="mt-1 text-sm text-black/70">Ability #{entry.id}</p>
        <div className="mt-3">
          <WikiTagList tags={entry.tags} />
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Effect
        </h2>
        <p className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/78">
          {entry.effect}
        </p>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Pokemon That Can Have This Ability
        </h2>
        <div className="mt-2 space-y-2 text-sm">
          {entry.pokemonList.map((pokemonName) => (
            <p
              key={pokemonName}
              className="rounded-lg border border-black/20 bg-white/70 px-3 py-2"
            >
              {pokemonName}
            </p>
          ))}
        </div>
      </section>

      <ReferencesBlock references={entry.references} />
    </article>
  );
}

