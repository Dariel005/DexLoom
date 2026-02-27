import type { Metadata } from "next";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient
} from "@tanstack/react-query";
import { ItemsExplorer } from "@/components/ItemsExplorer";
import { pokemonItemIndexQueryOptions } from "@/lib/pokemon-query-options";

export const revalidate = 86400; // 24 hours

export const metadata: Metadata = {
  title: "Pokemon Items Encyclopedia",
  description:
    "Explora Pokeballs, bayas, pociones, objetos de combate y su funcion completa en Pokemon.",
  openGraph: {
    title: "Pokemon Items Encyclopedia | DexLoom",
    description:
      "Catalogo de items Pokemon con bolsillo, categoria, efectos y datos tecnicos."
  }
};

export default async function ItemsPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(pokemonItemIndexQueryOptions());

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Pokemon Items Encyclopedia",
    description:
      "Catalogo de objetos Pokemon: Pokeballs, bayas, pociones, items de combate y su uso.",
    about: ["pokemon items", "pokeballs", "berries", "medicine", "held items"]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ItemsExplorer />
        </HydrationBoundary>
      </main>
    </>
  );
}
