import type { Metadata } from "next";
import dynamic from "next/dynamic";

const RomHacksExplorer = dynamic(
  () => import("@/components/RomHacksExplorer").then((m) => m.RomHacksExplorer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="pixel-font text-[11px] uppercase tracking-wide text-black/60">
          Loading ROM hacks directory...
        </p>
      </div>
    )
  }
);

export const revalidate = 604800; // 7 days

export const metadata: Metadata = {
  title: "Pokemon ROM Hacks Directory",
  description:
    "Community ROM hack directory with official project links, verified references, and visual project cards."
};

export default function RomHacksPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Pokemon ROM Hacks Directory",
    description:
      "Directory of fan-made Pokemon ROM hacks with official project pages and image references."
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <RomHacksExplorer />
      </main>
    </>
  );
}

