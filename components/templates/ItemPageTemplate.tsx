import { ReferencesBlock, type ReferenceEntry } from "@/components/wiki/ReferencesBlock";
import { WikiTagList } from "@/components/wiki/WikiTagList";

export interface ItemPageTemplateData {
  id: string;
  name: string;
  category: string;
  effect: string;
  obtainMethod: string;
  price: string;
  tags: string[];
  references?: ReferenceEntry[];
}

const DEFAULT_ITEM_DATA: ItemPageTemplateData = {
  id: "{{ITEM_ID}}",
  name: "{{ITEM_NAME}}",
  category: "{{ITEM_CATEGORY}}",
  effect: "{{ITEM_EFFECT}}",
  obtainMethod: "{{HOW_TO_OBTAIN}}",
  price: "{{ITEM_PRICE}}",
  tags: ["item", "{{CATEGORY_TAG}}", "{{GENERATION_TAG}}"]
};

interface ItemPageTemplateProps {
  data?: Partial<ItemPageTemplateData>;
}

function mergeItemData(data: Partial<ItemPageTemplateData> | undefined): ItemPageTemplateData {
  return {
    ...DEFAULT_ITEM_DATA,
    ...data,
    tags: data?.tags ?? DEFAULT_ITEM_DATA.tags,
    references: data?.references ?? DEFAULT_ITEM_DATA.references
  };
}

export function ItemPageTemplate({ data }: ItemPageTemplateProps) {
  const entry = mergeItemData(data);

  return (
    <article className="space-y-4">
      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/65">
          Item Entry Template
        </p>
        <h1 className="pixel-font mt-2 text-[14px] uppercase tracking-[0.12em] text-black/85">
          {entry.name}
        </h1>
        <p className="mt-1 text-sm text-black/70">Item #{entry.id}</p>
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
            Category: {entry.category}
          </p>
          <p className="rounded-lg border border-black/20 bg-white/70 px-3 py-2">
            Price: {entry.price}
          </p>
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
          How To Obtain
        </h2>
        <p className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/78">
          {entry.obtainMethod}
        </p>
      </section>

      <ReferencesBlock references={entry.references} />
    </article>
  );
}

