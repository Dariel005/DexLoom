import { type GenerationKey } from "@/types/pokemon";

interface GenerationTheme {
  border: string;
  chassis: [string, string, string];
  screenA: [string, string];
  screenB: [string, string];
  metal: [string, string];
}

const GENERATION_THEMES: Record<GenerationKey, GenerationTheme> = {
  gen1: {
    border: "#710d10",
    chassis: ["#ef615c", "#dc3d3d", "#9f151c"],
    screenA: ["#c9f6b6", "#7fb680"],
    screenB: ["#d8dde5", "#adb5bf"],
    metal: ["#cfd5dc", "#9fa6af"]
  },
  gen2: {
    border: "#7a4e0d",
    chassis: ["#f0c35d", "#d89d2a", "#8f5d10"],
    screenA: ["#d7f0a7", "#96b86a"],
    screenB: ["#e7dec5", "#c9b88f"],
    metal: ["#e4d7b8", "#beab7c"]
  },
  gen3: {
    border: "#165635",
    chassis: ["#5dcc84", "#2fa364", "#1b6b45"],
    screenA: ["#c7f8cf", "#66ba89"],
    screenB: ["#d7e7df", "#9ebdaf"],
    metal: ["#c8d6ce", "#8fa29a"]
  },
  gen4: {
    border: "#3b2365",
    chassis: ["#a27bd9", "#7957bd", "#452776"],
    screenA: ["#dccff4", "#a79ed8"],
    screenB: ["#dcdcea", "#b7b8cc"],
    metal: ["#d0d2e2", "#9fa4b8"]
  },
  gen5: {
    border: "#3e424b",
    chassis: ["#c7c9cc", "#888c92", "#4d5058"],
    screenA: ["#e5e6e8", "#b4b7be"],
    screenB: ["#e1e3e7", "#b8bbc3"],
    metal: ["#d6d9de", "#a8acb4"]
  },
  gen6: {
    border: "#143c79",
    chassis: ["#53a4ff", "#2d73d6", "#17468e"],
    screenA: ["#d1e8ff", "#80b3ea"],
    screenB: ["#d7e3f0", "#aab9cc"],
    metal: ["#d0dbe8", "#94a6be"]
  },
  gen7: {
    border: "#7e2f10",
    chassis: ["#f39b52", "#e26b2a", "#9d3e12"],
    screenA: ["#fde3b9", "#dba46e"],
    screenB: ["#f2ddd1", "#d0b09a"],
    metal: ["#e8d4c7", "#c2a790"]
  },
  gen8: {
    border: "#1b4b63",
    chassis: ["#66c8e8", "#2f8fb3", "#1f5570"],
    screenA: ["#cef3fa", "#80c4d8"],
    screenB: ["#d8e8ef", "#abc3cf"],
    metal: ["#cfe0e8", "#96acb8"]
  },
  gen9: {
    border: "#69276f",
    chassis: ["#ff8c5a", "#d95a86", "#7b2e8c"],
    screenA: ["#ffe2c3", "#f6b58c"],
    screenB: ["#e7d9f1", "#c4a8d4"],
    metal: ["#e0d2e9", "#b59dc3"]
  }
};

const TYPE_ACCENTS: Record<string, string> = {
  normal: "#9fa173",
  fire: "#f08030",
  water: "#4a90e2",
  electric: "#f6c945",
  grass: "#64bc46",
  ice: "#69c6c2",
  fighting: "#c44d37",
  poison: "#9b59b6",
  ground: "#d1b468",
  flying: "#8fa8f8",
  psychic: "#e85a8b",
  bug: "#91a119",
  rock: "#a38c40",
  ghost: "#655d99",
  dragon: "#7058f8",
  dark: "#5a4a42",
  steel: "#8e99a7",
  fairy: "#e999c4"
};

function normalizeType(type: string | null | undefined) {
  return type?.toLowerCase().trim() ?? "";
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const fullHex =
    value.length === 3
      ? value
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : value;
  const int = Number.parseInt(fullHex, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function buildPokedexThemeVariables(
  generationKey: GenerationKey,
  primaryType: string | null | undefined
) {
  const generationTheme = GENERATION_THEMES[generationKey] ?? GENERATION_THEMES.gen1;
  const accent = TYPE_ACCENTS[normalizeType(primaryType)] ?? "#d9343a";

  const vividChassisFrom = `color-mix(in srgb, ${generationTheme.chassis[0]} 88%, ${accent} 12%)`;
  const vividChassisMid = `color-mix(in srgb, ${generationTheme.chassis[1]} 84%, ${accent} 16%)`;
  const vividScreenAFrom = `color-mix(in srgb, ${generationTheme.screenA[0]} 70%, ${accent} 30%)`;
  const vividScreenATo = `color-mix(in srgb, ${generationTheme.screenA[1]} 66%, ${accent} 34%)`;
  const vividScreenBFrom = `color-mix(in srgb, ${generationTheme.screenB[0]} 80%, ${accent} 20%)`;
  const vividScreenBTo = `color-mix(in srgb, ${generationTheme.screenB[1]} 76%, ${accent} 24%)`;

  return {
    "--theme-border": generationTheme.border,
    "--theme-chassis-from": vividChassisFrom,
    "--theme-chassis-mid": vividChassisMid,
    "--theme-chassis-to": generationTheme.chassis[2],
    "--theme-screen-a-from": vividScreenAFrom,
    "--theme-screen-a-to": vividScreenATo,
    "--theme-screen-b-from": vividScreenBFrom,
    "--theme-screen-b-to": vividScreenBTo,
    "--theme-metal-from": generationTheme.metal[0],
    "--theme-metal-to": generationTheme.metal[1],
    "--theme-accent": accent,
    "--theme-accent-soft": hexToRgba(accent, 0.28),
    "--theme-accent-glow": hexToRgba(accent, 0.56)
  } as const;
}
