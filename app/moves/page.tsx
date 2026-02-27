import type { Metadata } from "next";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { MovesExplorer } from "@/components/MovesExplorer";
import { pokemonMoveIndexQueryOptions } from "@/lib/pokemon-query-options";

export const revalidate = 86400; // 24 hours

export const metadata: Metadata = {
  title: "Pokemon Moves Encyclopedia",
  description:
    "Explore Pokemon moves with battle stats, effect details, and learner samples."
};

export default async function MovesPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(pokemonMoveIndexQueryOptions());

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Pokemon Moves Encyclopedia",
    description:
      "Encyclopedia of Pokemon moves with power, accuracy, PP, target, and usage notes."
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <MovesExplorer />
        </HydrationBoundary>
      </main>
    </>
  );
}
