import type { Metadata } from "next";
import dynamic from "next/dynamic";

const MapsExplorer = dynamic(
  () => import("@/components/MapsExplorer").then((m) => m.MapsExplorer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="pixel-font text-[11px] uppercase tracking-wide text-black/60">
          Loading region maps...
        </p>
      </div>
    )
  }
);

export const revalidate = 604800; // 7 days

export const metadata: Metadata = {
  title: "Pokemon Region Maps Encyclopedia",
  description:
    "Explore Pokemon world maps with region structure, landmarks, cities, traversal systems, and lore context."
};

export default async function MapsPage() {

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Pokemon Region Maps Encyclopedia",
    description:
      "Encyclopedia of Pokemon regions with map visuals, travel routes, city data, and strategic exploration notes."
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <MapsExplorer />
      </main>
    </>
  );
}
