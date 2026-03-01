"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { TypeBadge } from "@/components/TypeBadge";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { emitFavoriteAuthNotice } from "@/lib/favorite-auth-notice";
import { type MainlineGameCatalogEntry } from "@/lib/mainline-games";
import { resolveBulbagardenImageSrc } from "@/lib/remote-image";
import { cn } from "@/lib/utils";

interface GameCardProps {
  game: MainlineGameCatalogEntry;
}

interface PlatformTheme {
  accentClass: string;
  cardBackground: string;
}

const DEFAULT_PLATFORM_THEME: PlatformTheme = {
  accentClass: "bg-gradient-to-r from-zinc-400 via-zinc-300 to-zinc-500",
  cardBackground:
    "linear-gradient(165deg, rgba(248, 250, 248, 0.95), rgba(236, 241, 235, 0.92)), radial-gradient(circle at 16% 14%, rgba(255, 255, 255, 0.74), transparent 44%)"
};

const PLATFORM_THEMES: Record<string, PlatformTheme> = {
  "Game Boy": {
    accentClass: "bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-400",
    cardBackground:
      "linear-gradient(165deg, rgba(255, 249, 220, 0.95), rgba(240, 229, 179, 0.9)), radial-gradient(circle at 16% 14%, rgba(255, 255, 255, 0.68), transparent 45%)"
  },
  "Game Boy Color": {
    accentClass: "bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500",
    cardBackground:
      "linear-gradient(165deg, rgba(224, 245, 255, 0.95), rgba(197, 227, 250, 0.9)), radial-gradient(circle at 16% 14%, rgba(255, 255, 255, 0.66), transparent 45%)"
  },
  "Game Boy Advance": {
    accentClass: "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600",
    cardBackground:
      "linear-gradient(165deg, rgba(239, 230, 255, 0.95), rgba(222, 209, 252, 0.9)), radial-gradient(circle at 16% 14%, rgba(255, 255, 255, 0.66), transparent 45%)"
  },
  "Nintendo DS": {
    accentClass: "bg-gradient-to-r from-slate-600 via-zinc-500 to-slate-700",
    cardBackground:
      "linear-gradient(165deg, rgba(235, 241, 247, 0.95), rgba(217, 225, 235, 0.9)), radial-gradient(circle at 16% 14%, rgba(255, 255, 255, 0.66), transparent 45%)"
  },
  "Nintendo 3DS": {
    accentClass: "bg-gradient-to-r from-rose-600 via-red-500 to-orange-500",
    cardBackground:
      "linear-gradient(165deg, rgba(255, 232, 236, 0.95), rgba(250, 213, 218, 0.9)), radial-gradient(circle at 16% 14%, rgba(255, 255, 255, 0.67), transparent 45%)"
  },
  "Nintendo Switch": {
    accentClass: "bg-gradient-to-r from-red-700 via-red-500 to-rose-500",
    cardBackground:
      "linear-gradient(165deg, rgba(255, 229, 231, 0.95), rgba(249, 208, 211, 0.9)), radial-gradient(circle at 16% 14%, rgba(255, 255, 255, 0.66), transparent 45%)"
  },
  "Nintendo Switch 2": {
    accentClass: "bg-gradient-to-r from-blue-700 via-indigo-500 to-red-500",
    cardBackground:
      "linear-gradient(165deg, rgba(230, 236, 255, 0.95), rgba(214, 223, 252, 0.9)), radial-gradient(circle at 16% 14%, rgba(255, 255, 255, 0.67), transparent 45%)"
  },
  "iOS / Android": {
    accentClass: "bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500",
    cardBackground:
      "linear-gradient(165deg, rgba(225, 250, 236, 0.95), rgba(203, 243, 224, 0.9)), radial-gradient(circle at 16% 14%, rgba(255, 255, 255, 0.66), transparent 45%)"
  },
  "Switch / iOS / Android": {
    accentClass: "bg-gradient-to-r from-red-600 via-emerald-500 to-sky-500",
    cardBackground:
      "linear-gradient(165deg, rgba(233, 248, 245, 0.95), rgba(214, 239, 234, 0.9)), radial-gradient(circle at 16% 14%, rgba(255, 255, 255, 0.67), transparent 45%)"
  }
};

function normalizePlatformTag(platform: string) {
  return platform
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getPlatformBadgeLabel(platform: string) {
  const platformLabels: Record<string, string> = {
    "Game Boy": "GB",
    "Game Boy Color": "GBC",
    "Game Boy Advance": "GBA",
    "Nintendo DS": "NDS",
    "Nintendo 3DS": "3DS",
    "Nintendo Switch": "Switch",
    "Nintendo Switch 2": "Switch 2",
    "iOS / Android": "Mobile",
    "Switch / iOS / Android": "Switch + Mobile"
  };

  return platformLabels[platform] ?? platform;
}

export function GameCard({ game }: GameCardProps) {
  const router = useRouter();
  const favorites = useUserFavorites();
  const canToggleFavorite = favorites.isAuthenticated;
  const isFavorite = favorites.isFavorite("game", game.slug);
  const resolvedGameImageSrc = resolveBulbagardenImageSrc(game.imageSrc) ?? game.imageSrc;
  const platformTag = normalizePlatformTag(game.platform);
  const platformLabel = getPlatformBadgeLabel(game.platform);
  const generationBadgeLabel = game.generationKey === "mobile" ? "Live" : undefined;
  const platformTheme = PLATFORM_THEMES[game.platform] ?? DEFAULT_PLATFORM_THEME;
  const entryHref = `/games/${game.slug}`;

  const favoritePayload = {
    entityType: "game" as const,
    entityId: game.slug,
    title: game.title,
    href: entryHref,
    imageUrl: resolvedGameImageSrc,
    subtitle: `${game.generationLabel} (${game.regionLabel})`,
    tags: ["game", game.generationKey, platformTag]
  };

  const openEntry = () => {
    router.push(entryHref);
  };

  return (
    <article
      data-selected="false"
      role="link"
      tabIndex={0}
      aria-label={`Open game entry for ${game.title}`}
      onClick={openEntry}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openEntry();
        }
      }}
      className="games-mobile-card group block h-full cursor-pointer rounded-2xl focus-visible:outline-none"
    >
      <div
        className="games-mobile-card-shell pokemon-card-shell pokemon-card-idle flex h-full min-h-[300px] flex-col overflow-hidden rounded-2xl border p-4 transition group-focus-visible:ring-2 group-focus-visible:ring-black/45 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-white"
        style={{ background: platformTheme.cardBackground }}
      >
        <div className="games-mobile-card-head flex items-start justify-between gap-3">
          <div className="games-mobile-card-copy min-w-0">
            <p className="pokemon-card-index pixel-font text-[9px] uppercase tracking-[0.14em] text-black/56">
              #{game.order.toString().padStart(4, "0")}
            </p>
            <h3 className="pokemon-card-name pixel-font mt-1 whitespace-normal break-words text-[11px] uppercase tracking-wide leading-[1.25] sm:text-[12px]">
              {game.title}
            </h3>
            <p className="pokemon-card-generation mt-1 line-clamp-1 text-[11px] text-black/56">
              {game.generationLabel} ({game.regionLabel})
            </p>
          </div>
          <div className="games-mobile-card-favorite-wrap">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!canToggleFavorite) {
                  emitFavoriteAuthNotice("Sign in to add this game to favorites.");
                  return;
                }
                favorites.toggleFavorite(favoritePayload);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.stopPropagation();
                }
              }}
              aria-disabled={!canToggleFavorite}
              data-active={isFavorite}
              aria-pressed={isFavorite}
              aria-label={
                canToggleFavorite
                  ? isFavorite
                    ? `Remove ${game.title} from favorites`
                    : `Add ${game.title} to favorites`
                  : `Sign in to add ${game.title} to favorites`
              }
              title={canToggleFavorite ? undefined : "Sign in to use favorites"}
              className={cn(
                "favorite-star-btn inline-flex h-9 w-9 min-h-[2.25rem] min-w-[2.25rem] flex-none shrink-0 items-center justify-center text-[16px] leading-none transition-all duration-200 active:scale-[0.96]",
                !canToggleFavorite && "cursor-not-allowed opacity-55"
              )}
            >
              <span
                className={cn("favorite-star-icon transition-transform", isFavorite && "scale-110")}
              >
                {isFavorite ? "\u2605" : "\u2606"}
              </span>
            </button>
          </div>
        </div>

        <div
          className={`games-mobile-card-accent mt-2 h-1.5 w-full rounded-full border border-black/18 ${platformTheme.accentClass}`}
        />

        <div className="games-mobile-card-content mt-3 flex flex-col gap-2.5">
          <div className="games-mobile-card-art-shell flex justify-center">
            <div className="games-mobile-card-art pokemon-card-sprite relative h-[134px] w-[134px] flex-shrink-0 sm:h-[152px] sm:w-[152px]">
              <Image
                src={resolvedGameImageSrc}
                alt={game.imageAlt}
                fill
                loading="lazy"
                sizes="(min-width: 640px) 152px, 134px"
                className="object-contain drop-shadow-[0_10px_12px_rgba(0,0,0,0.26)]"
              />
            </div>
          </div>
          <div className="games-mobile-card-types pokemon-card-type-stack flex min-w-0 flex-col items-center gap-1.5">
            <TypeBadge
              type={platformTag}
              label={platformLabel}
              className="pokemon-card-type-badge h-6 min-w-[104px] justify-center px-2 text-[8px]"
            />
            <TypeBadge
              type={game.generationKey}
              label={generationBadgeLabel}
              className="pokemon-card-type-badge h-6 min-w-[104px] justify-center px-2 text-[8px]"
            />
          </div>
        </div>

        <div className="games-mobile-card-footer mt-3 flex items-center justify-between gap-2">
          <span className="games-mobile-card-release rounded-lg border border-black/20 bg-black/5 px-2 py-1 text-[11px]">
            {game.releaseWindow}
          </span>
          <span className="games-mobile-card-entry pokemon-card-footer-btn pixel-font rounded-lg border border-black/25 bg-pokedex-red px-2.5 py-1.5 text-[9px] uppercase tracking-wide text-white transition group-hover:brightness-110">
            Entry
          </span>
        </div>
      </div>
    </article>
  );
}

