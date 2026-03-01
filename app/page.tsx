import type { Metadata } from "next";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient
} from "@tanstack/react-query";
import { PokemonExplorer } from "@/components/PokemonExplorer";
import { DEFAULT_GENERATION_KEY } from "@/lib/generations";
import { generationPokemonQueryOptions } from "@/lib/pokemon-query-options";

export const revalidate = 600; // 10 minutes (matches staleTime)

export const metadata: Metadata = {
  title: "DexLoom",
  description:
    "Explora la Pokedex completa, mega evolutions, TCG cards, region maps, Pokemon GO, ROM hacks, trainer social y herramientas avanzadas desde una sola experiencia retro-tech.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "DexLoom | Interactive Pokemon Encyclopedia",
    description:
      "Pokemon, cards, maps, games, mega evolutions, favorites, trainer social y herramientas premium en una sola plataforma.",
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "DexLoom homepage preview with Pokemon modules and retro-tech Pokedex panels"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "DexLoom | Interactive Pokemon Encyclopedia",
    description:
      "Pokedex completa con cards, maps, mega evolutions, trainer social y herramientas avanzadas.",
    images: [
      {
        url: "/opengraph-image",
        alt: "DexLoom homepage preview"
      }
    ]
  }
};

export default async function HomePage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchInfiniteQuery(
    generationPokemonQueryOptions(DEFAULT_GENERATION_KEY)
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "DexLoom",
    applicationCategory: "Encyclopedia",
    operatingSystem: "Web",
    description:
      "Enciclopedia Pokemon interactiva con filtros por region, estadisticas y detalle tecnico."
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <PokemonExplorer />
        </HydrationBoundary>
      </main>
    </>
  );
}
