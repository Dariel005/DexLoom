"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

const SESSION_STORAGE_KEY = "dexloom.analytics.session.v1";
const HEARTBEAT_MS = 60_000;

function getAnalyticsSessionId() {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const created = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
  return created;
}

function sendAnalyticsEvent(
  body: {
    type: "pageview" | "heartbeat" | "leave";
    sessionId: string;
    path: string;
    referrer: string | null;
    occurredAt: string;
  },
  preferBeacon = false
) {
  const payload = JSON.stringify(body);

  if (preferBeacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/track", blob);
    return;
  }

  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: preferBeacon
  }).catch(() => undefined);
}

function touchPresence() {
  void fetch("/api/social/presence", {
    method: "POST",
    keepalive: true
  }).catch(() => undefined);
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const sessionIdRef = useRef<string | null>(null);
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    sessionIdRef.current = getAnalyticsSessionId();
  }, []);

  useEffect(() => {
    const sessionId = sessionIdRef.current;
    const path = pathname ?? "/";
    if (!sessionId || lastPathRef.current === path) {
      return;
    }

    lastPathRef.current = path;
    sendAnalyticsEvent(
      {
        type: "pageview",
        sessionId,
        path,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        occurredAt: new Date().toISOString()
      },
      false
    );

    if (session?.user?.id) {
      touchPresence();
    }
  }, [pathname, session?.user?.id]);

  useEffect(() => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) {
      return;
    }

    const sendHeartbeat = () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      sendAnalyticsEvent(
        {
          type: "heartbeat",
          sessionId,
          path: pathname ?? "/",
          referrer: typeof document !== "undefined" ? document.referrer || null : null,
          occurredAt: new Date().toISOString()
        },
        false
      );

      if (session?.user?.id) {
        touchPresence();
      }
    };

    const handleVisibilityChange = () => {
      sendAnalyticsEvent(
        {
          type: document.visibilityState === "hidden" ? "leave" : "heartbeat",
          sessionId,
          path: pathname ?? "/",
          referrer: typeof document !== "undefined" ? document.referrer || null : null,
          occurredAt: new Date().toISOString()
        },
        document.visibilityState === "hidden"
      );

      if (document.visibilityState === "visible" && session?.user?.id) {
        touchPresence();
      }
    };

    const handlePageHide = () => {
      sendAnalyticsEvent(
        {
          type: "leave",
          sessionId,
          path: pathname ?? "/",
          referrer: typeof document !== "undefined" ? document.referrer || null : null,
          occurredAt: new Date().toISOString()
        },
        true
      );
    };

    const intervalId = window.setInterval(sendHeartbeat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [pathname, session?.user?.id]);

  return null;
}
