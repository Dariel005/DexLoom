import type { Metadata } from "next";
import dynamic from "next/dynamic";

const CharactersDirectoryClient = dynamic(
  () => import("@/components/CharactersDirectoryClient").then((m) => m.CharactersDirectoryClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="pixel-font text-[11px] uppercase tracking-wide text-black/60">
          Loading character directory...
        </p>
      </div>
    )
  }
);

export const revalidate = 604800; // 7 days

export const metadata: Metadata = {
  title: "Pokemon Characters Directory",
  description:
    "Premium character index with portraits, role summaries, major appearances, and team snapshots."
};

export default function CharactersPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Pokemon Characters Directory",
    description:
      "Character directory with portraits, role summaries, major appearances, and team snapshots."
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <CharactersDirectoryClient />
    </>
  );
}

