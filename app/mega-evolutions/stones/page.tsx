import type { Metadata } from "next";
import { MegaStoneExplorer } from "@/components/MegaStoneExplorer";

export const metadata: Metadata = {
  title: "Mega Stones",
  description:
    "Complete Mega Stone archive with item artwork, description, and acquisition routes for Mega Evolution."
};

export default function MegaEvolutionStonesPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Mega Stones",
    description:
      "Complete Mega Stone archive with item artwork, description, and acquisition routes for Mega Evolution."
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <MegaStoneExplorer />
      </main>
    </>
  );
}
