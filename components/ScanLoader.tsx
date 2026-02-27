"use client";

import { m } from "framer-motion";

export function ScanLoader() {
  return (
    <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-black/25 bg-screen-green/70">
      <div className="scan-overlay" />
      <m.div
        className="absolute inset-x-3 top-4 h-2 rounded-full bg-electric-yellow/70"
        animate={{ width: ["20%", "90%", "36%", "75%", "40%"] }}
        transition={{
          duration: 1.9,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut"
        }}
      />
      <m.p
        className="pixel-font absolute bottom-4 left-4 text-[11px] uppercase text-black/70"
        animate={{ opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY }}
      >
        Scanning data...
      </m.p>
    </div>
  );
}

