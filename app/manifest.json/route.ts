import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(
    {
      name: "DexLoom - Pokemon Wiki Pro",
      short_name: "DexLoom",
      description:
        "Comprehensive Pokemon encyclopedia with Pokedex, moves, items, abilities, types, maps, cards, ROM hacks, and more.",
      start_url: "/",
      display: "standalone",
      background_color: "#0f1318",
      theme_color: "#d9343a",
      orientation: "portrait-primary",
      categories: ["games", "entertainment", "education"],
      lang: "en",
      dir: "ltr",
      icons: [
        {
          src: "/icon.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "/apple-icon.png",
          sizes: "180x180",
          type: "image/png",
          purpose: "any"
        }
      ]
    },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800"
      }
    }
  );
}
