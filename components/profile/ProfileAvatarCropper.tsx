"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ProfileAvatarCropperProps {
  open: boolean;
  imageSrc: string | null;
  fileName: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (croppedBlob: Blob) => Promise<void> | void;
}

interface ImageSize {
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3.5;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampOffset(offset: Point, maxOffset: Point) {
  return {
    x: clamp(offset.x, -maxOffset.x, maxOffset.x),
    y: clamp(offset.y, -maxOffset.y, maxOffset.y)
  };
}

function blobFromCanvas(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to create cropped avatar image."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      0.9
    );
  });
}

async function loadImageElement(src: string) {
  const image = new window.Image();
  image.src = src;
  if (typeof image.decode === "function") {
    await image.decode();
    return image;
  }
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Unable to load selected image."));
  });
  return image;
}

export function ProfileAvatarCropper({
  open,
  imageSrc,
  fileName,
  isSubmitting,
  onCancel,
  onConfirm
}: ProfileAvatarCropperProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originOffset: Point;
  } | null>(null);

  const [imageSize, setImageSize] = useState<ImageSize | null>(null);
  const [viewportSize, setViewportSize] = useState(320);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const baseScale = useMemo(() => {
    if (!imageSize || viewportSize <= 0) {
      return 1;
    }
    return Math.max(viewportSize / imageSize.width, viewportSize / imageSize.height);
  }, [imageSize, viewportSize]);

  const maxOffset = useMemo(() => {
    if (!imageSize) {
      return { x: 0, y: 0 };
    }
    const scale = baseScale * zoom;
    const renderedWidth = imageSize.width * scale;
    const renderedHeight = imageSize.height * scale;
    return {
      x: Math.max(0, (renderedWidth - viewportSize) / 2),
      y: Math.max(0, (renderedHeight - viewportSize) / 2)
    };
  }, [baseScale, imageSize, viewportSize, zoom]);

  const renderedSize = useMemo(() => {
    if (!imageSize) {
      return { width: viewportSize, height: viewportSize };
    }
    const scale = baseScale * zoom;
    return {
      width: imageSize.width * scale,
      height: imageSize.height * scale
    };
  }, [baseScale, imageSize, viewportSize, zoom]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setIsProcessing(false);
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
    setErrorMessage(null);
  }, [open, imageSrc]);

  useEffect(() => {
    setOffset((current) => clampOffset(current, maxOffset));
  }, [maxOffset]);

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting && !isProcessing) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isProcessing, isSubmitting, onCancel, open]);

  useEffect(() => {
    if (!open || !viewportRef.current || typeof ResizeObserver === "undefined") {
      return;
    }

    const element = viewportRef.current;
    const syncViewportSize = () => {
      const nextSize = Math.max(180, Math.round(element.clientWidth));
      setViewportSize(nextSize);
    };

    syncViewportSize();
    const observer = new ResizeObserver(syncViewportSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [open]);

  const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      setErrorMessage("Unable to read image dimensions.");
      return;
    }
    setImageSize({
      width: image.naturalWidth,
      height: image.naturalHeight
    });
    setErrorMessage(null);
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isSubmitting || isProcessing) {
        return;
      }
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originOffset: offset
      };
    },
    [isProcessing, isSubmitting, offset]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;
      const nextOffset = clampOffset(
        {
          x: dragState.originOffset.x + deltaX,
          y: dragState.originOffset.y + deltaY
        },
        maxOffset
      );
      setOffset(nextOffset);
    },
    [maxOffset]
  );

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }
    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const handleZoomChange = useCallback(
    (nextZoom: number) => {
      const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      setZoom(clampedZoom);

      if (!imageSize) {
        return;
      }

      const nextScale = baseScale * clampedZoom;
      const nextRenderedWidth = imageSize.width * nextScale;
      const nextRenderedHeight = imageSize.height * nextScale;
      const nextMaxOffset = {
        x: Math.max(0, (nextRenderedWidth - viewportSize) / 2),
        y: Math.max(0, (nextRenderedHeight - viewportSize) / 2)
      };
      setOffset((current) => clampOffset(current, nextMaxOffset));
    },
    [baseScale, imageSize, viewportSize]
  );

  const handleReset = useCallback(() => {
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
    setErrorMessage(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!imageSrc || !imageSize || viewportSize <= 0 || isSubmitting || isProcessing) {
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const image = await loadImageElement(imageSrc);
      const scale = baseScale * zoom;
      const sourceSize = viewportSize / scale;
      const sourceX = (imageSize.width - sourceSize) / 2 - offset.x / scale;
      const sourceY = (imageSize.height - sourceSize) / 2 - offset.y / scale;
      const safeSourceX = clamp(sourceX, 0, Math.max(0, imageSize.width - sourceSize));
      const safeSourceY = clamp(sourceY, 0, Math.max(0, imageSize.height - sourceSize));

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Unable to initialize image crop canvas.");
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        image,
        safeSourceX,
        safeSourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE
      );

      const croppedBlob = await blobFromCanvas(canvas);
      await onConfirm(croppedBlob);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to crop selected image.");
    } finally {
      setIsProcessing(false);
    }
  }, [baseScale, imageSize, imageSrc, isProcessing, isSubmitting, offset.x, offset.y, onConfirm, viewportSize, zoom]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="profile-avatar-cropper"
      role="dialog"
      aria-modal="true"
      aria-label="Crop profile avatar"
      onClick={() => {
        if (!isSubmitting && !isProcessing) {
          onCancel();
        }
      }}
    >
      <div
        className="profile-avatar-cropper-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="profile-avatar-cropper-head">
          <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/72">
            Avatar Crop
          </p>
          <p className="profile-avatar-cropper-file" title={fileName}>
            {fileName}
          </p>
        </div>

        <div
          ref={viewportRef}
          className="profile-avatar-cropper-viewport"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {imageSrc ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt="Selected avatar preview"
                draggable={false}
                onLoad={handleImageLoad}
                className="profile-avatar-cropper-image"
                style={{
                  width: `${renderedSize.width}px`,
                  height: `${renderedSize.height}px`,
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`
                }}
              />
              <span className="profile-avatar-cropper-grid" aria-hidden />
            </>
          ) : (
            <p className="text-sm text-black/62">Choose an image to start cropping.</p>
          )}
        </div>

        <div className="profile-avatar-cropper-controls">
          <label className="profile-avatar-cropper-zoom-label" htmlFor="profile-avatar-cropper-zoom">
            Zoom
          </label>
          <input
            id="profile-avatar-cropper-zoom"
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            disabled={isSubmitting || isProcessing || !imageSize}
            onChange={(event) => handleZoomChange(Number(event.target.value))}
            className="profile-avatar-cropper-zoom-slider"
          />
          <span className="profile-avatar-cropper-zoom-value">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting || isProcessing || !imageSize}
            className="profile-avatar-cropper-reset pixel-font"
          >
            Recenter
          </button>
        </div>

        {errorMessage ? (
          <p className="profile-avatar-cropper-error">{errorMessage}</p>
        ) : (
          <p className="profile-avatar-cropper-hint">Drag to center and adjust zoom before upload.</p>
        )}

        <div className="profile-avatar-cropper-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || isProcessing}
            className="profile-avatar-cropper-btn profile-avatar-cropper-btn-secondary pixel-font"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              void handleConfirm();
            }}
            disabled={isSubmitting || isProcessing || !imageSize}
            className="profile-avatar-cropper-btn profile-avatar-cropper-btn-primary pixel-font"
          >
            {isSubmitting || isProcessing ? "Uploading..." : "Use Crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
