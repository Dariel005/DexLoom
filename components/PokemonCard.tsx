"use client";

import { m } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import { TypeBadge } from "@/components/TypeBadge";
import { emitFavoriteAuthNotice } from "@/lib/favorite-auth-notice";
import { cn } from "@/lib/utils";
import { type PokemonListEntry } from "@/types/pokemon";

interface PokemonCardProps {
  pokemon: PokemonListEntry;
  index: number;
  isFavorite: boolean;
  isSelected: boolean;
  canToggleFavorite: boolean;
  enableEntranceMotion: boolean;
  onToggleFavorite: (pokemonId: number) => void;
  onSelect: (pokemonId: number) => void;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: "easeOut",
      delay: Math.min(index, 16) * 0.02
    }
  })
};

function PokemonCardComponent({
  pokemon,
  index,
  isFavorite,
  isSelected,
  canToggleFavorite,
  enableEntranceMotion,
  onToggleFavorite,
  onSelect
}: PokemonCardProps) {
  const shouldAnimate = enableEntranceMotion;
  const artwork =
    pokemon.artwork ??
    pokemon.homeSprite ??
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;

  return (
    <m.article
      variants={shouldAnimate ? fadeInUp : undefined}
      initial={shouldAnimate ? "hidden" : false}
      animate={shouldAnimate ? "visible" : undefined}
      custom={shouldAnimate ? index : undefined}
      whileHover={shouldAnimate ? { y: -2 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.99 } : undefined}
      data-selected={isSelected ? "true" : "false"}
      className={cn(
        "pokemon-card-shell flex h-full min-h-[252px] flex-col overflow-hidden rounded-2xl border p-3 transition sm:p-3.5",
        isSelected ? "pokemon-card-selected" : "pokemon-card-idle"
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(pokemon.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(pokemon.id);
          }
        }}
        className="pokemon-card-hit-area w-full flex-1 text-left"
      >
        <div className="pokemon-card-head flex items-start justify-between gap-3">
          <div className="pokemon-card-meta">
            <p className="pokemon-card-index pixel-font text-[9px] uppercase tracking-[0.14em] text-black/55">
              #{pokemon.id.toString().padStart(4, "0")}
            </p>
            <h3 className="pokemon-card-name pixel-font mt-1 truncate text-[11px] uppercase tracking-wide">
              {pokemon.displayName}
            </h3>
            <p className="pokemon-card-generation mt-1 text-[11px] text-black/55">{pokemon.generation}</p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (!canToggleFavorite) {
                emitFavoriteAuthNotice("Sign in to add this Pokemon to favorites.");
                return;
              }
              onToggleFavorite(pokemon.id);
            }}
            aria-disabled={!canToggleFavorite}
            data-active={isFavorite}
            aria-pressed={isFavorite}
            aria-label={
              canToggleFavorite
                ? isFavorite
                  ? "remove favorite"
                  : "add favorite"
                : "sign in to add favorite"
            }
            title={canToggleFavorite ? undefined : "Sign in to use favorites"}
            className={cn(
              "pokemon-card-favorite-btn favorite-star-btn inline-flex h-9 w-9 items-center justify-center text-[16px] leading-none transition-all duration-200 active:scale-[0.96]",
              !canToggleFavorite && "cursor-not-allowed opacity-55"
            )}
          >
            <span className={cn("favorite-star-icon transition-transform", isFavorite && "scale-110")}>
              {isFavorite ? "\u2605" : "\u2606"}
            </span>
          </button>
        </div>

        <div className="pokemon-card-content mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 sm:gap-3">
          <div className="pokemon-card-sprite relative h-[114px] w-[114px] flex-shrink-0 sm:h-[130px] sm:w-[130px]">
            <Image
              src={artwork}
              alt={pokemon.displayName}
              fill
              loading="lazy"
              sizes="(min-width: 640px) 130px, 114px"
              className="object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.25)]"
            />
          </div>
          <div className="pokemon-card-type-stack flex min-w-0 flex-col items-end gap-1.5">
            {pokemon.types.map((type) => (
              <TypeBadge
                key={`${pokemon.id}-${type}`}
                type={type}
                className="pokemon-card-type-badge h-6 min-w-[82px] justify-center px-2 text-[8px]"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="pokemon-card-footer mt-3 flex items-center justify-between">
        <span className="pokemon-card-stat-chip rounded-lg border border-black/20 bg-black/5 px-2 py-1 text-[11px]">
          Atk {pokemon.attack}
        </span>
        <Link
          href={`/pokemon/${pokemon.id}`}
          prefetch={false}
          onClick={() => onSelect(pokemon.id)}
          className={cn(
            "pokemon-card-footer-btn pixel-font rounded-lg border px-2.5 py-1.5 text-[9px] uppercase tracking-wide text-white transition hover:brightness-110",
            isSelected ? "pokedex-accent-button pokedex-accent-glow" : "border-black/25 bg-pokedex-red"
          )}
        >
          Entry
        </Link>
      </div>
    </m.article>
  );
}

export const PokemonCard = memo(PokemonCardComponent);

