"use client";

import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { CreatorName } from "@/components/CreatorName";
import { useRole } from "@/components/RoleContext";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { resolveAvatarSrc } from "@/lib/avatar-url";

export function AuthTopBar() {
  const { data: session, status } = useSession();
  const { permissions } = useRole();
  const avatarSrc = resolveAvatarSrc(session?.user?.image) ?? "/images/characters/red.svg";

  return (
    <div className="sticky top-0 z-40 border-b border-black/20 bg-[linear-gradient(180deg,rgba(248,252,247,0.9),rgba(230,240,226,0.88))] backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[2560px] items-center justify-between gap-3 px-2 py-2 sm:px-4 lg:px-5">
        <div className="pixel-font text-[9px] uppercase tracking-[0.14em] text-black/70">
          Trainer Access
        </div>

        {status === "loading" ? (
          <div className="rounded-lg border border-black/20 bg-white/70 px-3 py-1 text-xs text-black/60">
            Checking session...
          </div>
        ) : session?.user ? (
          <div className="flex items-center gap-2">
            <div className="relative h-7 w-7 overflow-hidden rounded-full border border-black/25 bg-white/75">
              <Image
                src={avatarSrc}
                alt="Trainer avatar"
                fill
                sizes="28px"
                className="object-cover"
              />
            </div>
            <p className="text-xs text-black/70">
              <CreatorName
                name={session.user.name ?? session.user.email ?? "Trainer"}
                isCreator={session.user.isCreator === true}
                role={session.user.role}
                compact
              />{" "}
              <span className="text-black/45">
                ({session.user.provider === "google" ? "Google" : "Credentials"})
              </span>
            </p>
            <RouteTransitionLink
              href="/profile/me"
              exitDurationMs={220}
              className="gbc-nav-link rounded-lg border border-black/25 bg-white/75 px-3 py-1 text-xs text-black/75 transition hover:bg-white"
            >
              Profile
            </RouteTransitionLink>
            {permissions.accessAdmin ? (
              <RouteTransitionLink
                href="/admin"
                exitDurationMs={220}
                className="gbc-nav-link rounded-lg border border-black/25 bg-white/75 px-3 py-1 text-xs text-black/75 transition hover:bg-white"
              >
                Admin
              </RouteTransitionLink>
            ) : null}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-lg border border-black/25 bg-white/75 px-3 py-1 text-xs text-black/75 transition hover:bg-white"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <RouteTransitionLink
              href="/login"
              exitDurationMs={240}
              className="gbc-nav-link rounded-lg border border-black/25 bg-white/75 px-3 py-1 text-xs text-black/75 transition hover:bg-white"
            >
              Sign in
            </RouteTransitionLink>
            <RouteTransitionLink
              href="/register"
              exitDurationMs={240}
              className="gbc-nav-link rounded-lg border border-black/25 bg-white/75 px-3 py-1 text-xs text-black/75 transition hover:bg-white"
            >
              Create account
            </RouteTransitionLink>
          </div>
        )}
      </div>
    </div>
  );
}
