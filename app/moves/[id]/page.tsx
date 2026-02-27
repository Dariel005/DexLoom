import type { Metadata } from "next";
import Link from "next/link";
import { MovePageTemplate } from "@/components/templates/MovePageTemplate";
import { PokedexFrame } from "@/components/PokedexFrame";
import { ReferencesBlock } from "@/components/wiki/ReferencesBlock";
import { fetchPokemonMoveDetail } from "@/lib/pokeapi";
import { formatLabel } from "@/lib/utils";

interface MoveDetailPageProps {
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

export function generateMetadata({ params }: MoveDetailPageProps): Metadata {
  const label = formatLabel(params.id);
  return {
    title: `${label} Move Entry`,
    description: "Move entry with type, category, power, accuracy, PP, effect, and learner section."
  };
}

export default async function MoveDetailPage({ params }: MoveDetailPageProps) {
  const identifier = parseIdentifier(params.id);
  const fallbackLabel = formatLabel(String(params.id));

  const move = await fetchPokemonMoveDetail(identifier).catch(() => null);

  const leftPanel = (
    <MovePageTemplate
      data={{
        id: move ? String(move.id) : "{{MOVE_ID}}",
        name: move?.displayName ?? fallbackLabel,
        type: move?.type ?? "{{MOVE_TYPE}}",
        category: move?.damageClass ?? "{{MOVE_CATEGORY}}",
        power: move?.power === null || move?.power === undefined ? "N/A" : String(move.power),
        accuracy:
          move?.accuracy === null || move?.accuracy === undefined
            ? "N/A"
            : `${move.accuracy}%`,
        pp: move?.pp === null || move?.pp === undefined ? "N/A" : String(move.pp),
        effect:
          move?.shortEffect ??
          move?.effect ??
          move?.flavorText ??
          "{{MOVE_EFFECT_DESCRIPTION}}",
        learnedBy:
          move?.learnedByPokemon?.length
            ? move.learnedByPokemon.slice(0, 20)
            : ["{{POKEMON_1}}", "{{POKEMON_2}}"],
        tags: [
          "move",
          move?.type?.toLowerCase() ?? "unknown-type",
          move?.generation?.toLowerCase() ?? "unknown-generation"
        ],
        references: [
          move
            ? {
                label: "PokeAPI move endpoint",
                href: `https://pokeapi.co/api/v2/move/${move.id}`
              }
            : {
                label: "Move data fallback active. Fill placeholders after source sync."
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
            href="/moves"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Back to moves
          </Link>
          <Link
            href="/mechanics#type-effectiveness"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Type mechanics
          </Link>
        </div>
      </section>

      <ReferencesBlock
        references={[
          {
            label: "Learned-by section is prepped for full list expansion."
          }
        ]}
      />
    </section>
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: move?.displayName ?? fallbackLabel,
    about: ["pokemon move", move?.type ?? "unknown type"]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <PokedexFrame
          title={`${move?.displayName ?? fallbackLabel} - Move Encyclopedia`}
          status={move ? "success" : "idle"}
          leftPanel={leftPanel}
          rightPanel={rightPanel}
        />
      </main>
    </>
  );
}
