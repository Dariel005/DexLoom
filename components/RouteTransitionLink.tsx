"use client";

import { useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
  type TouchEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { cn } from "@/lib/utils";
import { useSoundStore } from "@/store/sound-store";

interface RouteTransitionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  exitDurationMs?: number;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
  target?: "_self" | "_blank" | "_parent" | "_top";
  rel?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  onMouseEnter?: (event: MouseEvent<HTMLAnchorElement>) => void;
  onFocus?: (event: FocusEvent<HTMLAnchorElement>) => void;
  onTouchStart?: (event: TouchEvent<HTMLAnchorElement>) => void;
}

export function RouteTransitionLink({
  href,
  children,
  className,
  style,
  exitDurationMs = 170,
  replace = false,
  scroll = true,
  prefetch,
  target,
  rel,
  onClick,
  onMouseEnter,
  onFocus,
  onTouchStart
}: RouteTransitionLinkProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const soundEnabled = useSoundStore((state) => state.enabled);
  const soundVolume = useSoundStore((state) => state.volume);
  const [isLeaving, setIsLeaving] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNavigationTone = useCallback(() => {
    if (
      !soundEnabled ||
      soundVolume <= 0 ||
      typeof window === "undefined" ||
      typeof window.AudioContext === "undefined"
    ) {
      return;
    }

    const audioContext = audioContextRef.current ?? new window.AudioContext();
    audioContextRef.current = audioContext;

    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    const duration = 0.095;
    const startFrequency = 760;
    const endFrequency = 560;
    const peakGain = Math.max(0.052 * soundVolume, 0.0001);

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(startFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);

    gainNode.gain.setValueAtTime(peakGain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.012);
  }, [soundEnabled, soundVolume]);

  const clearLeavingState = useCallback(() => {
    if (timeoutRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLeaving(false);
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("route-transition-leaving");
    }
  }, []);

  useEffect(
    () => () => {
      clearLeavingState();
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    },
    [clearLeavingState]
  );

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) {
        return;
      }
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        target === "_blank"
      ) {
        return;
      }

      if (isLeaving) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      if (href === currentPath) {
        return;
      }

      playNavigationTone();

      if (prefersReducedMotion) {
        if (replace) {
          router.replace(href, { scroll });
        } else {
          router.push(href, { scroll });
        }
        return;
      }

      setIsLeaving(true);
      if (typeof document !== "undefined") {
        document.documentElement.classList.add("route-transition-leaving");
      }

      if (typeof window !== "undefined") {
        timeoutRef.current = window.setTimeout(() => {
          if (replace) {
            router.replace(href, { scroll });
          } else {
            router.push(href, { scroll });
          }
        }, exitDurationMs);
      }
    },
    [
      exitDurationMs,
      href,
      isLeaving,
      onClick,
      playNavigationTone,
      prefersReducedMotion,
      replace,
      router,
      scroll,
      target
    ]
  );

  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      prefetch={prefetch}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      onTouchStart={onTouchStart}
      aria-disabled={isLeaving}
      className={cn(className, isLeaving && "pointer-events-none opacity-80")}
      style={style}
    >
      {children}
    </Link>
  );
}
