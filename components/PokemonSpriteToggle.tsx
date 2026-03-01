"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";

interface PokemonSpriteToggleProps {
  pokemonId: number;
  pokemonName: string;
  normalSprite: string;
  shinySprite: string | null;
  priority?: boolean;
  className?: string;
}

function getDefaultSprite(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function PokemonSpriteToggle({
  pokemonId,
  pokemonName,
  normalSprite,
  shinySprite,
  priority = false,
  className
}: PokemonSpriteToggleProps) {
  const [variant, setVariant] = useState<"normal" | "shiny">("normal");

  const hasShiny = Boolean(shinySprite);
  const activeUrl = useMemo(() => {
    if (variant === "shiny" && shinySprite) {
      return shinySprite;
    }
    return normalSprite || getDefaultSprite(pokemonId);
  }, [normalSprite, pokemonId, shinySprite, variant]);

  return (
    <div className={cn("pokemon-sprite-toggle rounded-2xl border border-black/20 bg-white/45 p-3", className)}>
      <div className="pokemon-sprite-toggle-topbar flex flex-wrap items-center justify-between gap-2">
        <p className="pokemon-sprite-toggle-label pixel-font text-[10px] uppercase tracking-[0.14em] text-black/65">
          Sprite Mode
        </p>
        <div className="pokemon-sprite-toggle-mode inline-flex items-center gap-1 rounded-2xl border border-black/20 bg-white/70 p-1 shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
          <button
            type="button"
            onClick={() => setVariant("normal")}
            aria-pressed={variant === "normal"}
            className={cn(
              "pokemon-sprite-toggle-button no-gbc-btn rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
              variant === "normal"
                ? "border-black/25 bg-[var(--theme-accent)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                : "border-transparent text-black/75 hover:bg-white/75"
            )}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => setVariant("shiny")}
            disabled={!hasShiny}
            aria-pressed={variant === "shiny"}
            className={cn(
              "pokemon-sprite-toggle-button no-gbc-btn rounded-lg border px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
              variant === "shiny"
                ? "border-black/25 bg-[var(--theme-accent)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                : "border-transparent text-black/75 hover:bg-white/75"
            )}
          >
            Shiny
          </button>
        </div>
      </div>

      <div className="pokemon-sprite-toggle-stage relative mx-auto mt-3 h-[300px] w-full max-w-[330px]">
        <m.div
          key={`${variant}-${activeUrl}`}
          initial={{ opacity: 0.25, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="pokemon-sprite-toggle-asset absolute inset-0"
        >
          <Image
            src={activeUrl}
            alt={`${pokemonName} ${variant} sprite`}
            fill
            loading={priority ? undefined : "lazy"}
            sizes="(min-width: 1024px) 330px, 80vw"
            className="object-contain drop-shadow-[0_12px_26px_rgba(0,0,0,0.35)]"
            unoptimized={activeUrl.endsWith(".gif")}
            priority={priority}
          />
        </m.div>
      </div>

      {!hasShiny ? (
        <p className="pokemon-sprite-toggle-note mt-2 text-xs text-black/60">
          Shiny sprite is not available for this asset source.
        </p>
      ) : null}
    </div>
  );
}



