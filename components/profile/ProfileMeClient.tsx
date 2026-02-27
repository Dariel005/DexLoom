"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreatorName } from "@/components/CreatorName";
import { PokedexFrame } from "@/components/PokedexFrame";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { ProfileAvatarLightbox } from "@/components/profile/ProfileAvatarLightbox";
import { ProfileAvatarCropper } from "@/components/profile/ProfileAvatarCropper";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import {
  calculateProfileCompleteness,
  formatFavoriteEntityLabel,
  getFavoriteEntityInsights,
  getFavoriteTagInsights,
  getRecentFavorites
} from "@/lib/profile-insights";
import {
  type FavoriteEntityType,
  type FavoriteRecord,
  type UserProfileRecord
} from "@/lib/profile-types";
import { resolveAvatarSrc } from "@/lib/avatar-url";
import { cn } from "@/lib/utils";

const PROFILE_CACHE_KEY = "pokedex.profile.cache.v1";
const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
type ProfileConsoleTab = "overview" | "editor" | "intel" | "radar" | "captures";

interface PersistedProfileCache {
  version: 1;
  users: Record<string, UserProfileRecord>;
}

function loadProfileCache(userId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PersistedProfileCache;
    if (!parsed || parsed.version !== 1 || typeof parsed.users !== "object") {
      return null;
    }
    return parsed.users[userId] ?? null;
  } catch {
    return null;
  }
}

function saveProfileCache(userId: string, profile: UserProfileRecord) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const raw = window.localStorage.getItem(PROFILE_CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as PersistedProfileCache) : null;
    const cache: PersistedProfileCache =
      parsed && parsed.version === 1 && typeof parsed.users === "object"
        ? parsed
        : { version: 1, users: {} };

    cache.users[userId] = profile;
    window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

function formatAbsoluteDate(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "Unknown";
  }
  return new Date(parsed).toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

function formatRelativeDate(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "Unknown";
  }
  const deltaMs = Date.now() - parsed;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (deltaMs < minute) return "just now";
  if (deltaMs < hour) return `${Math.max(1, Math.floor(deltaMs / minute))}m ago`;
  if (deltaMs < day) return `${Math.max(1, Math.floor(deltaMs / hour))}h ago`;
  if (deltaMs < day * 7) return `${Math.max(1, Math.floor(deltaMs / day))}d ago`;
  return formatAbsoluteDate(value);
}

function buildPokemonFallbackImageUrl(entityId: string) {
  const numericId = Number(entityId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${numericId}.png`;
}

function normalizeFavoriteImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) {
    return null;
  }
  return imageUrl.replace("/sprites/items/dream-world/", "/sprites/items/");
}

function resolveFavoritePreviewImage(entry: FavoriteRecord) {
  const normalized = normalizeFavoriteImageUrl(entry.imageUrl);
  if (normalized) {
    return normalized;
  }
  if (entry.entityType === "pokemon") {
    return buildPokemonFallbackImageUrl(entry.entityId);
  }
  return null;
}

function getFavoriteEntityRoute(entityType: FavoriteEntityType) {
  switch (entityType) {
    case "game":
      return "/games";
    case "pokemon":
      return "/";
    case "item":
      return "/items";
    case "move":
      return "/moves";
    case "ability":
      return "/abilities";
    case "type":
      return "/types";
    case "card":
      return "/cards";
    case "character":
      return "/characters";
    case "mega":
      return "/mega-evolutions";
    case "mega_stone":
      return "/mega-evolutions/stones";
    case "map_region":
    case "location":
      return "/maps";
    case "pokemon_go_activity":
    case "pokemon_go_item":
      return "/pokemon-go";
    case "mechanics_topic":
      return "/mechanics";
    default:
      return "/favorites";
  }
}

function resolveFavoriteEntryHref(entry: FavoriteRecord) {
  if (typeof entry.href === "string" && entry.href.startsWith("/")) {
    return entry.href;
  }
  return getFavoriteEntityRoute(entry.entityType);
}

function getFavoriteFallbackCode(entityType: FavoriteEntityType) {
  switch (entityType) {
    case "game":
      return "GM";
    case "pokemon":
      return "PK";
    case "item":
      return "IT";
    case "move":
      return "MV";
    case "ability":
      return "AB";
    case "type":
      return "TP";
    case "card":
      return "CD";
    case "character":
      return "CH";
    case "mega":
      return "MG";
    case "mega_stone":
      return "MS";
    case "map_region":
    case "location":
      return "MP";
    case "pokemon_go_activity":
    case "pokemon_go_item":
      return "GO";
    case "mechanics_topic":
      return "ME";
    default:
      return "ID";
  }
}

function applyProfileDraft(
  nextProfile: UserProfileRecord,
  setDisplayName: (value: string) => void,
  setBio: (value: string) => void,
  setVisibility: (value: "private" | "public") => void,
  setShowFavoritesOnPublic: (value: boolean) => void
) {
  setDisplayName(nextProfile.displayName);
  setBio(nextProfile.bio);
  setVisibility(nextProfile.visibility);
  setShowFavoritesOnPublic(nextProfile.showFavoritesOnPublic);
}

export function ProfileMeClient() {
  const { data: session, status, update } = useSession();
  const favorites = useUserFavorites();
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [showFavoritesOnPublic, setShowFavoritesOnPublic] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isAvatarLightboxOpen, setIsAvatarLightboxOpen] = useState(false);
  const [avatarCropDraft, setAvatarCropDraft] = useState<{ file: File; previewUrl: string } | null>(null);
  const [selectedAvatarFileName, setSelectedAvatarFileName] = useState("No file selected");
  const [activeConsoleTab, setActiveConsoleTab] = useState<ProfileConsoleTab>("overview");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const userId = session?.user?.id ?? null;
  const isCreatorProfile = session?.user?.isCreator === true || profile?.isCreator === true;

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const cached = loadProfileCache(userId);
    if (cached) {
      setProfile(cached);
      applyProfileDraft(
        cached,
        setDisplayName,
        setBio,
        setVisibility,
        setShowFavoritesOnPublic
      );
    }

    let cancelled = false;
    const load = async () => {
      setIsLoadingProfile(true);
      try {
        const response = await fetch("/api/profile/me");
        if (!response.ok) throw new Error("Unable to load profile.");
        const nextProfile = (await response.json()) as UserProfileRecord;
        if (cancelled) return;
        setProfile(nextProfile);
        applyProfileDraft(
          nextProfile,
          setDisplayName,
          setBio,
          setVisibility,
          setShowFavoritesOnPublic
        );
        saveProfileCache(userId, nextProfile);
      } catch (error) {
        if (!cancelled) setErrorMessage(error instanceof Error ? error.message : "Unable to load profile.");
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    return () => {
      if (avatarCropDraft?.previewUrl) {
        URL.revokeObjectURL(avatarCropDraft.previewUrl);
      }
    };
  }, [avatarCropDraft]);

  const displayNameValidation = useMemo(() => {
    const trimmed = displayName.trim();
    if (trimmed.length === 0) {
      return "Display name cannot be empty.";
    }
    if (trimmed.length < 3) {
      return "Display name must have at least 3 characters.";
    }
    return null;
  }, [displayName]);

  const hasUnsavedChanges = useMemo(() => {
    if (!profile) {
      return false;
    }
    return (
      displayName.trim() !== profile.displayName ||
      bio !== profile.bio ||
      visibility !== profile.visibility ||
      showFavoritesOnPublic !== profile.showFavoritesOnPublic
    );
  }, [bio, displayName, profile, showFavoritesOnPublic, visibility]);

  useEffect(() => {
    if (!hasUnsavedChanges || typeof window === "undefined") {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleSaveProfile = useCallback(async () => {
    if (!userId) return;
    if (displayNameValidation) {
      setErrorMessage(displayNameValidation);
      setInfoMessage(null);
      return;
    }
    if (!hasUnsavedChanges) {
      setInfoMessage("No changes to save.");
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    setInfoMessage(null);
    try {
      const nextDisplayName = displayName.trim();
      const response = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: nextDisplayName, bio, visibility, showFavoritesOnPublic })
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message ?? "Unable to update profile.");
      }
      const nextProfile = (await response.json()) as UserProfileRecord;
      setProfile(nextProfile);
      saveProfileCache(userId, nextProfile);
      await update({ user: { name: nextProfile.displayName, image: nextProfile.avatarUrl } });
      setInfoMessage("Profile updated.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  }, [
    bio,
    displayName,
    displayNameValidation,
    hasUnsavedChanges,
    showFavoritesOnPublic,
    update,
    userId,
    visibility
  ]);

  const handleDiscardChanges = useCallback(() => {
    if (!profile) {
      return;
    }
    applyProfileDraft(
      profile,
      setDisplayName,
      setBio,
      setVisibility,
      setShowFavoritesOnPublic
    );
    setInfoMessage("Draft changes discarded.");
    setErrorMessage(null);
  }, [profile]);

  const handleAvatarChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!userId) {
        event.target.value = "";
        return;
      }

      const file = event.target.files?.[0];
      if (!file) {
        event.target.value = "";
        return;
      }

      const mimeType = String(file.type ?? "").toLowerCase();
      if (!ALLOWED_AVATAR_MIME_TYPES.has(mimeType)) {
        setErrorMessage("Unsupported file type. Use jpg, png, or webp.");
        setInfoMessage(null);
        event.target.value = "";
        return;
      }

      if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_AVATAR_FILE_SIZE) {
        setErrorMessage("Avatar must be 2MB or less.");
        setInfoMessage(null);
        event.target.value = "";
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setAvatarCropDraft({ file, previewUrl });
      setSelectedAvatarFileName(file.name);
      setErrorMessage(null);
      setInfoMessage(null);
      event.target.value = "";
    },
    [userId]
  );

  const handleCancelAvatarCrop = useCallback(() => {
    if (isUploadingAvatar) {
      return;
    }
    setAvatarCropDraft(null);
    setSelectedAvatarFileName("No file selected");
  }, [isUploadingAvatar]);

  const handleUploadCroppedAvatar = useCallback(
    async (croppedBlob: Blob) => {
      if (!userId || !avatarCropDraft) {
        return;
      }

      setIsUploadingAvatar(true);
      setErrorMessage(null);
      setInfoMessage(null);
      try {
        const baseFileName = avatarCropDraft.file.name.replace(/\.[^/.]+$/, "");
        const croppedFileName = `${baseFileName || "avatar"}-crop.webp`;
        const formData = new FormData();
        formData.append("file", croppedBlob, croppedFileName);

        const response = await fetch("/api/profile/avatar", { method: "POST", body: formData });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(payload.message ?? "Unable to upload avatar.");
        }

        const payload = (await response.json()) as { avatarUrl: string };
        setProfile((current) => (current ? { ...current, avatarUrl: payload.avatarUrl } : current));
        await update({ user: { name: displayName, image: payload.avatarUrl } });
        setSelectedAvatarFileName(croppedFileName);
        setAvatarCropDraft(null);
        setInfoMessage("Avatar updated.");
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to upload avatar.");
      } finally {
        setIsUploadingAvatar(false);
      }
    },
    [avatarCropDraft, displayName, update, userId]
  );

  const handleOpenAvatarPicker = useCallback(() => {
    if (isUploadingAvatar || avatarCropDraft !== null) {
      return;
    }

    avatarInputRef.current?.click();
  }, [avatarCropDraft, isUploadingAvatar]);

  const openAvatarLightbox = useCallback(() => {
    setIsAvatarLightboxOpen(true);
  }, []);

  const closeAvatarLightbox = useCallback(() => {
    setIsAvatarLightboxOpen(false);
  }, []);

  const handleCopyPublicLink = useCallback(async () => {
    if (!userId || typeof window === "undefined") return;
    const url = `${window.location.origin}/profile/${userId}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setInfoMessage("Public profile link copied.");
        return;
      }
      window.prompt("Copy this URL:", url);
    } catch {
      setErrorMessage("Unable to copy profile URL.");
    }
  }, [userId]);

  const entityInsights = useMemo(() => getFavoriteEntityInsights(favorites.items), [favorites.items]);
  const tagInsights = useMemo(() => getFavoriteTagInsights(favorites.items, 10), [favorites.items]);
  const recentFavorites = useMemo(() => getRecentFavorites(favorites.items, 5), [favorites.items]);
  const leadingTag = tagInsights[0] ?? null;
  const leadingModule = entityInsights[0] ?? null;

  const profileCompletion = useMemo(
    () =>
      calculateProfileCompleteness({
        profile:
          profile !== null
            ? {
                displayName,
                bio,
                avatarUrl: profile.avatarUrl,
                visibility,
                showFavoritesOnPublic
              }
            : null,
        fallbackDisplayName: session?.user?.name,
        favoritesCount: favorites.items.length,
        moduleCount: entityInsights.length
      }),
    [
      bio,
      displayName,
      entityInsights.length,
      favorites.items.length,
      profile,
      session?.user?.name,
      showFavoritesOnPublic,
      visibility
    ]
  );

  if (status === "loading") {
    return (
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <div className="rounded-2xl border border-black/20 bg-white/65 p-4 text-sm text-black/75">Checking session...</div>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <PokedexFrame
          title="Trainer Profile"
          status="idle"
          leftPanel={
            <section className="profile-theme-matrix space-y-4">
              <section className="profile-surface p-4">
                <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Trainer Profile</p>
                <h1 className="pixel-font mt-2 text-[14px] uppercase tracking-[0.12em] text-black/84">Sign in required</h1>
                <p className="mt-2 text-sm text-black/72">Sign in to edit your profile and sync favorites across modules.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <RouteTransitionLink href="/login" className="rounded-md border border-black/25 bg-white/80 px-3 py-2 text-xs text-black/75">Go to login</RouteTransitionLink>
                  <RouteTransitionLink href="/register" className="rounded-md border border-black/25 bg-white/80 px-3 py-2 text-xs text-black/75">Create account</RouteTransitionLink>
                </div>
              </section>
            </section>
          }
          rightPanel={
            <section className="profile-theme-matrix space-y-4">
              <section className="profile-surface p-4">
                <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">Navigation</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <RouteTransitionLink href="/" className="rounded-md border border-black/25 bg-white/80 px-2.5 py-1 text-xs text-black/75">Back to Pokedex</RouteTransitionLink>
                </div>
              </section>
            </section>
          }
        />
      </main>
    );
  }

  const activeDisplayName =
    displayName.trim() || profile?.displayName || session?.user?.name || session?.user?.email || "Trainer";
  const avatarPreviewSrc =
    resolveAvatarSrc(profile?.avatarUrl ?? session?.user?.image) ?? "/images/characters/red.svg";
  const checklistPreview = profileCompletion.checklist.slice(0, 6);
  const hiddenChecklistCount = Math.max(0, profileCompletion.checklist.length - checklistPreview.length);

  const leftPanel = (
    <section className="profile-theme-matrix space-y-4">
      <section id="profile-identity" className="profile-surface profile-surface-hero profile-trainer-profile-card scroll-mt-28 p-4">
        <p className="pixel-font text-[12px] uppercase tracking-[0.16em] text-black/70">Trainer Identity Matrix</p>
        <div className="profile-hero-grid profile-trainer-profile-grid mt-3">
          <div className="profile-avatar-column profile-avatar-column-editable">
            <div className="profile-avatar-panel profile-trainer-avatar-panel">
              <button
                type="button"
                className="profile-avatar-zoom-trigger"
                onClick={openAvatarLightbox}
                aria-label="Open profile avatar preview"
              >
                <div className="profile-avatar-shell h-40 w-40">
                  <Image
                    src={avatarPreviewSrc}
                    alt="Trainer avatar"
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </div>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar || avatarCropDraft !== null}
                className="sr-only"
                aria-label="Choose profile picture file"
              />
              <div className="profile-avatar-upload-row">
                <button
                  type="button"
                  onClick={handleOpenAvatarPicker}
                  disabled={isUploadingAvatar || avatarCropDraft !== null}
                  className="profile-avatar-upload-btn pixel-font"
                >
                  {isUploadingAvatar ? "Uploading..." : avatarCropDraft ? "Cropping..." : "Choose file"}
                </button>
              </div>
              <p className="profile-avatar-upload-name text-sm" title={selectedAvatarFileName}>
                {selectedAvatarFileName}
              </p>
              <div className="profile-avatar-file-meta">
                <p className="profile-avatar-file-hint">JPG/PNG/WEBP | 2MB max</p>
                <span
                  className={cn(
                    "profile-avatar-file-status",
                    isUploadingAvatar && "profile-avatar-file-status-uploading"
                  )}
                >
                  {isUploadingAvatar ? "Uploading..." : avatarCropDraft ? "Cropping..." : "Ready"}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-identity-stack profile-trainer-info-stack space-y-3">
            <div className="profile-identity-heading flex flex-wrap items-center gap-2">
              <CreatorName
                name={activeDisplayName}
                isCreator={isCreatorProfile}
                className="pixel-font text-[17px] uppercase tracking-[0.12em] text-black/85"
              />
              {isCreatorProfile ? <span className="profile-chip profile-chip-creator">Creator Core</span> : null}
              <span className={cn("profile-chip", visibility === "public" ? "profile-chip-public" : "profile-chip-private")}>
                {visibility === "public" ? "Public" : "Private"}
              </span>
            </div>

            <p className="profile-identity-meta text-sm text-black/62">
              Joined {formatAbsoluteDate(profile?.createdAt)} | Last update {formatRelativeDate(profile?.updatedAt)}
            </p>
            <p className="profile-identity-bio profile-trainer-bio rounded-xl border border-black/20 bg-white/74 px-3 py-2 text-sm text-black/74">
              {bio.trim().length > 0 ? bio : "Add a short trainer bio to make the profile complete."}
            </p>

            <div className="profile-metric-grid profile-metric-grid-identity">
              <div className="profile-metric-tile"><span className="profile-metric-label">Completion</span><span className="profile-metric-value">{profileCompletion.score}%</span></div>
              <div className="profile-metric-tile"><span className="profile-metric-label">Favorites</span><span className="profile-metric-value">{favorites.items.length}</span></div>
              <div className="profile-metric-tile"><span className="profile-metric-label">Modules</span><span className="profile-metric-value">{entityInsights.length}</span></div>
              <div className="profile-metric-tile"><span className="profile-metric-label">Public Fav</span><span className="profile-metric-value text-[12px]">{showFavoritesOnPublic ? "Enabled" : "Disabled"}</span></div>
            </div>

            <div className="profile-trainer-action-grid">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving || isLoadingProfile || Boolean(displayNameValidation) || !hasUnsavedChanges}
                className={cn("profile-trainer-action-btn profile-trainer-action-green", (isSaving || isLoadingProfile || Boolean(displayNameValidation) || !hasUnsavedChanges) && "opacity-60")}
              >
                {isSaving ? "Saving..." : "Save profile"}
              </button>
              <button
                type="button"
                onClick={handleDiscardChanges}
                disabled={isSaving || isLoadingProfile || !hasUnsavedChanges}
                className={cn("profile-trainer-action-btn profile-trainer-action-red", (isSaving || isLoadingProfile || !hasUnsavedChanges) && "opacity-60")}
              >
                Discard changes
              </button>
              <RouteTransitionLink
                href={`/profile/${userId}`}
                className="profile-trainer-action-btn profile-trainer-action-green"
              >
                Open public profile
              </RouteTransitionLink>
              <button
                type="button"
                onClick={handleCopyPublicLink}
                className="profile-trainer-action-btn profile-trainer-action-neutral"
              >
                Copy profile URL
              </button>
            </div>
            <div className="profile-gba-quick-links">
              <button
                type="button"
                onClick={() => setActiveConsoleTab("editor")}
                className="profile-trainer-action-btn profile-trainer-action-neutral"
              >
                Open editor console
              </button>
              <button
                type="button"
                onClick={() => setActiveConsoleTab("intel")}
                className="profile-trainer-action-btn profile-trainer-action-neutral"
              >
                Open intel console
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between"><span className="text-sm text-black/62">Profile completion</span><span className="text-sm text-black/62">{profileCompletion.score}%</span></div>
          <div className="profile-progress-track"><span className="profile-progress-fill" style={{ width: `${Math.max(4, profileCompletion.score)}%` }} /></div>
        </div>

        <div className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {checklistPreview.map((entry) => (
            <p
              key={entry.id}
              className={cn(
                "profile-checklist-item rounded-lg border px-2.5 py-2 text-sm",
                entry.done ? "profile-checklist-item-done border-emerald-400/55 bg-emerald-100/55 text-emerald-900" : "border-black/20 bg-white/72 text-black/68"
              )}
            >
              {entry.done ? "OK" : "Pending"} | {entry.label}
            </p>
          ))}
        </div>
        {hiddenChecklistCount > 0 ? (
          <p className="mt-2 text-xs text-black/62">
            +{hiddenChecklistCount} additional checklist rule(s) in Intel console.
          </p>
        ) : null}

        {infoMessage ? <p className="mt-3 rounded-lg border border-emerald-300 bg-emerald-100/70 px-3 py-2 text-sm text-emerald-900">{infoMessage}</p> : null}
        {errorMessage ? <p className="mt-3 rounded-lg border border-rose-300 bg-rose-100/70 px-3 py-2 text-sm text-rose-900">{errorMessage}</p> : null}
      </section>

      {activeConsoleTab === "overview" ? (
        <section className="profile-surface profile-editor-panel profile-gba-overview-panel p-4">
          <div className="profile-editor-head flex flex-wrap items-center justify-between gap-2">
            <p className="pixel-font text-[12px] uppercase tracking-[0.16em] text-black/70">Trainer Console Overview</p>
            <span className={cn("profile-sync-pill", hasUnsavedChanges ? "profile-sync-pill-unsaved" : "profile-sync-pill-synced")}>
              {hasUnsavedChanges ? "Draft pending" : "Synced"}
            </span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setActiveConsoleTab("editor")}
              className="profile-editor-btn profile-editor-btn-primary px-3 py-2 text-sm transition"
            >
              Open Editor Module
            </button>
            <button
              type="button"
              onClick={() => setActiveConsoleTab("intel")}
              className="profile-editor-btn px-3 py-2 text-sm transition"
            >
              Open Favorite Intel
            </button>
            <button
              type="button"
              onClick={() => setActiveConsoleTab("radar")}
              className="profile-editor-btn px-3 py-2 text-sm transition"
            >
              Open Module Radar
            </button>
            <button
              type="button"
              onClick={() => setActiveConsoleTab("captures")}
              className="profile-editor-btn px-3 py-2 text-sm transition"
            >
              Open Recent Captures
            </button>
          </div>
        </section>
      ) : null}

      {activeConsoleTab === "editor" ? (
        <section id="profile-editor" className="profile-surface profile-editor-panel scroll-mt-28 p-4">
        <div className="profile-editor-head flex flex-wrap items-center justify-between gap-2">
          <p className="pixel-font text-[12px] uppercase tracking-[0.16em] text-black/70">Profile Editor</p>
          <span
            className={cn(
              "profile-sync-pill",
              hasUnsavedChanges ? "profile-sync-pill-unsaved" : "profile-sync-pill-synced"
            )}
          >
            {hasUnsavedChanges ? "Unsaved changes" : "Synced"}
          </span>
        </div>
        <p className="profile-editor-counter mt-2 text-sm text-black/60">
          Name {displayName.trim().length}/60 | Bio {bio.length}/320
        </p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <label className="profile-editor-field block space-y-1">
            <span className="profile-editor-field-label pixel-font text-[10px] uppercase tracking-[0.12em] text-black/66">Display Name</span>
            <input
              id="profile-display-name"
              name="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={60}
              className={cn(
                "profile-editor-input w-full px-3 py-2 text-sm",
                displayNameValidation && "profile-editor-input-invalid"
              )}
            />
            {displayNameValidation ? (
              <span className="profile-editor-validation text-sm">{displayNameValidation}</span>
            ) : null}
          </label>
          <label className="profile-editor-field block space-y-1">
            <span className="profile-editor-field-label pixel-font text-[10px] uppercase tracking-[0.12em] text-black/66">Visibility</span>
            <select value={visibility} onChange={(event) => setVisibility(event.target.value as "private" | "public")} className="profile-editor-input w-full px-3 py-2 text-sm">
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </label>
        </div>

        <label className="profile-editor-field mt-3 block space-y-1">
          <span className="profile-editor-field-label pixel-font text-[10px] uppercase tracking-[0.12em] text-black/66">Bio</span>
          <textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={320} rows={4} className="profile-editor-input profile-editor-textarea w-full resize-y px-3 py-2 text-sm" />
        </label>

        <label className="profile-editor-toggle-row mt-3 flex items-center gap-2 px-3 py-2 text-sm">
          <input type="checkbox" checked={showFavoritesOnPublic} onChange={(event) => setShowFavoritesOnPublic(event.target.checked)} className="profile-editor-toggle-input h-4 w-4" />
          Show favorites on public profile
        </label>

        <div className="profile-editor-actions mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={isSaving || isLoadingProfile || Boolean(displayNameValidation) || !hasUnsavedChanges}
            className={cn("profile-editor-btn profile-editor-btn-primary px-3 py-2 text-sm transition", (isSaving || isLoadingProfile || Boolean(displayNameValidation) || !hasUnsavedChanges) && "opacity-60")}
          >
            {isSaving ? "Saving..." : "Save profile"}
          </button>
          <button
            type="button"
            onClick={handleDiscardChanges}
            disabled={isSaving || isLoadingProfile || !hasUnsavedChanges}
            className={cn("profile-editor-btn px-3 py-2 text-sm transition", (isSaving || isLoadingProfile || !hasUnsavedChanges) && "opacity-60")}
          >
            Discard changes
          </button>
          <RouteTransitionLink href="/favorites" className="profile-editor-btn px-3 py-2 text-sm transition">Open favorites hub</RouteTransitionLink>
          <button type="button" onClick={handleCopyPublicLink} className="profile-editor-btn px-3 py-2 text-sm transition">Copy public URL</button>
        </div>
        </section>
      ) : null}

      {activeConsoleTab === "intel" ? (
        <section id="profile-intel" className="profile-surface profile-intel-panel scroll-mt-28 p-4">
        <div className="profile-intel-header">
          <div>
            <p className="pixel-font text-[12px] uppercase tracking-[0.16em] text-black/70">Favorite Intelligence</p>
            <p className="mt-1 text-sm text-black/60">
              Radar overview for captures, module spread, and indexing quality.
            </p>
          </div>
          <RouteTransitionLink
            href="/favorites"
            className="profile-intel-link px-2.5 py-1 text-sm"
          >
            Open favorites hub
          </RouteTransitionLink>
        </div>

        <div className="profile-intel-stat-grid mt-3">
          <article className="profile-intel-stat-card">
            <span className="profile-intel-stat-label">Total Favorites</span>
            <span className="profile-intel-stat-value">{favorites.items.length}</span>
          </article>
          <article className="profile-intel-stat-card">
            <span className="profile-intel-stat-label">Active Modules</span>
            <span className="profile-intel-stat-value">{entityInsights.length}</span>
          </article>
          <article className="profile-intel-stat-card">
            <span className="profile-intel-stat-label">Top Signal</span>
            <span className="profile-intel-stat-value text-[13px]">
              {leadingModule ? `${leadingModule.label} ${leadingModule.count}` : "No data"}
            </span>
          </article>
          <article className="profile-intel-stat-card">
            <span className="profile-intel-stat-label">Primary Tag</span>
            <span className="profile-intel-stat-value text-[13px]">
              {leadingTag ? `${leadingTag.tag} x${leadingTag.count}` : "No tags"}
            </span>
          </article>
        </div>

        <div className="profile-intel-layout mt-3 grid gap-3 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="profile-intel-radar space-y-2">
            {entityInsights.length === 0 ? (
              <p className="rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-4 text-sm text-black/64">
                Capture favorites across modules to generate your trainer radar.
              </p>
            ) : (
              entityInsights.slice(0, 8).map((entry) => (
                <div key={entry.entityType} className="profile-intel-signal-row">
                  <div className="flex items-center justify-between text-sm text-black/70">
                    <span className="pixel-font text-[10px] uppercase tracking-[0.12em]">{entry.label}</span>
                    <span className="font-semibold">{entry.count}</span>
                  </div>
                  <div className="profile-intel-signal-track">
                    <span
                      className="profile-intel-signal-fill"
                      style={{ width: `${Math.max(10, Math.round(entry.ratio * 100))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3">
            <article className="profile-intel-tags p-3">
              <p className="pixel-font text-[10px] uppercase tracking-[0.12em] text-black/66">Top Tags</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tagInsights.length === 0 ? (
                  <p className="text-sm text-black/58">No tags indexed yet.</p>
                ) : (
                  tagInsights.map((entry) => (
                    <span key={entry.tag} className="profile-intel-tag-chip">
                      {entry.tag} x{entry.count}
                    </span>
                  ))
                )}
              </div>
            </article>
          </div>
        </div>
        </section>
      ) : null}
    </section>
  );

  const rightPanel = (
    <section className="profile-theme-matrix profile-gba-console space-y-4">
      <section className="profile-surface profile-side-panel p-4">
        <p className="pixel-font text-[11px] uppercase tracking-[0.16em] text-black/70">PokéNav Profile Console</p>
        <div className="profile-side-nav-links profile-gba-top-links mt-2 flex flex-wrap gap-2">
          <RouteTransitionLink href="/" className="profile-side-nav-link px-2.5 py-1 text-sm">Back to Pokedex</RouteTransitionLink>
          <RouteTransitionLink href="/favorites" className="profile-side-nav-link px-2.5 py-1 text-sm">Favorites</RouteTransitionLink>
          <RouteTransitionLink href="/social" className="profile-side-nav-link px-2.5 py-1 text-sm">Social</RouteTransitionLink>
          <RouteTransitionLink href={`/profile/${userId}`} className="profile-side-nav-link px-2.5 py-1 text-sm">Open public profile</RouteTransitionLink>
          <button type="button" onClick={handleCopyPublicLink} className="profile-side-nav-link px-2.5 py-1 text-sm transition">Copy URL</button>
        </div>
        <div className="profile-gba-tab-grid mt-3">
          <button
            type="button"
            onClick={() => setActiveConsoleTab("overview")}
            className={cn("profile-side-nav-link profile-gba-tab-btn px-2.5 py-1 text-sm", activeConsoleTab === "overview" && "profile-gba-tab-btn-active")}
          >
            <span>Overview</span>
            <span className="profile-gba-tab-pill">{hasUnsavedChanges ? "draft" : "ok"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveConsoleTab("editor")}
            className={cn("profile-side-nav-link profile-gba-tab-btn px-2.5 py-1 text-sm", activeConsoleTab === "editor" && "profile-gba-tab-btn-active")}
          >
            <span>Editor</span>
            <span className="profile-gba-tab-pill">{hasUnsavedChanges ? "edit" : "sync"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveConsoleTab("intel")}
            className={cn("profile-side-nav-link profile-gba-tab-btn px-2.5 py-1 text-sm", activeConsoleTab === "intel" && "profile-gba-tab-btn-active")}
          >
            <span>Intel</span>
            <span className="profile-gba-tab-pill">{tagInsights.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveConsoleTab("radar")}
            className={cn("profile-side-nav-link profile-gba-tab-btn px-2.5 py-1 text-sm", activeConsoleTab === "radar" && "profile-gba-tab-btn-active")}
          >
            <span>Radar</span>
            <span className="profile-gba-tab-pill">{entityInsights.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveConsoleTab("captures")}
            className={cn("profile-side-nav-link profile-gba-tab-btn px-2.5 py-1 text-sm", activeConsoleTab === "captures" && "profile-gba-tab-btn-active")}
          >
            <span>Captures</span>
            <span className="profile-gba-tab-pill">{recentFavorites.length}</span>
          </button>
        </div>
      </section>

      {activeConsoleTab === "overview" || activeConsoleTab === "radar" ? (
        <section className="profile-surface profile-side-panel p-4">
        <p className="pixel-font text-[11px] uppercase tracking-[0.16em] text-black/70">Module Radar</p>
        <div className="mt-2 space-y-2">
          {entityInsights.length === 0 ? <p className="profile-side-empty px-3 py-3 text-sm">No module activity yet.</p> : entityInsights.slice(0, activeConsoleTab === "overview" ? 4 : 6).map((entry) => (
            <RouteTransitionLink
              key={`profile-radar-${entry.entityType}`}
              href={getFavoriteEntityRoute(entry.entityType)}
              className="profile-side-radar-row"
              aria-label={`Open ${entry.label}`}
            >
              <div className="flex items-center justify-between text-sm text-black/74"><span>{entry.label}</span><span>{entry.count}</span></div>
              <div className="profile-side-radar-track"><span className="profile-side-radar-fill" style={{ width: `${Math.max(10, Math.round(entry.ratio * 100))}%` }} /></div>
            </RouteTransitionLink>
          ))}
        </div>
        {activeConsoleTab === "overview" && entityInsights.length > 4 ? (
          <p className="mt-2 text-xs text-black/62">+{entityInsights.length - 4} module(s) more in Radar view.</p>
        ) : null}
        </section>
      ) : null}

      {activeConsoleTab === "overview" || activeConsoleTab === "captures" ? (
        <section className="profile-surface profile-side-panel p-4">
        <p className="pixel-font text-[11px] uppercase tracking-[0.16em] text-black/70">Recent Captures</p>
        <div className="profile-side-capture-list mt-2 space-y-2">
          {recentFavorites.length === 0 ? <p className="profile-side-empty px-3 py-3 text-sm">No captures yet.</p> : recentFavorites.slice(0, activeConsoleTab === "overview" ? 3 : 5).map((entry) => {
            const previewImage = resolveFavoritePreviewImage(entry);
            const entryHref = resolveFavoriteEntryHref(entry);
            return (
              <RouteTransitionLink
                key={`profile-recent-${entry.id}`}
                href={entryHref}
                className="profile-side-capture-card"
                aria-label={`Open ${entry.title}`}
              >
                <div className="profile-side-capture-thumb">
                  {previewImage ? (
                    <Image
                      src={previewImage}
                      alt={`${entry.title} preview`}
                      fill
                      sizes="56px"
                      className="object-contain"
                    />
                  ) : (
                    <span className="profile-side-capture-fallback" data-entity={entry.entityType}>
                      {getFavoriteFallbackCode(entry.entityType)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="pixel-font truncate text-[11px] uppercase tracking-[0.11em] text-black/82">{entry.title}</p>
                  <p className="mt-0.5 truncate text-[13px] text-black/62">{formatFavoriteEntityLabel(entry.entityType)} | {formatRelativeDate(entry.createdAt)}</p>
                </div>
              </RouteTransitionLink>
            );
          })}
        </div>
        {activeConsoleTab === "overview" && recentFavorites.length > 3 ? (
          <p className="mt-2 text-xs text-black/62">+{recentFavorites.length - 3} capture(s) more in Captures view.</p>
        ) : null}
        </section>
      ) : null}

      {activeConsoleTab === "editor" || activeConsoleTab === "intel" ? (
        <section className="profile-surface profile-side-panel profile-gba-overview-panel p-4">
          <p className="pixel-font text-[11px] uppercase tracking-[0.16em] text-black/70">
            {activeConsoleTab === "editor" ? "Editor Shortcuts" : "Intel Shortcuts"}
          </p>
          <div className="mt-2 grid gap-2">
            <button type="button" onClick={() => setActiveConsoleTab("overview")} className="profile-side-nav-link px-2.5 py-1 text-sm transition">
              Return to overview
            </button>
            <button type="button" onClick={() => setActiveConsoleTab("radar")} className="profile-side-nav-link px-2.5 py-1 text-sm transition">
              Open module radar
            </button>
            <button type="button" onClick={() => setActiveConsoleTab("captures")} className="profile-side-nav-link px-2.5 py-1 text-sm transition">
              Open recent captures
            </button>
          </div>
        </section>
      ) : null}
    </section>
  );

  return (
    <>
      <main className="pokemon-detail-page mx-auto min-h-screen w-full max-w-[2560px] px-2 py-5 sm:px-4 sm:py-8 lg:px-5">
        <PokedexFrame title="Trainer Profile" status={isLoadingProfile ? "loading" : "success"} leftPanel={leftPanel} rightPanel={rightPanel} />
      </main>
      <ProfileAvatarCropper
        open={avatarCropDraft !== null}
        imageSrc={avatarCropDraft?.previewUrl ?? null}
        fileName={avatarCropDraft?.file.name ?? "Selected avatar"}
        isSubmitting={isUploadingAvatar}
        onCancel={handleCancelAvatarCrop}
        onConfirm={handleUploadCroppedAvatar}
      />
      <ProfileAvatarLightbox
        open={isAvatarLightboxOpen}
        src={avatarPreviewSrc}
        alt={`${activeDisplayName} avatar`}
        onClose={closeAvatarLightbox}
      />
    </>
  );
}

