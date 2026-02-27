"use client";

import { AnimatePresence, m } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FAVORITE_AUTH_NOTICE_EVENT } from "@/lib/favorite-auth-notice";

const DEFAULT_MESSAGE = "Sign in to save favorites.";

interface FavoriteAuthNoticeDetail {
  message?: string;
}

export function FavoriteAuthToast() {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const clearTimer = () => {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    const onNotice = (event: Event) => {
      const customEvent = event as CustomEvent<FavoriteAuthNoticeDetail>;
      setMessage(customEvent.detail?.message?.trim() || DEFAULT_MESSAGE);
      setIsVisible(true);
      clearTimer();
      hideTimerRef.current = window.setTimeout(() => {
        setIsVisible(false);
        hideTimerRef.current = null;
      }, 4000);
    };

    window.addEventListener(
      FAVORITE_AUTH_NOTICE_EVENT,
      onNotice as EventListener
    );

    return () => {
      window.removeEventListener(
        FAVORITE_AUTH_NOTICE_EVENT,
        onNotice as EventListener
      );
      clearTimer();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[120] flex justify-center px-3 sm:top-4 sm:px-4">
      <AnimatePresence>
        {isVisible ? (
          <m.div
            key="favorite-auth-toast"
            initial={{ opacity: 0, y: -18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.985 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="pointer-events-auto w-full max-w-[420px] rounded-xl border border-black/20 bg-white/90 px-3 py-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-black/78">{message}</p>
              <Link
                href="/login"
                className="pixel-font shrink-0 rounded-lg border border-black/25 bg-[var(--theme-accent-soft)] px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-black/78 transition hover:brightness-105"
              >
                Sign in
              </Link>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
