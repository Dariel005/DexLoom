import type { Metadata } from "next";
import dynamic from "next/dynamic";

const CardsExplorer = dynamic(
  () => import("@/components/CardsExplorer").then((m) => m.CardsExplorer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="pixel-font text-[11px] uppercase tracking-wide text-black/60">
          Loading card archive...
        </p>
      </div>
    )
  }
);

export const revalidate = 86400; // 24 hours

export const metadata: Metadata = {
  title: "Pokemon Trading Card Encyclopedia",
  description:
    "Explore Pokemon cards with collectible artwork, combat lines, and rarity tiers."
};

export default async function CardsPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Pokemon Trading Card Encyclopedia",
    description:
      "Interactive Pokemon card archive with filters, card visuals, attacks, abilities, and card intelligence."
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="pokemon-detail-page cards-mobile-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <CardsExplorer />
      </main>
    </>
  );
}
