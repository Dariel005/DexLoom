import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        "pokedex-red": "#d9343a",
        "pokedex-red-dark": "#8f1212",
        "screen-green": "#9ce278",
        "screen-green-dark": "#2f6240",
        "electric-yellow": "#f8df4b"
      },
      boxShadow: {
        pokedex:
          "inset 2px 2px 0 rgba(255,255,255,0.35), inset -6px -8px 12px rgba(0,0,0,0.28), 0 18px 38px rgba(0,0,0,0.32)",
        screen:
          "inset 0 0 0 1px rgba(255,255,255,0.3), inset 0 -14px 18px rgba(0,0,0,0.2), 0 10px 24px rgba(0,0,0,0.22)"
      },
      animation: {
        "led-pulse": "ledPulse 1.2s ease-in-out infinite",
        "scan-sweep": "scanSweep 2.2s linear infinite",
        float: "float 4s ease-in-out infinite"
      },
      keyframes: {
        ledPulse: {
          "0%, 100%": { opacity: "0.45", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1)" }
        },
        scanSweep: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(220%)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
