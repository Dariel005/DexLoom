"use client";

import { m } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import { TypeBadge } from "@/components/TypeBadge";
import { emitFavoriteAuthNotice } from "@/lib/favorite-auth-notice";
import { cn } from "@/lib/utils";
import { type MegaEvolutionEntry } from "@/lib/mega-evolutions-encyclopedia";

interface MegaEvolutionCardProps {
  entry: MegaEvolutionEntry;
  index: number;
  isFavorite: boolean;
  isSelected: boolean;
  canToggleFavorite: boolean;
  enableEntranceMotion: boolean;
  onToggleFavorite: (slug: string) => void;
  onSelect: (slug: string) => void;
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

function MegaEvolutionCardComponent({
  entry,
  index,
  isFavorite,
  isSelected,
  canToggleFavorite,
  enableEntranceMotion,
  onToggleFavorite,
  onSelect
}: MegaEvolutionCardProps) {
  const shouldAnimate = enableEntranceMotion;

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
        "pokemon-card-shell mega-mobile-card mega-card-shell flex h-full min-h-[252px] flex-col overflow-hidden rounded-2xl border p-3 transition sm:p-3.5",
        isSelected ? "pokemon-card-selected" : "pokemon-card-idle"
      )}
    >
      <span className="mega-card-energy mega-card-energy-a" aria-hidden />
      <span className="mega-card-energy mega-card-energy-b" aria-hidden />
      <span className="mega-card-energy mega-card-energy-c" aria-hidden />
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(entry.slug)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(entry.slug);
          }
        }}
        className="mega-mobile-card-hit-area w-full flex-1 text-left"
      >
        <div className="mega-mobile-card-head flex items-start justify-between gap-3">
          <div className="mega-mobile-card-meta">
            <p className="pokemon-card-index pixel-font text-[9px] uppercase tracking-[0.14em] text-black/55">
              #{entry.baseDexNumber.toString().padStart(4, "0")}
            </p>
            <h3 className="pokemon-card-name pixel-font mt-1 truncate text-[11px] uppercase tracking-wide">
              {entry.megaName}
            </h3>
            <p className="pokemon-card-generation mt-1 text-[11px] text-black/55">
              {entry.debutGeneration} ({entry.region})
            </p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (!canToggleFavorite) {
                emitFavoriteAuthNotice("Sign in to add this Mega form to favorites.");
                return;
              }
              onToggleFavorite(entry.slug);
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
              "favorite-star-btn mega-card-favorite inline-flex h-9 w-9 items-center justify-center text-[16px] leading-none transition-all duration-200 active:scale-[0.96]",
              !canToggleFavorite && "cursor-not-allowed opacity-55"
            )}
          >
            <span className={cn("favorite-star-icon transition-transform", isFavorite && "scale-110")}>
              {isFavorite ? "\u2605" : "\u2606"}
            </span>
          </button>
        </div>

        <div className="mega-mobile-card-content mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 sm:gap-3">
          <div className="mega-card-sprite-shell pokemon-card-sprite relative h-[114px] w-[114px] flex-shrink-0 sm:h-[130px] sm:w-[130px]">
            <Image
              src={entry.imageSrc}
              alt={entry.imageAlt}
              fill
              loading="lazy"
              sizes="(min-width: 640px) 130px, 114px"
              className="object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.25)]"
            />
          </div>
          <div className="mega-card-type-stack pokemon-card-type-stack flex min-w-0 flex-col items-end gap-1.5">
            {entry.types.map((type) => (
              <TypeBadge
                key={`${entry.slug}-${type}`}
                type={type}
                className="pokemon-card-type-badge h-6 min-w-[82px] justify-center px-2 text-[8px]"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mega-mobile-card-footer mt-3 flex items-center justify-between">
        <span className="mega-mobile-card-chip rounded-lg border border-black/20 bg-black/5 px-2 py-1 text-[11px]">
          Atk {entry.stats.attack}
        </span>
        <Link
          href={`/mega-evolutions/${entry.slug}`}
          prefetch={false}
          onClick={() => onSelect(entry.slug)}
          className={cn(
            "pokemon-card-footer-btn mega-card-action mega-mobile-card-entry pixel-font rounded-lg border px-2.5 py-1.5 text-[9px] uppercase tracking-wide text-white transition hover:brightness-110",
            isSelected ? "pokedex-accent-button pokedex-accent-glow" : "border-black/25 bg-pokedex-red"
          )}
        >
          Entry
        </Link>
      </div>
    </m.article>
  );
}

export const MegaEvolutionCard = memo(MegaEvolutionCardComponent);
