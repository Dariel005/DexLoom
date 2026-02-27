import type { Metadata } from "next";
import Link from "next/link";
import { ItemPageTemplate } from "@/components/templates/ItemPageTemplate";
import { PokedexFrame } from "@/components/PokedexFrame";
import { ReferencesBlock } from "@/components/wiki/ReferencesBlock";
import { formatCost, resolveSectionLabel } from "@/lib/items-encyclopedia";
import { fetchPokemonItemDetail } from "@/lib/pokeapi";
import { formatLabel } from "@/lib/utils";

interface ItemDetailPageProps {
  params: {
    id: string;
  };
}

function parseIdentifier(value: string): string | number {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }
  return value;
}

export function generateMetadata({ params }: ItemDetailPageProps): Metadata {
  const label = formatLabel(params.id);
  return {
    title: `${label} Item Entry`,
    description:
      "Item entry with effect, obtain method structure, price field, and category classification."
  };
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const identifier = parseIdentifier(params.id);
  const fallbackLabel = formatLabel(String(params.id));

  const item = await fetchPokemonItemDetail(identifier).catch(() => null);

  const leftPanel = (
    <ItemPageTemplate
      data={{
        id: item ? String(item.id) : "{{ITEM_ID}}",
        name: item?.displayName ?? fallbackLabel,
        category:
          item?.category ??
          (item
            ? resolveSectionLabel({
                name: item.name,
                pocketKey: item.pocketKey,
                categoryKey: item.categoryKey
              })
            : "{{ITEM_CATEGORY}}"),
        effect:
          item?.shortEffect ?? item?.effect ?? item?.flavorText ?? "{{ITEM_EFFECT}}",
        obtainMethod:
          item?.availabilityVersions?.length
            ? `Appears in: ${item.availabilityVersions.slice(0, 8).join(", ")}`
            : "{{HOW_TO_OBTAIN}}",
        price: item ? formatCost(item.cost) : "{{ITEM_PRICE}}",
        tags: [
          "item",
          item?.pocketKey ?? "unknown-pocket",
          item?.categoryKey ?? "unknown-category"
        ],
        references: [
          item
            ? {
                label: "PokeAPI item endpoint",
                href: `https://pokeapi.co/api/v2/item/${item.id}`
              }
            : {
                label: "Item data fallback active. Fill placeholders after source sync."
              }
        ]
      }}
    />
  );

  const rightPanel = (
    <section className="space-y-4">
      <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Entry Navigation
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href="/"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Back to Pokedex
          </Link>
          <Link
            href="/items"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Back to items
          </Link>
        </div>
      </section>

      <ReferencesBlock
        references={[
          {
            label: "Obtain-method text is ready for route/shop/event source expansion."
          }
        ]}
      />
    </section>
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: item?.displayName ?? fallbackLabel,
    about: ["pokemon item", item?.category ?? "unknown category"]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <PokedexFrame
          title={`${item?.displayName ?? fallbackLabel} - Item Encyclopedia`}
          status={item ? "success" : "idle"}
          leftPanel={leftPanel}
          rightPanel={rightPanel}
        />
      </main>
    </>
  );
}
