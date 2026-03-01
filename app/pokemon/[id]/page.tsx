import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type ReactNode } from "react";
import { FavoriteStarButton } from "@/components/FavoriteStarButton";
import { MobileDexBottomNav } from "@/components/MobileDexBottomNav";
import { PokedexFrame } from "@/components/PokedexFrame";
import { StatChart } from "@/components/StatChart";
import { TypeBadge } from "@/components/TypeBadge";
import { EncyclopediaDataTable } from "@/components/EncyclopediaDataTable";
import {
  fetchPokemonData,
  fetchPokemonIndex,
  fetchPokemonSummary,
  isPokemonNotFoundError
} from "@/lib/pokeapi";

interface PokemonDetailPageProps {
  params: {
    id: string;
  };
}

const PokemonSpriteToggle = dynamic(
  () =>
    import("@/components/PokemonSpriteToggle").then((module) => module.PokemonSpriteToggle),
  {
    loading: () => (
      <div className="rounded-2xl border border-black/20 bg-white/45 p-3 text-sm text-black/65">
        Loading sprite module...
      </div>
    )
  }
);

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

const PokemonGameDataPanel = dynamic(
  () =>
    import("@/components/PokemonGameDataPanel").then(
      (module) => module.PokemonGameDataPanel
    ),
  {
    loading: () => (
      <div className="rounded-2xl border border-black/20 bg-white/45 p-3 text-sm text-black/65">
        Loading game data panel...
      </div>
    )
  }
);

const EvolutionChain = dynamic(
  () => import("@/components/EvolutionChain").then((module) => module.EvolutionChain),
  {
    loading: () => (
      <div className="rounded-2xl border border-black/20 bg-white/45 p-3 text-sm text-black/65">
        Loading evolution data...
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

const CryButton = dynamic(
  () => import("@/components/CryButton").then((module) => module.CryButton),
  {
    loading: () => (
      <p className="text-sm text-black/65">Loading audio module...</p>
    )
  }
);

function getArtworkUrl(id: number, url: string | null) {
  return (
    url ??
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
  );
}

function getShinyArtworkUrl(
  id: number,
  primaryShiny: string | null,
  fallbackGalleryUrls: string[]
) {
  if (primaryShiny) {
    return primaryShiny;
  }

  const shinyFromGallery = fallbackGalleryUrls.find((url) =>
    url.toLowerCase().includes("/shiny/")
  );
  if (shinyFromGallery) {
    return shinyFromGallery;
  }

  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`;
}

function truncateText(value: string, maxLength = 165) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}...`;
}

function formatGenderInfo(genderRate: number) {
  if (genderRate === -1) {
    return "Genderless";
  }
  const female = genderRate * 12.5;
  const male = Math.max(0, 100 - female);
  return `M ${male.toFixed(1)}% / F ${female.toFixed(1)}%`;
}

function estimateHatchSteps(hatchCounter: number) {
  return (hatchCounter + 1) * 255;
}

function DetailSection({
  title,
  subtitle,
  children,
  className
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`pokemon-full-data-section rounded-2xl border border-black/25 bg-white/60 p-4 ${className ?? ""}`}>
      <div className="pokemon-full-data-section-head mb-3">
        <h2 className="pokemon-full-data-section-title pixel-font text-[11px] uppercase tracking-wide text-black/75">
          {title}
        </h2>
        {subtitle ? (
          <p className="pokemon-full-data-section-subtitle mt-1 text-sm text-black/60">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}


export const revalidate = 86400; // 24 hours

export async function generateStaticParams() {
  const pokemon = await fetchPokemonIndex(151);
  return pokemon.map((entry) => ({ id: String(entry.id) }));
}

export async function generateMetadata({
  params
}: PokemonDetailPageProps): Promise<Metadata> {
  try {
    const pokemon = await fetchPokemonSummary(params.id);
    const title = `${pokemon.displayName}: datos completos, stats, evoluciones y movimientos`;
    const description = truncateText(
      `${pokemon.displayName} en ${pokemon.generation}. Tipos: ${pokemon.types.join(", ")}. Entrada completa con stats, evoluciones, movimientos y datos tecnicos.`
    );
    const image = getArtworkUrl(pokemon.id, pokemon.artwork);

    return {
      title,
      description,
      openGraph: {
        title: `${title} | DexLoom`,
        description,
        type: "article",
        images: [{ url: image, width: 1200, height: 1200, alt: pokemon.name }]
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | DexLoom`,
        description,
        images: [image]
      }
    };
  } catch (error) {
    if (isPokemonNotFoundError(error)) {
      return {
        title: "Pokemon Not Found",
        description: "The requested Pokemon does not exist in this Pokedex."
      };
    }
    return {
      title: "Pokemon Detail",
      description: "Explore complete Pokemon data, movesets, breeding and battle stats."
    };
  }
}

export default async function PokemonDetailPage({
  params
}: PokemonDetailPageProps) {
  try {
    const pokemon = await fetchPokemonData(params.id);
    const artwork = getArtworkUrl(pokemon.id, pokemon.sprites.officialArtwork);
    const shinyArtwork = getShinyArtworkUrl(
      pokemon.id,
      pokemon.sprites.officialArtworkShiny ??
      pokemon.sprites.homeShiny ??
      pokemon.sprites.frontShiny,
      pokemon.spriteGallery.map((entry) => entry.url)
    );
    const primaryJapanese =
      pokemon.names.find((entry) => entry.language === "ja-Hrkt")?.name ??
      pokemon.names.find((entry) => entry.language === "ja")?.name ??
      null;
    const romajiName =
      pokemon.names.find((entry) => entry.language === "roomaji")?.name ?? null;
    const englishName =
      pokemon.names.find((entry) => entry.language === "en")?.name ?? pokemon.name;
    const evYieldSummary =
      pokemon.evYield.length > 0
        ? pokemon.evYield.map((entry) => `+${entry.value} ${entry.stat}`).join(", ")
        : "None";
    const hatchSteps = estimateHatchSteps(pokemon.hatchCounter);

    const detailSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `Complete entry for ${pokemon.name}`,
      description: pokemon.description,
      about: pokemon.name,
      keywords: [
        pokemon.name,
        "pokemon wiki",
        "pokemon stats",
        "pokemon evolution",
        "pokemon moves"
      ]
    };

    const leftPanel = (
      <article className="pokemon-full-data-left relative z-10 space-y-4">
        <div className="pokemon-full-data-toolbar flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/"
            className="pokemon-full-data-back pixel-font inline-flex rounded-lg border border-black/30 bg-black/10 px-3 py-2 text-[10px] uppercase tracking-wide transition hover:bg-black/15"
          >
            Back to index
          </Link>
        </div>

        <DetailSection
          title="Data Terminal"
          subtitle={`${pokemon.generation} | ${pokemon.speciesName}`}
          className="pokemon-full-data-section-profile"
        >
          <div className="pokemon-full-data-hero">
            <div className="pokemon-full-data-hero-visual">
              <PokemonSpriteToggle
                pokemonId={pokemon.id}
                pokemonName={pokemon.name}
                normalSprite={artwork}
                shinySprite={shinyArtwork}
                priority
                className="pokemon-full-data-sprite-toggle"
              />
            </div>

            <div className="pokemon-full-data-hero-summary">
              <div className="pokemon-full-data-hero-copy">
                <p className="pokemon-full-data-dex pixel-font text-[10px] uppercase tracking-wide text-black/65">
                  #{pokemon.id.toString().padStart(4, "0")}
                </p>
                <h1 className="pokemon-full-data-name pixel-font mt-1 text-[15px] uppercase tracking-wide text-black/90">
                  {pokemon.name}
                </h1>
                <p className="pokemon-full-data-genus mt-1 text-sm text-black/70">{pokemon.genus}</p>
                <p className="pokemon-full-data-alt-name mt-1 text-xs text-black/60">
                  {primaryJapanese
                    ? `${primaryJapanese}${romajiName ? ` (${romajiName})` : ""}`
                    : englishName}
                </p>
              </div>
              <div className="pokemon-full-data-badges flex flex-wrap items-center gap-1.5">
                <FavoriteStarButton
                  favorite={{
                    entityType: "pokemon",
                    entityId: String(pokemon.id),
                    title: pokemon.name,
                    href: `/pokemon/${pokemon.id}`,
                    imageUrl: artwork,
                    subtitle: pokemon.speciesName,
                    tags: [
                      "pokemon",
                      pokemon.generationKey,
                      ...pokemon.types.map((type) => type.toLowerCase())
                    ]
                  }}
                />
                {pokemon.types.map((type) => (
                  <TypeBadge key={type} type={type} />
                ))}
              </div>
            </div>
          </div>

          <div className="pokemon-full-data-meta-grid mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <p className="pokemon-full-data-meta-card rounded-lg border border-black/20 bg-white/45 px-3 py-2">
              Height: {pokemon.height.toFixed(1)} m
            </p>
            <p className="pokemon-full-data-meta-card rounded-lg border border-black/20 bg-white/45 px-3 py-2">
              Weight: {pokemon.weight.toFixed(1)} kg
            </p>
            <p className="pokemon-full-data-meta-card rounded-lg border border-black/20 bg-white/45 px-3 py-2">
              Base Exp: {pokemon.baseExperience ?? "N/A"}
            </p>
            <p className="pokemon-full-data-meta-card rounded-lg border border-black/20 bg-white/45 px-3 py-2">
              Growth Rate: {pokemon.growthRate ?? "Unknown"}
            </p>
          </div>
        </DetailSection>

        <DetailSection
          title="Battle Data"
          subtitle={`Base stat total: ${pokemon.baseStatTotal}`}
          className="pokemon-full-data-section-stats"
        >
          <StatChart stats={pokemon.stats} tone="terminal" />
        </DetailSection>

        <DetailSection
          title="Type Weakness Calculator"
          className="pokemon-full-data-section-weakness"
        >
          <PokemonTypeWeaknessGrid effectiveness={pokemon.typeEffectiveness} />
        </DetailSection>

        <DetailSection
          title="Sprites Gallery"
          subtitle={`Available sprites: ${pokemon.spriteGallery.length}`}
          className="pokemon-full-data-section-gallery"
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {pokemon.spriteGallery.slice(0, 18).map((sprite) => (
              <div
                key={`${sprite.label}-${sprite.url}`}
                className="rounded-lg border border-black/20 bg-white/70 p-2"
              >
                <div className="relative mx-auto h-16 w-16">
                  <Image
                    src={sprite.url}
                    alt={`${pokemon.name} ${sprite.label}`}
                    fill
                    loading="lazy"
                    sizes="64px"
                    className="object-contain"
                    unoptimized={sprite.url.endsWith(".gif")}
                  />
                </div>
                <p className="mt-1 line-clamp-2 text-center text-[10px] text-black/65">
                  {sprite.label}
                </p>
              </div>
            ))}
          </div>
        </DetailSection>

        <DetailSection
          title="3D Viewer"
          subtitle="Interactive model view (rotate and zoom)"
          className="pokemon-full-data-section-model"
        >
          <PokemonModelViewer
            pokemonId={pokemon.id}
            pokemonName={pokemon.name}
            fallbackImage={artwork}
          />
        </DetailSection>
      </article>
    );

    const rightPanel = (
      <article className="pokemon-full-data-right space-y-4">
        <DetailSection
          title="Technical Infobox"
          subtitle="Core game data (quick access)"
          className="pokemon-full-data-section-tech"
        >
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
              Capture Rate: <span className="font-semibold">{pokemon.captureRate}</span>
            </p>
            <p className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
              Habitat: <span className="font-semibold">{pokemon.habitat ?? "Unknown"}</span>
            </p>
            <p className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
              EV Yield: <span className="font-semibold">{evYieldSummary}</span>
            </p>
            <p className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
              Hatch Counter: <span className="font-semibold">{pokemon.hatchCounter}</span>
            </p>
            <p className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
              Approx. Hatch Steps: <span className="font-semibold">{hatchSteps}</span>
            </p>
            <p className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
              Gender Ratio: <span className="font-semibold">{formatGenderInfo(pokemon.genderRate)}</span>
            </p>
            <p className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
              Egg Groups:{" "}
              <span className="font-semibold">{pokemon.eggGroups.join(", ") || "Unknown"}</span>
            </p>
            <p className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
              Base Happiness: <span className="font-semibold">{pokemon.baseHappiness}</span>
            </p>
          </div>
        </DetailSection>

        <DetailSection title="Abilities" className="pokemon-full-data-section-abilities">
          <div className="space-y-2">
            {pokemon.abilities.map((ability) => (
              <article
                key={`${ability.slot}-${ability.name}`}
                className="rounded-xl border border-black/20 bg-white/55 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="pixel-font text-[10px] uppercase tracking-wide text-black/80">
                    {ability.name}
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {ability.isHidden ? (
                      <span className="rounded-md border border-black/20 bg-black/5 px-2 py-0.5">
                        Hidden Ability
                      </span>
                    ) : null}
                    {ability.generation ? (
                      <span className="rounded-md border border-black/20 bg-black/5 px-2 py-0.5">
                        {ability.generation}
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 text-sm text-black/75">
                  {ability.shortEffect ?? ability.effect ?? "No effect description available."}
                </p>
              </article>
            ))}
          </div>
        </DetailSection>

        <DetailSection title="Evolution Chain" className="pokemon-full-data-section-evolution">
          <EvolutionChain stages={pokemon.evolutionChain.stages} />
        </DetailSection>

        <DetailSection
          title="Locations"
          subtitle="Known encounter areas in games"
          className="pokemon-full-data-section-locations"
        >
          {pokemon.encounters.length > 0 ? (
            <div className="space-y-2">
              {pokemon.encounters.map((encounter) => (
                <div
                  key={encounter.area}
                  className="rounded-lg border border-black/20 bg-white/55 px-3 py-2"
                >
                  <p className="text-sm font-medium text-black/80">
                    {encounter.area}
                  </p>
                  <p className="mt-1 text-xs text-black/65">
                    Versions: {encounter.versions.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-black/65">
              No official encounter area data available.
            </p>
          )}
        </DetailSection>

        <DetailSection
          title="Generation / Game Explorer"
          className="pokemon-full-data-section-games"
        >
          <PokemonGameDataPanel
            defaultGenerationKey={pokemon.generationKey}
            stats={pokemon.stats}
            moves={pokemon.moves}
            movesCount={pokemon.movesCount}
            gameIndices={pokemon.gameIndices}
          />
        </DetailSection>

        <DetailSection
          title="Forms, Varieties & Indexes"
          className="pokemon-full-data-section-forms"
        >
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
              <p className="break-words text-black/80">
                Forms: {pokemon.forms.join(", ") || "None"}
              </p>
            </div>
            <div className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
              <p className="break-words text-black/80">
                Varieties:{" "}
                {pokemon.varieties
                  .map((variety) =>
                    variety.isDefault ? `${variety.name} (Default)` : variety.name
                  )
                  .join(", ")}
              </p>
            </div>
            <div className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
              <p className="break-words text-black/80">
                Pokedex IDs:{" "}
                {pokemon.pokedexNumbers
                  .map((entry) => `${entry.dex} #${entry.number}`)
                  .join(" | ")}
              </p>
            </div>
            <div className="rounded-lg border border-black/20 bg-white/55 px-3 py-2">
              <p className="break-words text-black/80">
                Names:{" "}
                {pokemon.names
                  .slice(0, 8)
                  .map((entry) => `${entry.language}: ${entry.name}`)
                  .join(" | ")}
              </p>
            </div>
          </div>
        </DetailSection>

        <DetailSection title="Held Items" className="pokemon-full-data-section-held-items">
          {pokemon.heldItems.length > 0 ? (
            <div className="space-y-2">
              {pokemon.heldItems.map((item) => (
                <div
                  key={item.name}
                  className="rounded-lg border border-black/20 bg-white/55 px-3 py-2"
                >
                  <p className="text-sm font-medium text-black/80">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-black/65">
                    Rarity: {item.rarity ?? "N/A"} | Versions:{" "}
                    {item.versions.join(", ") || "Unknown"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-black/65">
              This Pokemon has no regular held-item data.
            </p>
          )}
        </DetailSection>

        <DetailSection title="Audio Module" className="pokemon-full-data-section-audio">
          <CryButton cryUrl={pokemon.cryUrl} pokemonName={pokemon.name} autoPlayOnLoad={false} />
        </DetailSection>

        <section className="pokemon-full-data-section pokemon-full-data-section-lore rounded-2xl border border-black/25 bg-white/60 p-4">
          <details>
            <summary className="cursor-pointer list-none">
              <span className="pixel-font text-[11px] uppercase tracking-wide text-black/75">
                Lore Archive (Pokedex + Flavor Text)
              </span>
              <p className="mt-1 text-sm text-black/60">
                Open only if you want narrative/lore info. Core game data is above.
              </p>
            </summary>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-black/20 bg-white/55 px-3 py-3">
                <p className="pixel-font text-[10px] uppercase tracking-wide text-black/70">
                  Pokedex Entry
                </p>
                <p className="mt-2 text-sm leading-relaxed text-black/80">
                  {pokemon.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {pokemon.isBaby ? (
                    <span className="rounded-md border border-black/20 bg-black/5 px-2 py-0.5">
                      Baby Pokemon
                    </span>
                  ) : null}
                  {pokemon.isLegendary ? (
                    <span className="rounded-md border border-black/20 bg-black/5 px-2 py-0.5">
                      Legendary
                    </span>
                  ) : null}
                  {pokemon.isMythical ? (
                    <span className="rounded-md border border-black/20 bg-black/5 px-2 py-0.5">
                      Mythical
                    </span>
                  ) : null}
                  {pokemon.hasGenderDifferences ? (
                    <span className="rounded-md border border-black/20 bg-black/5 px-2 py-0.5">
                      Gender Differences
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="max-h-[260px] space-y-2 overflow-y-auto rounded-lg border border-black/20 bg-white/45 p-2">
                {pokemon.flavorEntries.map((entry) => (
                  <div
                    key={`${entry.version}-${entry.text}`}
                    className="rounded-lg border border-black/20 bg-white/70 px-3 py-2"
                  >
                    <p className="pixel-font text-[9px] uppercase tracking-wide text-black/65">
                      {entry.version}
                    </p>
                    <p className="mt-1 text-sm text-black/75">{entry.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </section>
      </article>
    );

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(detailSchema) }}
        />
        <main className="pokemon-detail-page pokemon-full-data-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
          <div className="space-y-3">
            <PokedexFrame
              title={`${pokemon.name} - Full Data`}
              status="success"
              leftPanel={leftPanel}
              rightPanel={rightPanel}
              className="pokemon-full-data-frame"
            />
          </div>
        </main>
        <MobileDexBottomNav activeKey="explore" exploreHref="/" settingsHref="/" />
      </>
    );
  } catch (error) {
    if (isPokemonNotFoundError(error)) {
      notFound();
    }
    throw error;
  }
}

