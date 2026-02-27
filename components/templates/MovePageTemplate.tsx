import { ReferencesBlock, type ReferenceEntry } from "@/components/wiki/ReferencesBlock";
import { WikiTagList } from "@/components/wiki/WikiTagList";

export interface MovePageTemplateData {
  id: string;
  name: string;
  type: string;
  category: string;
  power: string;
  accuracy: string;
  pp: string;
  effect: string;
  learnedBy: string[];
  tags: string[];
  references?: ReferenceEntry[];
}

const DEFAULT_MOVE_DATA: MovePageTemplateData = {
  id: "{{MOVE_ID}}",
  name: "{{MOVE_NAME}}",
  type: "{{MOVE_TYPE}}",
  category: "{{MOVE_CATEGORY}}",
  power: "{{POWER}}",
  accuracy: "{{ACCURACY}}",
  pp: "{{PP}}",
  effect: "{{MOVE_EFFECT_DESCRIPTION}}",
  learnedBy: ["{{POKEMON_1}}", "{{POKEMON_2}}"],
  tags: ["move", "{{GENERATION_TAG}}", "{{TYPE_TAG}}"]
};

interface MovePageTemplateProps {
  data?: Partial<MovePageTemplateData>;
}

function mergeMoveData(data: Partial<MovePageTemplateData> | undefined): MovePageTemplateData {
  return {
    ...DEFAULT_MOVE_DATA,
    ...data,
    learnedBy: data?.learnedBy ?? DEFAULT_MOVE_DATA.learnedBy,
    tags: data?.tags ?? DEFAULT_MOVE_DATA.tags,
    references: data?.references ?? DEFAULT_MOVE_DATA.references
  };
}

export function MovePageTemplate({ data }: MovePageTemplateProps) {
  const entry = mergeMoveData(data);

  return (
    <article className="space-y-4">
      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/65">
          Move Entry Template
        </p>
        <h1 className="pixel-font mt-2 text-[14px] uppercase tracking-[0.12em] text-black/85">
          {entry.name}
        </h1>
        <p className="mt-1 text-sm text-black/70">Move #{entry.id}</p>
        <div className="mt-3">
          <WikiTagList tags={entry.tags} />
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Core Battle Data
        </h2>
        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">Type: {entry.type}</p>
          <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
            Category: {entry.category}
          </p>
          <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
            Power: {entry.power}
          </p>
          <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
            Accuracy: {entry.accuracy}
          </p>
          <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">PP: {entry.pp}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Effect / Description
        </h2>
        <p className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/78">
          {entry.effect}
        </p>
      </section>

      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Learned By
        </h2>
        <div className="mt-2 space-y-2 text-sm">
          {entry.learnedBy.map((pokemonName) => (
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

