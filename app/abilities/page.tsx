import type { Metadata } from "next";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { AbilitiesExplorer } from "@/components/AbilitiesExplorer";
import { pokemonAbilityIndexQueryOptions } from "@/lib/pokemon-query-options";

export const revalidate = 86400; // 24 hours

export const metadata: Metadata = {
  title: "Pokemon Abilities Encyclopedia",
  description:
    "Explore Pokemon abilities with effects, generation metadata, and species coverage."
};

export default async function AbilitiesPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(pokemonAbilityIndexQueryOptions());

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Pokemon Abilities Encyclopedia",
    description:
      "Encyclopedia of Pokemon abilities with effect text and Pokemon samples."
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <AbilitiesExplorer />
        </HydrationBoundary>
      </main>
    </>
  );
}
