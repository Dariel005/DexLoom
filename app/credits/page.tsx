import type { Metadata } from "next";
import Link from "next/link";
import { MobileDexBottomNav } from "@/components/MobileDexBottomNav";
import { PokedexFrame } from "@/components/PokedexFrame";

export const metadata: Metadata = {
  title: "Credits",
  description: "Credits shortcut page for data sources and copyright notice."
};

export default function CreditsPage() {
  const leftPanel = (
    <section id="credits-top" className="credits-mobile-left space-y-4">
      <section className="credits-mobile-hero rounded-2xl border border-black/20 bg-white/60 p-4">
        <h1 className="pixel-font text-[12px] uppercase tracking-[0.14em] text-black/80">
          Credits
        </h1>
        <p className="mt-2 text-sm text-black/75">
          This page is an alias to the complete sources and references section.
        </p>
      </section>
    </section>
  );

  const rightPanel = (
    <section id="credits-links" className="credits-mobile-right space-y-4">
      <section className="credits-mobile-section rounded-2xl border border-black/20 bg-white/60 p-4">
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Navigation
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href="/"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Back to Pokedex
          </Link>
          <Link
            href="/sources"
            className="gbc-nav-link rounded-md border border-black/25 bg-white/75 px-2.5 py-1 text-xs text-black/75"
          >
            Go to Sources & Credits
          </Link>
        </div>
      </section>
    </section>
  );

  return (
    <main className="credits-mobile-page pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
      <PokedexFrame
        title="Credits"
        status="success"
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        className="credits-mobile-frame"
      />
      <MobileDexBottomNav
        activeKey="explore"
        exploreHref="/credits#credits-top"
        settingsHref="/credits#credits-links"
        className="credits-mobile-bottom-nav"
      />
    </main>
  );
}
