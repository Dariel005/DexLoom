"use client";

import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { type ReactNode } from "react";
import { CreatorName } from "@/components/CreatorName";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";

import { useTranslation } from "@/hooks/useTranslation";
import { resolveAvatarSrc } from "@/lib/avatar-url";
import { cn } from "@/lib/utils";

interface PokedexHeaderAccessProps {
  homeShortcut?: ReactNode;
  className?: string;
  tone?: "dark" | "light";
}

export function PokedexHeaderAccess({
  homeShortcut,
  className,
  tone = "light"
}: PokedexHeaderAccessProps) {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const avatarSrc = resolveAvatarSrc(session?.user?.image) ?? "/images/characters/red.svg";

  return (
    <div
      className={cn(
        "pokedex-header-access flex max-w-full flex-wrap items-center justify-end gap-2",
        tone === "dark" ? "pokedex-header-access-dark" : "pokedex-header-access-light",
        className
      )}
    >
      {homeShortcut}

      {status === "loading" ? (
        <span
          className={cn(
            "pokedex-header-loading rounded-lg border px-2.5 py-1 text-xs",
            tone === "dark"
              ? "border-white/30 bg-white/15 text-white/75"
              : "border-black/20 bg-white/70 text-black/60"
          )}
        >
          Checking session...
        </span>
      ) : session?.user ? (
        <div className="explorer-trainer-hub pokedex-header-trainer-hub">
          <div className="explorer-trainer-user pokedex-header-trainer-user">
            <span className="explorer-trainer-avatar">
              <Image
                src={avatarSrc}
                alt={t("header.trainerAvatar")}
                fill
                sizes="26px"
                className="object-cover"
              />
            </span>
            <span className="explorer-trainer-name">
              <CreatorName
                name={session.user.name ?? session.user.email ?? "Trainer"}
                isCreator={session.user.isCreator === true}
                className="pixel-font pokedex-header-creator-name"
                badgeClassName="pixel-font pokedex-header-creator-badge"
                compact
              />
            </span>
          </div>
          <div className="explorer-trainer-actions pokedex-header-actions-cluster">
            <RouteTransitionLink
              href="/profile/me"
              className="explorer-trainer-btn pokedex-header-action-btn pokedex-header-action-btn-profile explorer-trainer-btn-profile gbc-nav-link pixel-font rounded-lg px-2.5 py-1 text-[9px] uppercase tracking-[0.08em]"
            >
              Profile
            </RouteTransitionLink>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="explorer-trainer-btn pokedex-header-action-btn pokedex-header-action-btn-signout explorer-trainer-btn-signout pixel-font rounded-lg px-2.5 py-1 text-[9px] uppercase tracking-[0.08em]"
            >
              {t("header.signOut")}
            </button>
          </div>
        </div>
      ) : (
        <div className="pokedex-header-guest-pod flex flex-wrap items-center gap-2">
          <RouteTransitionLink
            href="/login"
            className="explorer-auth-btn pokedex-header-guest-btn pokedex-header-guest-btn-signin explorer-auth-btn-signin pixel-font inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-[#1f4b86]"
          >
            <span className="explorer-auth-dot" aria-hidden />
            <span className="relative z-[1]">{t("header.signIn")}</span>
          </RouteTransitionLink>
          <RouteTransitionLink
            href="/register"
            className="explorer-auth-btn pokedex-header-guest-btn pokedex-header-guest-btn-register explorer-auth-btn-register pixel-font inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-[#fff4c7]"
          >
            <span className="explorer-auth-dot" aria-hidden />
            <span className="relative z-[1]">{t("header.createAccount")}</span>
          </RouteTransitionLink>
        </div>
      )}
    </div>
  );
}
