"use client";

import { PokedexFrame } from "@/components/PokedexFrame";

interface GlobalErrorProps {
  reset: () => void;
}

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="es">
      <body>
        <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
          <PokedexFrame
            title="Critical Error"
            status="error"
            leftPanel={
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-black/30 bg-white/45 p-6">
                <p className="pixel-font text-center text-[11px] uppercase tracking-wide text-black/70">
                  System interruption
                </p>
              </div>
            }
            rightPanel={
              <div className="space-y-3 rounded-2xl border border-black/25 bg-white/60 p-4">
                <h2 className="pixel-font text-[11px] uppercase tracking-wide text-black/70">
                  Unexpected failure
                </h2>
                <p className="text-sm text-black/75">
                  The app failed to render. Retry to reinitialize the Pokedex.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="pixel-font rounded-lg border border-black/35 bg-electric-yellow px-3 py-2 text-[10px] uppercase tracking-wide"
                >
                  Retry
                </button>
              </div>
            }
          />
        </main>
      </body>
    </html>
  );
}
