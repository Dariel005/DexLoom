"use client";

import { useMemo } from "react";
import { useUiTone } from "@/hooks/useUiTone";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { emitFavoriteAuthNotice } from "@/lib/favorite-auth-notice";
import { type FavoriteUpsertInput } from "@/lib/profile-types";
import { cn } from "@/lib/utils";

interface FavoriteStarButtonProps {
  favorite: FavoriteUpsertInput;
  className?: string;
  labelClassName?: string;
  showLabel?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  compact?: boolean;
}

export function FavoriteStarButton({
  favorite,
  className,
  labelClassName,
  showLabel = false,
  activeLabel = "Favorited",
  inactiveLabel = "Favorite",
  compact = true
}: FavoriteStarButtonProps) {
  const playUiTone = useUiTone();
  const favorites = useUserFavorites();
  const canToggleFavorite = favorites.isAuthenticated;
  const isActive = useMemo(
    () => favorites.isFavorite(favorite.entityType, favorite.entityId),
    [favorite.entityId, favorite.entityType, favorites]
  );

  return (
    <button
      type="button"
      onClick={() => {
        if (!canToggleFavorite) {
          emitFavoriteAuthNotice("Sign in to add this favorite.");
          playUiTone("switch");
          return;
        }
        const nextState = favorites.toggleFavorite(favorite);
        playUiTone(nextState ? "select" : "switch");
      }}
      aria-disabled={!canToggleFavorite}
      data-active={isActive}
      aria-pressed={isActive}
      aria-label={
        canToggleFavorite
          ? isActive
            ? `Remove ${favorite.title} from favorites`
            : `Add ${favorite.title} to favorites`
          : `Sign in to save ${favorite.title} in favorites`
      }
      title={canToggleFavorite ? undefined : "Sign in to use favorites"}
      className={cn(
        "favorite-star-btn inline-flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.96]",
        compact ? "h-8 min-w-8 px-2" : "h-9 min-w-9 px-3",
        !canToggleFavorite && "cursor-not-allowed opacity-55",
        className
      )}
    >
      <span
        className={cn(
          "favorite-star-icon leading-none",
          compact ? "text-[15px]" : "text-[17px]"
        )}
      >
        {isActive ? "\u2605" : "\u2606"}
      </span>
      {showLabel ? (
        <span
          className={cn(
            "pixel-font text-[9px] uppercase tracking-[0.1em]",
            labelClassName
          )}
        >
          {isActive ? activeLabel : inactiveLabel}
        </span>
      ) : null}
    </button>
  );
}
