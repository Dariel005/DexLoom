"use client";

export const FAVORITE_AUTH_NOTICE_EVENT = "favorite-auth-required";

interface FavoriteAuthNoticeDetail {
  message?: string;
}

export function emitFavoriteAuthNotice(
  message = "Sign in to save favorites."
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<FavoriteAuthNoticeDetail>(FAVORITE_AUTH_NOTICE_EVENT, {
      detail: { message }
    })
  );
}
