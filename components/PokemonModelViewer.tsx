"use client";

import { AnimatePresence, m } from "framer-motion";
import Image from "next/image";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PokemonModelViewerProps {
  pokemonId: number;
  pokemonName: string;
  fallbackImage: string | null;
  modelOverride?: {
    regularUrl: string | null;
    shinyUrl: string | null;
    sourceLabel?: string;
  };
}

type ModelVariant = "regular" | "shiny";

const MODEL_ASSET_BASE =
  "https://raw.githubusercontent.com/Pokemon-3D-api/assets/refs/heads/main/models/opt";

export function PokemonModelViewer({
  pokemonId,
  pokemonName,
  fallbackImage,
  modelOverride
}: PokemonModelViewerProps) {
  const viewerRef = useRef<HTMLElement | null>(null);
  const [variant, setVariant] = useState<ModelVariant>("regular");
  const [isLoading, setIsLoading] = useState(true);
  const [regularUnavailable, setRegularUnavailable] = useState(false);
  const [shinyUnavailable, setShinyUnavailable] = useState(false);
  const [useDefaultRegularFallback, setUseDefaultRegularFallback] = useState(false);
  const [useDefaultShinyFallback, setUseDefaultShinyFallback] = useState(false);

  const defaultRegularModelUrl = `${MODEL_ASSET_BASE}/regular/${pokemonId}.glb`;
  const defaultShinyModelUrl = `${MODEL_ASSET_BASE}/shiny/${pokemonId}.glb`;

  const hasOverride = Boolean(modelOverride);
  const preferredRegularModelUrl = modelOverride?.regularUrl ?? null;
  const preferredShinyModelUrl = modelOverride?.shinyUrl ?? null;
  const regularModelUrl =
    hasOverride && !useDefaultRegularFallback
      ? preferredRegularModelUrl ?? defaultRegularModelUrl
      : defaultRegularModelUrl;
  const shinyModelUrl =
    hasOverride && !useDefaultShinyFallback
      ? preferredShinyModelUrl ?? defaultShinyModelUrl
      : defaultShinyModelUrl;
  const hasRegularSource = Boolean(regularModelUrl);
  const hasShinySource = Boolean(shinyModelUrl);

  const requestedModelUrl = useMemo(() => {
    if (variant === "shiny" && hasShinySource && !shinyUnavailable) {
      return shinyModelUrl;
    }
    return regularModelUrl;
  }, [hasShinySource, regularModelUrl, shinyModelUrl, shinyUnavailable, variant]);

  useEffect(() => {
    setVariant("regular");
    setUseDefaultRegularFallback(false);
    setUseDefaultShinyFallback(false);
    setRegularUnavailable(!hasRegularSource);
    setShinyUnavailable(!hasShinySource);
    setIsLoading(hasRegularSource);
  }, [hasRegularSource, hasShinySource, pokemonId, modelOverride]);

  const applyComfortCamera = useCallback((node: HTMLElement | null) => {
    if (!node) {
      return;
    }

    node.setAttribute("camera-target", "auto auto auto");
    node.setAttribute("camera-orbit", "0deg 78deg 128%");
    node.setAttribute("min-camera-orbit", "auto auto 80%");
    node.setAttribute("max-camera-orbit", "auto auto 300%");
    node.setAttribute("field-of-view", "31deg");
    node.setAttribute("min-field-of-view", "21deg");
    node.setAttribute("max-field-of-view", "48deg");
  }, []);

  useEffect(() => {
    if (regularUnavailable || !requestedModelUrl) {
      return;
    }
    setIsLoading(true);
  }, [regularUnavailable, requestedModelUrl]);

  useEffect(() => {
    const node = viewerRef.current;
    if (!node || !requestedModelUrl) {
      return;
    }

    const handleLoad = () => {
      applyComfortCamera(node);
      if (variant === "regular") {
        setRegularUnavailable(false);
      } else {
        setShinyUnavailable(false);
      }
      setIsLoading(false);
    };

    const handleError = () => {
      if (variant === "shiny") {
        if (hasOverride && !useDefaultShinyFallback) {
          setUseDefaultShinyFallback(true);
          setIsLoading(true);
          return;
        }
        setShinyUnavailable(true);
        setVariant("regular");
        return;
      }

      if (hasOverride && !useDefaultRegularFallback) {
        setUseDefaultRegularFallback(true);
        setIsLoading(true);
        return;
      }

      setRegularUnavailable(true);
      setIsLoading(false);
    };

    node.addEventListener("load", handleLoad as EventListener);
    node.addEventListener("error", handleError as EventListener);

    return () => {
      node.removeEventListener("load", handleLoad as EventListener);
      node.removeEventListener("error", handleError as EventListener);
    };
  }, [
    applyComfortCamera,
    hasOverride,
    requestedModelUrl,
    useDefaultRegularFallback,
    useDefaultShinyFallback,
    variant
  ]);

  const handleResetView = useCallback(() => {
    applyComfortCamera(viewerRef.current);
  }, [applyComfortCamera]);

  return (
    <section className="rounded-xl border border-black/20 bg-white/65 p-3">
      <Script
        type="module"
        src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
        strategy="afterInteractive"
      />

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-black/65">
          Interactive 3D model. Drag to rotate and zoom.
        </p>
        <div className="inline-flex items-center gap-1 rounded-2xl border border-black/20 bg-white/70 p-1 shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
          <button
            type="button"
            onClick={() => setVariant("regular")}
            aria-pressed={variant === "regular"}
            className={cn(
              "no-gbc-btn pixel-font rounded-lg border px-2.5 py-1 text-[9px] uppercase tracking-wide transition",
              variant === "regular"
                ? "border-black/25 bg-[var(--theme-accent)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                : "border-transparent text-black/75 hover:bg-white/75"
            )}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => setVariant("shiny")}
            disabled={shinyUnavailable || !hasShinySource}
            aria-pressed={variant === "shiny"}
            className={cn(
              "no-gbc-btn pixel-font rounded-lg border px-2.5 py-1 text-[9px] uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-45",
              variant === "shiny"
                ? "border-black/25 bg-[var(--theme-accent)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                : "border-transparent text-black/75 hover:bg-white/75"
            )}
          >
            Shiny
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="no-gbc-btn pixel-font rounded-lg border border-transparent bg-transparent px-2.5 py-1 text-[9px] uppercase tracking-wide text-black/75 transition hover:bg-white/75"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="relative h-[360px] overflow-hidden rounded-xl border border-black/25 bg-gradient-to-b from-white/85 via-white/68 to-black/5">
        {!hasRegularSource || regularUnavailable ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-3 text-center">
            {fallbackImage ? (
              <div className="relative h-28 w-28">
                <Image
                  src={fallbackImage}
                  alt={`${pokemonName} artwork`}
                  fill
                  sizes="112px"
                  className="object-contain"
                />
              </div>
            ) : null}
            <p className="text-sm text-black/70">
              3D model unavailable for this Pokemon right now.
            </p>
          </div>
        ) : (
          <>
            {requestedModelUrl ? (
              <model-viewer
                ref={viewerRef}
                key={`${pokemonId}-${requestedModelUrl}`}
                src={requestedModelUrl}
                alt={`${pokemonName} 3D model`}
                camera-controls
                auto-rotate
                shadow-intensity="1"
                exposure="1.05"
                environment-image="neutral"
                camera-target="auto auto auto"
                camera-orbit="0deg 78deg 128%"
                min-camera-orbit="auto auto 80%"
                max-camera-orbit="auto auto 300%"
                field-of-view="31deg"
                min-field-of-view="21deg"
                max-field-of-view="48deg"
                style={{ width: "100%", height: "100%" }}
              />
            ) : null}

            <AnimatePresence initial={false}>
              {isLoading ? (
                <m.div
                  key="model-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-0 flex items-end justify-start bg-gradient-to-b from-white/30 to-white/55 p-3"
                >
                  <span className="pixel-font rounded-md border border-black/20 bg-white/80 px-2 py-1 text-[9px] uppercase tracking-wide text-black/70">
                    Loading 3D model...
                  </span>
                </m.div>
              ) : null}
            </AnimatePresence>
          </>
        )}
      </div>

      {shinyUnavailable ? (
        <p className="mt-2 text-xs text-black/55">
          Shiny 3D variant is not available for this entry.
        </p>
      ) : null}

      <p className="mt-2 text-[11px] text-black/50">
        Source: {modelOverride?.sourceLabel ?? "community Pokemon-3D assets (GLB)"}
      </p>
    </section>
  );
}

