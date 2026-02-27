"use client";

import Image from "next/image";
import { useEffect } from "react";

interface ProfileAvatarLightboxProps {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
}

export function ProfileAvatarLightbox({
  open,
  src,
  alt,
  onClose
}: ProfileAvatarLightboxProps) {
  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="profile-avatar-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Expanded profile avatar"
      onClick={onClose}
    >
      <div
        className="profile-avatar-lightbox-card"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="profile-avatar-lightbox-close pixel-font"
          onClick={onClose}
          aria-label="Close avatar preview"
        >
          <span className="profile-avatar-lightbox-close-glyph" aria-hidden="true">X</span>
          <span className="profile-avatar-lightbox-close-label">Close</span>
        </button>
        <div className="profile-avatar-lightbox-image-wrap">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 900px) 88vw, 560px"
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
