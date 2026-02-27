import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type ReactNode } from "react";
import { FavoriteStarButton } from "@/components/FavoriteStarButton";
import { PokedexFrame } from "@/components/PokedexFrame";
import { StatChart } from "@/components/StatChart";
import { TypeBadge } from "@/components/TypeBadge";
import {
  MEGA_EVOLUTION_INDEX,
  getMegaEvolutionBySlug
} from "@/lib/mega-evolutions-encyclopedia";
import { resolveMegaModelUrls } from "@/lib/pokemon-3d";
import { getMegaStoneByItem } from "@/lib/mega-stones-encyclopedia";
import { fetchPokemonAbilityDetail, fetchPokemonTypeDetail } from "@/lib/pokeapi";
import { type PokemonStat, type PokemonTypeEffectiveness } from "@/types/pokemon";

interface MegaEvolutionDetailPageProps {
  params: {
    slug: string;
  };
}

const PokemonTypeWeaknessGrid = dynamic(
  () =>
    import("@/components/PokemonTypeWeaknessGrid").then(
      (module) => module.PokemonTypeWeaknessGrid
    ),
  {
    loading: () => (
      <div className="rounded-2xl border border-black/20 bg-white/45 p-3 text-sm text-black/65">
        Loading weakness calculator...
      </div>
    )
  }
);

const PokemonModelViewer = dynamic(
  () =>
    import("@/components/PokemonModelViewer").then(
      (module) => module.PokemonModelViewer
    ),
  {
    loading: () => (
      <div className="rounded-2xl border border-black/20 bg-white/45 p-3 text-sm text-black/65">
        Loading 3D viewer...
      </div>
    )
  }
);

const TYPE_ORDER = [
  "Normal",
  "Fire",
  "Water",
  "Electric",
  "Grass",
  "Ice",
  "Fighting",
  "Poison",
  "Ground",
  "Flying",
  "Psychic",
  "Bug",
  "Rock",
  "Ghost",
  "Dragon",
  "Dark",
  "Steel",
  "Fairy"
] as const;

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function toAbilitySlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function truncateText(value: string, maxLength = 165) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}...`;
}

function createTypeEffectiveness(): PokemonTypeEffectiveness {
  return {
    fourTimesWeak: [],
    doubleWeak: [],
    neutral: [],
    halfResistant: [],
    quarterResistant: [],
    immune: []
  };
}

function toMegaStats(entry: NonNullable<ReturnType<typeof getMegaEvolutionBySlug>>): PokemonStat[] {
  return [
    { name: "HP", baseStat: entry.stats.hp },
    { name: "Attack", baseStat: entry.stats.attack },
    { name: "Defense", baseStat: entry.stats.defense },
    { name: "Special Attack", baseStat: entry.stats.specialAttack },
    { name: "Special Defense", baseStat: entry.stats.specialDefense },
    { name: "Speed", baseStat: entry.stats.speed }
  ];
}

function summarizeStatIdentity(stats: PokemonStat[]) {
  const ordered = stats.slice().sort((a, b) => b.baseStat - a.baseStat);
  const top = ordered[0];
  const secondary = ordered[1];
  const low = ordered[ordered.length - 1];

  if (!top || !secondary || !low) {
    return {
      title: "Balanced Mega Profile",
      description: "Stats are distributed without an extreme spike."
    };
  }

  return {
    title: `${top.name} Core Pressure`,
    description: `This mega is driven by ${top.name} (${top.baseStat}) with ${secondary.name} (${secondary.baseStat}) support, while ${low.name} (${low.baseStat}) is the main trade-off.`
  };
}

async function getMegaTypeEffectiveness(types: string[]): Promise<PokemonTypeEffectiveness> {
  if (types.length === 0) {
    return createTypeEffectiveness();
  }

  const uniqueTypes = Array.from(new Set(types.map((type) => normalize(type)).filter(Boolean)));
  const typeDetails = await Promise.all(
    uniqueTypes.map(async (type) => {
      try {
        return await fetchPokemonTypeDetail(type);
      } catch {
        return null;
      }
    })
  );

  const validDetails = typeDetails.filter((detail) => Boolean(detail));
  if (validDetails.length === 0) {
    return createTypeEffectiveness();
  }

  const effectiveness = createTypeEffectiveness();

  TYPE_ORDER.forEach((defenderType) => {
    const target = normalize(defenderType);
    let multiplier = 1;

    validDetails.forEach((detail) => {
      if (!detail) {
        return;
      }

      if (detail.noDamageFrom.some((type) => normalize(type) === target)) {
        multiplier = 0;
        return;
      }
      if (detail.doubleDamageFrom.some((type) => normalize(type) === target)) {
        multiplier *= 2;
      }
      if (detail.halfDamageFrom.some((type) => normalize(type) === target)) {
        multiplier *= 0.5;
      }
    });

    if (multiplier === 0) {
      effectiveness.immune.push(defenderType);
    } else if (multiplier >= 4) {
      effectiveness.fourTimesWeak.push(defenderType);
    } else if (multiplier > 1) {
      effectiveness.doubleWeak.push(defenderType);
    } else if (multiplier <= 0.25) {
      effectiveness.quarterResistant.push(defenderType);
    } else if (multiplier < 1) {
      effectiveness.halfResistant.push(defenderType);
    } else {
      effectiveness.neutral.push(defenderType);
    }
  });

  return effectiveness;
}

function DetailSection({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="mega-full-section rounded-2xl border border-black/25 bg-white/60 p-4">
      <div className="mb-3">
        <h2 className="pixel-font text-[11px] uppercase tracking-wide text-black/75">
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-sm text-black/60">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function generateStaticParams() {
  return MEGA_EVOLUTION_INDEX.map((entry) => ({ slug: entry.slug }));
}

export function generateMetadata({ params }: MegaEvolutionDetailPageProps): Metadata {
  const entry = getMegaEvolutionBySlug(params.slug);
  if (!entry) {
    return {
      title: "Mega Evolution Not Found",
      description: "The requested Mega Evolution entry is not available."
    };
  }

  const title = `${entry.megaName}: mega stats, ability and battle profile`;
  const description = truncateText(
    `${entry.megaName} mega profile. Types: ${entry.types.join(", ")}. Ability: ${entry.ability}. Activation item: ${entry.activationItem}.`
  );

  return {
    title,
    description,
    openGraph: {
      title: `${title} | DexLoom`,
      description,
      type: "article",
      images: [{ url: entry.imageSrc, width: 1200, height: 1200, alt: entry.imageAlt }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | DexLoom`,
      description,
      images: [entry.imageSrc]
    }
  };
}

export default async function MegaEvolutionDetailPage({ params }: MegaEvolutionDetailPageProps) {
  const entry = getMegaEvolutionBySlug(params.slug);
  if (!entry) {
    notFound();
  }

  const [megaTypeEffectiveness, megaAbilityDetail, megaModelUrls] = await Promise.all([
    getMegaTypeEffectiveness(entry.types),
    fetchPokemonAbilityDetail(toAbilitySlug(entry.ability)).catch(() => null),
    resolveMegaModelUrls(entry.baseDexNumber, entry.megaName).catch(() => ({
      regularUrl: null,
      shinyUrl: null
    }))
  ]);

  const megaStats = toMegaStats(entry);
  const stoneIntel = getMegaStoneByItem(entry.activationItem);
  const statIdentity = summarizeStatIdentity(megaStats);
  const counterpartMegas = MEGA_EVOLUTION_INDEX.filter(
    (mega) => mega.baseSpecies === entry.baseSpecies && mega.slug !== entry.slug
  );
  const topStats = megaStats.slice().sort((a, b) => b.baseStat - a.baseStat).slice(0, 3);

  const megaAbilitySummary =
    megaAbilityDetail?.shortEffect ??
    megaAbilityDetail?.effect ??
    `${entry.ability} is the active ability for this mega form.`;

  const detailSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${entry.megaName} full mega data encyclopedia entry`,
    description: entry.profileSummary,
    image: entry.imageSrc,
    about: [entry.megaName, "mega evolution", entry.baseSpecies]
  };

  const leftPanel = (
    <article className="mega-full-column relative z-10 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/mega-evolutions"
          className="pixel-font inline-flex rounded-lg border border-black/30 bg-black/10 px-3 py-2 text-[10px] uppercase tracking-wide transition hover:bg-black/15"
        >
          Back to mega index
        </Link>
      </div>

      <DetailSection title="Mega Profile" subtitle={`${entry.debutGeneration} | ${entry.baseSpecies}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="pixel-font text-[10px] uppercase tracking-wide text-black/65">
              Mega Dex #{entry.dexNumber}
            </p>
            <h1 className="pixel-font mt-1 text-[15px] uppercase tracking-wide text-black/90">
              {entry.megaName}
            </h1>
            <p className="mt-1 text-sm text-black/70">{entry.battleRole}</p>
            <p className="mt-1 text-xs text-black/65">Region: {entry.region}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {entry.types.map((type) => (
              <TypeBadge key={`mega-type-${type}`} type={type} />
            ))}
          </div>
        </div>

        <div className="mega-full-art-shell mt-4 rounded-2xl border border-black/20 bg-white/45 p-3">
          <div className="relative mx-auto h-[320px] w-full max-w-[420px]">
            <Image
              src={entry.imageSrc}
              alt={entry.imageAlt}
              fill
              sizes="(min-width: 1024px) 420px, 88vw"
              className="mega-full-art object-contain drop-shadow-[0_12px_26px_rgba(0,0,0,0.35)]"
              priority
            />
          </div>
        </div>
      </DetailSection>

      <DetailSection title="Battle Data" subtitle={`Base stat total: ${entry.baseStatTotal}`}>
        <StatChart stats={megaStats} />
      </DetailSection>

      <DetailSection title="Type Weakness Calculator">
        <PokemonTypeWeaknessGrid effectiveness={megaTypeEffectiveness} />
      </DetailSection>

      <DetailSection title="3D Viewer" subtitle="Loads mega model when this form has a 3D asset.">
        <PokemonModelViewer
          pokemonId={entry.baseDexNumber}
          pokemonName={entry.megaName}
          fallbackImage={entry.imageSrc}
          modelOverride={{
            regularUrl:
              megaModelUrls.regularUrl ??
              `https://raw.githubusercontent.com/Pokemon-3D-api/assets/refs/heads/main/models/opt/mega/${entry.baseDexNumber}.glb`,
            shinyUrl:
              megaModelUrls.shinyUrl ??
              `https://raw.githubusercontent.com/Pokemon-3D-api/assets/refs/heads/main/models/opt/megaShiny/${entry.baseDexNumber}.glb`,
            sourceLabel: "Pokemon-3D API mega catalog (with direct mega fallback)"
          }}
        />
      </DetailSection>
    </article>
  );

  const rightPanel = (
    <article className="mega-full-column space-y-4">
      <DetailSection title="Mega Technical Infobox">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
            Mega Name: <span className="font-semibold">{entry.megaName}</span>
          </p>
          <p className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
            Mega ID: <span className="font-semibold">{entry.dexNumber}</span>
          </p>
          <p className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
            Base Species: <span className="font-semibold">{entry.baseSpecies}</span>
          </p>
          <p className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
            Activation Item: <span className="font-semibold">{entry.activationItem}</span>
          </p>
          <p className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
            Mega Ability: <span className="font-semibold">{entry.ability}</span>
          </p>
          <p className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
            Debut: <span className="font-semibold">{entry.debutGeneration}</span>
          </p>
          <p className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
            Region: <span className="font-semibold">{entry.region}</span>
          </p>
          <p className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
            Battle Role: <span className="font-semibold">{entry.battleRole}</span>
          </p>
        </div>
      </DetailSection>

      {stoneIntel ? (
        <DetailSection title="Mega Stone Acquisition">
          <article className="space-y-2">
            <p className="rounded-lg border border-black/20 bg-white/55 px-3 py-2 text-sm text-black/76">
              {stoneIntel.description}
            </p>
            {stoneIntel.acquisition.map((step) => (
              <p
                key={`${entry.slug}-${step}`}
                className="rounded-lg border border-black/20 bg-white/55 px-3 py-2 text-sm text-black/76"
              >
                {step}
              </p>
            ))}
            {stoneIntel.availabilityNote ? (
              <p className="rounded-lg border border-black/20 bg-black/[0.05] px-3 py-2 text-xs text-black/67">
                {stoneIntel.availabilityNote}
              </p>
            ) : null}
          </article>
        </DetailSection>
      ) : null}

      <DetailSection title="Ability Briefing">
        <article className="rounded-xl border border-black/20 bg-white/55 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="pixel-font text-[10px] uppercase tracking-wide text-black/80">
              {entry.ability}
            </p>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-md border border-black/20 bg-black/5 px-2 py-0.5">
                Mega Ability
              </span>
              {megaAbilityDetail?.generation ? (
                <span className="rounded-md border border-black/20 bg-black/5 px-2 py-0.5">
                  {megaAbilityDetail.generation}
                </span>
              ) : null}
            </div>
          </div>
          <p className="mt-2 text-sm text-black/75">{megaAbilitySummary}</p>
        </article>
      </DetailSection>

      <DetailSection title="Stat Leadership">
        <div className="space-y-2">
          {topStats.map((stat, index) => (
            <div
              key={stat.name}
              className="flex items-center justify-between rounded-lg border border-black/20 bg-white/60 px-3 py-2 text-sm"
            >
              <p className="pixel-font text-[10px] uppercase tracking-wide text-black/75">
                #{index + 1} {stat.name}
              </p>
              <p className="font-semibold text-black/85">{stat.baseStat}</p>
            </div>
          ))}
          <p className="rounded-lg border border-black/20 bg-white/45 px-3 py-2 text-sm text-black/70">
            {statIdentity.description}
          </p>
        </div>
      </DetailSection>

      <DetailSection title="Mega Tactical Profile" subtitle={statIdentity.title}>
        <p className="text-sm leading-relaxed text-black/76">{entry.profileSummary}</p>
      </DetailSection>

      {counterpartMegas.length > 0 ? (
        <DetailSection title="Alternate Mega Forms">
          <div className="space-y-2">
            {counterpartMegas.map((counterpart) => (
              <Link
                key={`counterpart-${counterpart.slug}`}
                href={`/mega-evolutions/${counterpart.slug}`}
                className="block rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm text-black/76 transition hover:border-[var(--theme-accent)] hover:bg-[var(--theme-accent-soft)]"
              >
                {counterpart.megaName}
              </Link>
            ))}
          </div>
        </DetailSection>
      ) : null}

      <DetailSection title="Navigation">
        <div className="mt-2 flex flex-wrap gap-2">
          <FavoriteStarButton
            favorite={{
              entityType: "mega",
              entityId: entry.slug,
              title: entry.megaName,
              href: `/mega-evolutions/${entry.slug}`,
              imageUrl: entry.imageSrc,
              subtitle: `${entry.debutGeneration} (${entry.region})`,
              tags: ["mega", ...entry.types.map((type) => type.toLowerCase())]
            }}
            showLabel
          />
          <Link
            href="/"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Back to Pokedex
          </Link>
          <Link
            href="/mega-evolutions"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Mega index
          </Link>
          <Link
            href="/mega-evolutions/stones"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Mega stones
          </Link>
        </div>
      </DetailSection>
    </article>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(detailSchema) }}
      />
      <main className="pokemon-detail-page mega-full-immersive-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <div className="relative z-[1]">
          <PokedexFrame
            title={`${entry.megaName} - Full Data Encyclopedia`}
            status="success"
            leftPanel={leftPanel}
            rightPanel={rightPanel}
          />
        </div>
      </main>
    </>
  );
}
