import type { Metadata } from "next";
import dynamic from "next/dynamic";

const PokemonGoExplorer = dynamic(
  () => import("@/components/PokemonGoExplorer").then((m) => m.PokemonGoExplorer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="pixel-font text-[11px] uppercase tracking-wide text-black/60">
          Loading Pokemon GO data...
        </p>
      </div>
    )
  }
);

export const revalidate = 86400; // 24 hours

export const metadata: Metadata = {
  title: "Pokemon GO Encyclopedia",
  description:
    "Explore Pokemon GO systems including raids, battle league, rocket ops, research loops, routes, events, and account progression strategy."
};

export default async function PokemonGoPage() {

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Pokemon GO Encyclopedia",
    description:
      "Interactive Pokemon GO strategy encyclopedia with modules for raids, PvP, research, events, routes, economy, and social systems."
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <PokemonGoExplorer />
      </main>
    </>
  );
}
