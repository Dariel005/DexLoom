"use client";

import { useEffect, useState } from "react";

export type DevicePerformanceTier = "low" | "medium" | "high";

interface NetworkInfoLike {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
  addListener?: (listener: () => void) => void;
  removeListener?: (listener: () => void) => void;
}

interface NavigatorLike extends Navigator {
  deviceMemory?: number;
  connection?: NetworkInfoLike;
}

function resolvePerformanceTier(): DevicePerformanceTier {
  if (typeof navigator === "undefined") {
    return "medium";
  }

  const nav = navigator as NavigatorLike;
  const connection = nav.connection;
  const cores = nav.hardwareConcurrency ?? 8;
  const memory = nav.deviceMemory ?? 8;
  const saveData = Boolean(connection?.saveData);
  const networkType = (connection?.effectiveType ?? "").toLowerCase();
  const userAgent = nav.userAgent ?? "";
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(userAgent);
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let score = 0;

  if (cores >= 12) {
    score += 2;
  } else if (cores >= 8) {
    score += 1;
  } else if (cores <= 4) {
    score -= 2;
  } else if (cores <= 6) {
    score -= 1;
  }

  if (memory >= 12) {
    score += 2;
  } else if (memory >= 8) {
    score += 1;
  } else if (memory <= 2) {
    score -= 2;
  } else if (memory <= 4) {
    score -= 1;
  }

  if (saveData) {
    score -= 2;
  }

  if (networkType.includes("slow-2g") || networkType.includes("2g")) {
    score -= 2;
  } else if (networkType.includes("3g")) {
    score -= 1;
  }

  if (isMobile) {
    score -= 1;
  }

  if (prefersReducedMotion) {
    score -= 1;
  }

  if (score <= -2) {
    return "low";
  }

  if (score <= 1) {
    return "medium";
  }

  return "high";
}

export function useDevicePerformanceTier(): DevicePerformanceTier {
  const [tier, setTier] = useState<DevicePerformanceTier>("medium");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nav = navigator as NavigatorLike;
    const connection = nav.connection;
    const reducedMotionQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    const syncTier = () => {
      setTier(resolvePerformanceTier());
    };

    syncTier();

    if (reducedMotionQuery) {
      if (typeof reducedMotionQuery.addEventListener === "function") {
        reducedMotionQuery.addEventListener("change", syncTier);
      } else if (typeof reducedMotionQuery.addListener === "function") {
        reducedMotionQuery.addListener(syncTier);
      }
    }

    if (connection) {
      if (typeof connection.addEventListener === "function") {
        connection.addEventListener("change", syncTier);
      } else if (typeof connection.addListener === "function") {
        connection.addListener(syncTier);
      }
    }

    return () => {
      if (reducedMotionQuery) {
        if (typeof reducedMotionQuery.removeEventListener === "function") {
          reducedMotionQuery.removeEventListener("change", syncTier);
        } else if (typeof reducedMotionQuery.removeListener === "function") {
          reducedMotionQuery.removeListener(syncTier);
        }
      }

      if (connection) {
        if (typeof connection.removeEventListener === "function") {
          connection.removeEventListener("change", syncTier);
        } else if (typeof connection.removeListener === "function") {
          connection.removeListener(syncTier);
        }
      }
    };
  }, []);

  return tier;
}
