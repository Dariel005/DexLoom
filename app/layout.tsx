import type { Metadata } from "next";
import { Press_Start_2P, Space_Grotesk } from "next/font/google";
import { Providers } from "@/app/providers";
import { WikiSiteFooter } from "@/components/WikiSiteFooter";
import "./globals.css";

const DEFAULT_SITE_URL = "https://dexloom.net";

function resolveMetadataBaseUrl() {
  const configuredUrl = String(process.env.NEXTAUTH_URL ?? "").trim() || DEFAULT_SITE_URL;
  try {
    return new URL(configuredUrl);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

const metadataBaseUrl = resolveMetadataBaseUrl();
const metadataBaseHref = metadataBaseUrl.toString().replace(/\/$/, "");

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
  metadataBase: metadataBaseUrl,
  title: {
    default: "DexLoom",
    template: "%s | DexLoom"
  },
  description:
    "DexLoom es una Pokedex interactiva con Pokemon, mega evolutions, cards, maps, games, trainer social y herramientas avanzadas en una sola interfaz.",
  openGraph: {
    title: "DexLoom",
    description:
      "Explora Pokemon, mega evolutions, TCG cards, maps, games, favorites y trainer social en una experiencia retro-tech de alta fidelidad.",
    type: "website",
    url: metadataBaseHref,
    siteName: "DexLoom",
    locale: "es_ES",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "DexLoom preview with Pokedex modules, Pokemon cards and retro-tech interface"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "DexLoom",
    description:
      "Pokedex interactiva con Pokemon, cards, maps, mega evolutions, social y herramientas avanzadas.",
    images: [
      {
        url: "/opengraph-image",
        alt: "DexLoom retro-tech Pokedex preview"
      }
    ]
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "DexLoom",
              alternateName: "Pokemon Wiki Pro",
              url: metadataBaseHref,
              description:
                "Comprehensive Pokemon encyclopedia with Pokedex, moves, items, abilities, types, maps, cards, ROM hacks, and more.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${metadataBaseHref}/?q={search_term_string}`
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
