"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/utils";

export type LedStatus = "idle" | "loading" | "error" | "success";

interface LedIndicatorProps {
  status?: LedStatus;
  className?: string;
}

const colorByStatus: Record<LedStatus, string> = {
  idle: "bg-zinc-300",
  loading: "bg-blue-400 shadow-[0_0_14px_rgba(96,165,250,0.9)]",
  error: "bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.95)]",
  success: "bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.85)]"
};

export function LedIndicator({ status = "idle", className }: LedIndicatorProps) {
  return (
    <m.span
      aria-label={`indicator-${status}`}
      className={cn(
        "inline-flex h-3.5 w-3.5 rounded-full border border-black/35",
        colorByStatus[status],
        className
      )}
      animate={
        status === "loading" || status === "error"
          ? { opacity: [0.35, 1, 0.35], scale: [0.95, 1, 0.95] }
          : { opacity: 1, scale: 1 }
      }
      transition={
        status === "loading" || status === "error"
          ? { duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
          : { duration: 0.2 }
      }
    />
  );
}

