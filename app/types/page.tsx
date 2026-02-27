import type { Metadata } from "next";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { TypesExplorer } from "@/components/TypesExplorer";
import { pokemonTypeIndexQueryOptions } from "@/lib/pokemon-query-options";

export const revalidate = 86400; // 24 hours

export const metadata: Metadata = {
  title: "Pokemon Types Encyclopedia",
  description:
    "Explore Pokemon types with offensive and defensive matchups, plus ecosystem samples."
};

export default async function TypesPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(pokemonTypeIndexQueryOptions());

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Pokemon Types Encyclopedia",
    description:
      "Encyclopedia of Pokemon types with strengths, resistances, immunities, and related data."
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <TypesExplorer />
        </HydrationBoundary>
      </main>
    </>
  );
}
