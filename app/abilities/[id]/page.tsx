import type { Metadata } from "next";
import Link from "next/link";
import { AbilityPageTemplate } from "@/components/templates/AbilityPageTemplate";
import { PokedexFrame } from "@/components/PokedexFrame";
import { ReferencesBlock } from "@/components/wiki/ReferencesBlock";
import { fetchPokemonAbilityDetail } from "@/lib/pokeapi";
import { formatLabel } from "@/lib/utils";

interface AbilityDetailPageProps {
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

export function generateMetadata({ params }: AbilityDetailPageProps): Metadata {
  const label = formatLabel(params.id);
  return {
    title: `${label} Ability Entry`,
    description: "Ability entry with effect description and Pokemon compatibility list."
  };
}

export default async function AbilityDetailPage({ params }: AbilityDetailPageProps) {
  const identifier = parseIdentifier(params.id);
  const fallbackLabel = formatLabel(String(params.id));

  const ability = await fetchPokemonAbilityDetail(identifier).catch(() => null);

  const leftPanel = (
    <AbilityPageTemplate
      data={{
        id: ability ? String(ability.id) : "{{ABILITY_ID}}",
        name: ability?.displayName ?? fallbackLabel,
        effect:
          ability?.shortEffect ??
          ability?.effect ??
          ability?.flavorText ??
          "{{ABILITY_EFFECT}}",
        pokemonList:
          ability?.pokemonSample?.length
            ? ability.pokemonSample.map((entry) => entry.name).slice(0, 20)
            : ["{{POKEMON_1}}", "{{POKEMON_2}}"],
        tags: [
          "ability",
          ability?.generation?.toLowerCase() ?? "unknown-generation",
          ability?.isMainSeries ? "main-series" : "special"
        ],
        references: [
          ability
            ? {
                label: "PokeAPI ability endpoint",
                href: `https://pokeapi.co/api/v2/ability/${ability.id}`
              }
            : {
                label: "Ability data fallback active. Fill placeholders after source sync."
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
            href="/abilities"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Back to abilities
          </Link>
          <Link
            href="/pokemon-go"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Pokemon GO
          </Link>
        </div>
      </section>

      <ReferencesBlock
        references={[
          {
            label: "Pokemon list is shown as sample and can be expanded per version."
          }
        ]}
      />
    </section>
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: ability?.displayName ?? fallbackLabel,
    about: ["pokemon ability", ability?.generation ?? "unknown generation"]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <PokedexFrame
          title={`${ability?.displayName ?? fallbackLabel} - Ability Encyclopedia`}
          status={ability ? "success" : "idle"}
          leftPanel={leftPanel}
          rightPanel={rightPanel}
        />
      </main>
    </>
  );
}
