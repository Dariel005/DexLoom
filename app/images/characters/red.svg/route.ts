import { NextResponse } from "next/server";

export const runtime = "nodejs";

const RED_TRAINER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 900" role="img" aria-labelledby="title desc">
  <title id="title">Red portrait card</title>
  <desc id="desc">Stylized trainer portrait for Red</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7f1d1d" />
      <stop offset="55%" stop-color="#b91c1c" />
      <stop offset="100%" stop-color="#f97316" />
    </linearGradient>
    <radialGradient id="glow" cx="70%" cy="20%" r="65%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="720" height="900" fill="url(#bg)" />
  <rect width="720" height="900" fill="url(#glow)" />
  <circle cx="560" cy="180" r="170" fill="#ffffff" opacity="0.1" />
  <circle cx="130" cy="780" r="220" fill="#111827" opacity="0.2" />
  <g opacity="0.22" fill="#111827">
    <circle cx="370" cy="320" r="110" />
    <path d="M220 760c0-125 82-230 150-230s150 105 150 230v140H220z" />
  </g>
  <text x="54" y="92" fill="#ffffff" opacity="0.9" font-size="44" font-family="Segoe UI,Arial,sans-serif" font-weight="700">RED</text>
  <text x="54" y="128" fill="#fee2e2" opacity="0.92" font-size="22" font-family="Segoe UI,Arial,sans-serif">KANTO PROTAGONIST</text>
  <text x="54" y="852" fill="#ffffff" opacity="0.8" font-size="18" font-family="Segoe UI,Arial,sans-serif">WIKI CHARACTER SERIES</text>
</svg>
`;

export function GET() {
  return new NextResponse(RED_TRAINER_SVG, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
