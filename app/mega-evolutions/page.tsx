import type { Metadata } from "next";
import dynamic from "next/dynamic";

const MegaEvolutionExplorer = dynamic(
  () => import("@/components/MegaEvolutionExplorer").then((m) => m.MegaEvolutionExplorer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="pixel-font text-[11px] uppercase tracking-wide text-black/60">
          Loading Mega Evolution registry...
        </p>
      </div>
    )
  }
);

export const revalidate = 604800; // 7 days

export const metadata: Metadata = {
  title: "Mega Evolutions",
  description:
    "Interactive Mega Evolution registry with card grid, detail screen, and full-page entries."
};

export default function MegaEvolutionsPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Mega Evolutions",
    description:
      "Interactive Mega Evolution registry with card grid, detail screen, and full-page entries."
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <MegaEvolutionExplorer />
      </main>
    </>
  );
}
