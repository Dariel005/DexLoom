"use client";

import { m, useReducedMotion } from "framer-motion";
import { useDevicePerformanceTier } from "@/hooks/useDevicePerformanceTier";
import { ROLE_BADGE_LABELS, type UserRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import styles from "@/components/RoleDisplayName.module.css";

interface RoleDisplayNameProps {
  name: string;
  role?: UserRole;
  className?: string;
  badgeClassName?: string;
  compact?: boolean;
  showBadge?: boolean;
}

const vipParticles = [
  { left: "6%", duration: 3.2, delay: 0 },
  { left: "24%", duration: 2.9, delay: 0.45 },
  { left: "56%", duration: 3.4, delay: 0.28 },
  { left: "82%", duration: 3.05, delay: 0.72 }
] as const;

const lightningBolts = [
  { width: "46%", left: "4%", rotate: -16, duration: 1.7, delay: 0.2 },
  { width: "36%", left: "38%", rotate: 11, duration: 2.05, delay: 0.75 },
  { width: "28%", left: "58%", rotate: -22, duration: 1.45, delay: 1.15 }
] as const;

export function RoleDisplayName({
  name,
  role = "member",
  className,
  badgeClassName,
  compact = false,
  showBadge = true
}: RoleDisplayNameProps) {
  const reducedMotion = useReducedMotion();
  const performanceTier = useDevicePerformanceTier();
  const renderLiteEffects = reducedMotion || performanceTier === "low";
  const badgeLabel = showBadge ? ROLE_BADGE_LABELS[role] : null;

  if (role === "member") {
    return <span className={className}>{name}</span>;
  }

  return (
    <span className={cn(styles.shell, compact && styles.compactShell, className)}>
      {role === "beta_tester" ? (
        <m.span
          aria-hidden="true"
          className={cn(styles.gear, compact && styles.compactGear)}
          animate={renderLiteEffects ? undefined : { rotate: 360 }}
          transition={
            renderLiteEffects
              ? undefined
              : {
                  duration: 5.2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear"
                }
          }
        >
          ⚙
        </m.span>
      ) : null}

      <span
        className={cn(
          styles.text,
          compact && styles.compactText,
          role === "vip" && styles.vipText,
          role === "creator" && styles.creatorText,
          role === "beta_tester" && styles.betaText,
          role === "moderator" && styles.moderatorText
        )}
      >
        {name}
        <span aria-hidden="true" className={styles.effects}>
          {role === "vip" && !renderLiteEffects
            ? vipParticles.map((particle) => (
                <m.span
                  key={`vip-particle-${particle.left}`}
                  className={styles.vipParticle}
                  style={{ left: particle.left }}
                  animate={{
                    y: [-2, -18, -36],
                    x: [0, 2, -3],
                    opacity: [0, 0.66, 0]
                  }}
                  transition={{
                    duration: particle.duration,
                    delay: particle.delay,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeOut"
                  }}
                />
              ))
            : null}

          {role === "creator" && !renderLiteEffects
            ? lightningBolts.map((bolt) => (
                <m.span
                  key={`creator-bolt-${bolt.left}`}
                  className={styles.bolt}
                  style={{
                    width: bolt.width,
                    left: bolt.left,
                    rotate: `${bolt.rotate}deg`
                  }}
                  animate={{
                    opacity: [0, 0.9, 0.18, 0],
                    scaleX: [0.4, 1.08, 0.84, 0.2]
                  }}
                  transition={{
                    duration: bolt.duration,
                    delay: bolt.delay,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                />
              ))
            : null}

          {role === "beta_tester" && !renderLiteEffects ? (
            <m.span
              className={styles.scanLine}
              animate={{ y: ["-18%", "120%"], opacity: [0, 0.9, 0] }}
              transition={{
                duration: 2.2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear"
              }}
            />
          ) : null}

          {role === "moderator" ? <span className={styles.moderatorGlow} /> : null}
        </span>
      </span>

      {badgeLabel ? (
        <span
          className={cn(
            styles.badge,
            compact && styles.compactBadge,
            role === "vip" && styles.vipBadge,
            role === "creator" && styles.creatorBadge,
            role === "beta_tester" && styles.betaBadge,
            role === "moderator" && styles.moderatorBadge,
            badgeClassName
          )}
        >
          {badgeLabel}
        </span>
      ) : null}
    </span>
  );
}
