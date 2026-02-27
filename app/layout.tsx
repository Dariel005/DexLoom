import type { Metadata } from "next";
import { Press_Start_2P, Space_Grotesk } from "next/font/google";
import { Providers } from "@/app/providers";
import { WikiSiteFooter } from "@/components/WikiSiteFooter";
import "./globals.css";

const pixelFont = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel"
});

const sansFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pokedex-wiki-pro.vercel.app"),
  title: {
    default: "DexLoom",
    template: "%s | DexLoom"
  },
  description:
    "DexLoom: interactive explorer with advanced filters, evolutions, and SEO-ready Pokemon entries.",
  openGraph: {
    title: "DexLoom",
    description:
      "A high-performance interactive Pokedex with smooth animations and official data.",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "DexLoom",
    description:
      "Browse stats, evolutions, and Pokemon details in a premium experience."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#d9343a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "DexLoom",
              alternateName: "Pokémon Wiki Pro",
              url: "https://pokedex-wiki-pro.vercel.app",
              description:
                "Comprehensive Pokémon encyclopedia with Pokédex, moves, items, abilities, types, maps, cards, ROM hacks, and more.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://pokedex-wiki-pro.vercel.app/?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem("dexloom-locale");if(l&&(l==="en"||l==="es")){document.documentElement.lang=l}}catch(e){}})()`
          }}
        />
      </head>
      <body className={`${pixelFont.variable} ${sansFont.variable}`}>
        <a
          href="#main-content"
          className="fixed left-2 top-2 z-[9999] -translate-y-full rounded-lg border border-black/30 bg-pokedex-red px-4 py-2 font-[family-name:var(--font-pixel)] text-xs uppercase tracking-wide text-white opacity-0 transition-all duration-200 focus:translate-y-0 focus:opacity-100"
        >
          Skip to content
        </a>
        <Providers>
          <div id="main-content">
            {children}
          </div>
          <WikiSiteFooter />
        </Providers>
      </body>
    </html>
  );
}
