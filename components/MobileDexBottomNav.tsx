"use client";

import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { cn } from "@/lib/utils";

type MobileDexNavKey = "home" | "explore" | "favorites" | "profile" | "settings";

interface MobileDexBottomNavProps {
  activeKey?: MobileDexNavKey;
  className?: string;
  exploreHref?: string;
  settingsHref?: string;
  profileHref?: string;
  profileLabel?: string;
  onExplore?: () => void;
  onSettings?: () => void;
}

interface MobileDexNavActionProps {
  label: string;
  tone: MobileDexNavKey;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

function MobileDexNavIcon({ tone }: { tone: MobileDexNavKey }) {
  if (tone === "home") {
    return (
      <svg viewBox="0 0 28 28" aria-hidden className="h-7 w-7">
        <path
          d="M4.5 12.4 14 4.8l9.5 7.6v10.7a1.4 1.4 0 0 1-1.4 1.4H17v-6.5h-6v6.5H5.9a1.4 1.4 0 0 1-1.4-1.4Z"
          fill="var(--mobile-nav-icon-core)"
          stroke="var(--mobile-nav-icon-stroke)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M2.9 12.9 14 4l11.1 8.9"
          fill="none"
          stroke="var(--mobile-nav-icon-accent)"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (tone === "explore") {
    return (
      <svg viewBox="0 0 28 28" aria-hidden className="h-7 w-7">
        <circle
          cx="12.25"
          cy="12.25"
          r="6.9"
          fill="var(--mobile-nav-icon-core)"
          stroke="var(--mobile-nav-icon-stroke)"
          strokeWidth="1.8"
        />
        <path
          d="m17.2 17.3 5.2 5.1"
          fill="none"
          stroke="var(--mobile-nav-icon-accent)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle
          cx="12.25"
          cy="12.25"
          r="3"
          fill="rgba(255,255,255,0.28)"
        />
      </svg>
    );
  }

  if (tone === "favorites") {
    return (
      <svg viewBox="0 0 28 28" aria-hidden className="h-7 w-7">
        <path
          d="m14 23.1-1.43-1.28C6.11 15.98 3 13.1 3 8.94 3 6.02 5.28 3.9 8.2 3.9c2.03 0 3.98.96 5.2 2.48 1.22-1.52 3.17-2.48 5.2-2.48 2.92 0 5.4 2.12 5.4 5.04 0 4.16-3.11 7.04-9.57 12.88L14 23.1Z"
          fill="var(--mobile-nav-icon-core)"
          stroke="var(--mobile-nav-icon-stroke)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (tone === "profile") {
    return (
      <svg viewBox="0 0 28 28" aria-hidden className="h-7 w-7">
        <circle
          cx="14"
          cy="14"
          r="10.5"
          fill="var(--mobile-nav-icon-shell)"
          stroke="var(--mobile-nav-icon-stroke)"
          strokeWidth="1.8"
        />
        <path
          d="M4 14a10 10 0 0 1 20 0Z"
          fill="var(--mobile-nav-icon-accent)"
          stroke="var(--mobile-nav-icon-stroke)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M4 14h20"
          fill="none"
          stroke="var(--mobile-nav-icon-stroke)"
          strokeWidth="1.6"
        />
        <circle
          cx="14"
          cy="14"
          r="3.15"
          fill="var(--mobile-nav-icon-core)"
          stroke="var(--mobile-nav-icon-stroke)"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 28 28" aria-hidden className="h-7 w-7">
      <path
        d="m14 3.7 2 .5.8 2 2 .8.5 2 2 .9v2.2l-2 .9-.5 2-2 .8-.8 2-2 .5-2-.5-.8-2-2-.8-.5-2-2-.9v-2.2l2-.9.5-2 2-.8.8-2Z"
        fill="var(--mobile-nav-icon-core)"
        stroke="var(--mobile-nav-icon-stroke)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle
        cx="14"
        cy="14"
        r="3.1"
        fill="rgba(255,255,255,0.24)"
        stroke="var(--mobile-nav-icon-stroke)"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function MobileDexNavAction({
  label,
  tone,
  active = false,
  href,
  onClick,
  disabled = false
}: MobileDexNavActionProps) {
  const className = cn(
    "home-mobile-nav-action",
    `home-mobile-nav-action-${tone}`,
    "pixel-font",
    active && "home-mobile-nav-action-active",
    disabled && "home-mobile-nav-action-disabled"
  );

  const content = (
    <>
      <span className="home-mobile-nav-icon">
        <MobileDexNavIcon tone={tone} />
      </span>
      <span className="home-mobile-nav-label">{label}</span>
    </>
  );

  if (href && !disabled) {
    return (
      <RouteTransitionLink
        href={href}
        className={className}
        aria-current={active ? "page" : undefined}
      >
        {content}
      </RouteTransitionLink>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-pressed={active && !href ? true : undefined}
    >
      {content}
    </button>
  );
}

export function MobileDexBottomNav({
  activeKey = "explore",
  className,
  exploreHref,
  settingsHref,
  profileHref = "/profile/me",
  profileLabel = "Profile",
  onExplore,
  onSettings
}: MobileDexBottomNavProps) {
  return (
    <nav className={cn("home-mobile-bottom-nav md:hidden", className)} aria-label="Mobile navigation">
      <div className="home-mobile-bottom-nav-bar">
        <MobileDexNavAction label="Home" tone="home" href="/" active={activeKey === "home"} />
        <MobileDexNavAction
          label="Explore"
          tone="explore"
          active={activeKey === "explore"}
          href={onExplore ? undefined : (exploreHref ?? "/")}
          onClick={onExplore}
        />
        <MobileDexNavAction
          label="Favorites"
          tone="favorites"
          href="/favorites"
          active={activeKey === "favorites"}
        />
        <MobileDexNavAction
          label={profileLabel}
          tone="profile"
          href={profileHref}
          active={activeKey === "profile"}
        />
        <MobileDexNavAction
          label="Settings"
          tone="settings"
          active={activeKey === "settings"}
          href={onSettings ? undefined : settingsHref}
          onClick={onSettings}
          disabled={!onSettings && !settingsHref}
        />
      </div>
    </nav>
  );
}
