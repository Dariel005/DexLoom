"use client";

import {
  QueryClient,
  QueryClientProvider
} from "@tanstack/react-query";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { FavoriteAuthToast } from "@/components/FavoriteAuthToast";
import { RoleProvider } from "@/components/RoleContext";

interface LongTaskObserver extends PerformanceObserver {
  observe(options: { entryTypes: string[] }): void;
}

interface ConnectionLike {
  effectiveType?: string;
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: ConnectionLike;
  deviceMemory?: number;
}

function shouldRetry(failureCount: number, error: unknown) {
  const status = typeof error === "object" && error !== null && "status" in error
    ? Number((error as { status?: number }).status)
    : undefined;

  if (status && status >= 400 && status < 500 && status !== 429) {
    return false;
  }

  return failureCount < 2;
}

function isConstrainedDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const nav = navigator as NavigatorWithConnection;
  const connection = nav.connection;
  const cores = nav.hardwareConcurrency ?? 8;
  const memory = nav.deviceMemory ?? 8;
  const saveData = Boolean(connection?.saveData);
  const effectiveType = (connection?.effectiveType ?? "").toLowerCase();
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (saveData || effectiveType.includes("2g") || effectiveType.includes("3g")) {
    return true;
  }

  if (prefersReducedMotion) {
    return true;
  }

  return cores <= 4 || memory <= 4;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 10,
            gcTime: 1000 * 60 * 60,
            retry: shouldRetry,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false
          }
        }
      })
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const root = document.documentElement;
    if (!isConstrainedDevice()) {
      return;
    }

    root.classList.add("device-perf-low");
    return () => {
      root.classList.remove("device-perf-low");
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const root = document.documentElement;
    let rafId: number | null = null;
    let settleTimeoutId: number | null = null;

    const scheduleRestore = () => {
      if (settleTimeoutId !== null) {
        window.clearTimeout(settleTimeoutId);
      }
      settleTimeoutId = window.setTimeout(() => {
        root.classList.remove("scroll-perf-lite");
        settleTimeoutId = null;
      }, 190);
    };

    const markScrolling = () => {
      root.classList.add("scroll-perf-lite");
      scheduleRestore();
    };

    const onScrollActivity = () => {
      if (rafId !== null) {
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        markScrolling();
      });
    };

    window.addEventListener("scroll", onScrollActivity, { passive: true });
    window.addEventListener("wheel", onScrollActivity, { passive: true });
    window.addEventListener("touchmove", onScrollActivity, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScrollActivity);
      window.removeEventListener("wheel", onScrollActivity);
      window.removeEventListener("touchmove", onScrollActivity);

      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (settleTimeoutId !== null) {
        window.clearTimeout(settleTimeoutId);
      }

      root.classList.remove("scroll-perf-lite");
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.PerformanceObserver === "undefined") {
      return;
    }

    const root = document.documentElement;
    let restoreTimeoutId: number | null = null;

    const restore = () => {
      root.classList.remove("runtime-perf-low");
      restoreTimeoutId = null;
    };

    const activateRuntimeLowMode = () => {
      root.classList.add("runtime-perf-low");
      if (restoreTimeoutId !== null) {
        window.clearTimeout(restoreTimeoutId);
      }
      restoreTimeoutId = window.setTimeout(restore, 12000);
    };

    const observer = new window.PerformanceObserver((list) => {
      const expensiveEntryFound = list
        .getEntries()
        .some((entry) => entry.duration >= 80);

      if (expensiveEntryFound) {
        activateRuntimeLowMode();
      }
    });

    try {
      (observer as LongTaskObserver).observe({ entryTypes: ["longtask"] });
    } catch {
      return;
    }

    return () => {
      observer.disconnect();
      if (restoreTimeoutId !== null) {
        window.clearTimeout(restoreTimeoutId);
      }
      root.classList.remove("runtime-perf-low");
    };
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
          <RoleProvider>
            <QueryClientProvider client={queryClient}>
              {children}
              <AnalyticsTracker />
              <FavoriteAuthToast />
            </QueryClientProvider>
          </RoleProvider>
        </SessionProvider>
      </MotionConfig>
    </LazyMotion>
  );
}
