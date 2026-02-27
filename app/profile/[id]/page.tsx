import type { Metadata } from "next";
import { ProfilePublicClient } from "@/components/profile/ProfilePublicClient";
import { resolveAvatarSrc } from "@/lib/avatar-url";
import { getUserProfileForViewer } from "@/lib/profile-service";

interface ProfilePublicPageProps {
  params: {
    id: string;
  };
}

export const runtime = "nodejs";

const DEFAULT_SITE_URL = "https://dexloom.net";
const DEFAULT_PROFILE_PREVIEW_IMAGE = "/images/characters/official/red-frlg.png";

function resolveMetadataBaseUrl() {
  const configuredUrl = String(process.env.NEXTAUTH_URL ?? "").trim() || DEFAULT_SITE_URL;
  try {
    return new URL(configuredUrl);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

function trimForMeta(value: string, limit: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, limit - 1)).trimEnd()}...`;
}

function buildTrainerMetaDescription(displayName: string, bio: string | null) {
  const intro = `${displayName}'s DexLoom Trainer Card is ready for battle: scout favorites, module highlights, and Pokedex momentum.`;
  if (!bio || bio.trim().length === 0) {
    return intro;
  }
  return trimForMeta(`${intro} Trainer note: ${bio}`, 220);
}

function resolvePreviewImageAbsoluteUrl(rawAvatarUrl: string | null, metadataBaseUrl: URL) {
  const resolvedAvatar = resolveAvatarSrc(rawAvatarUrl) ?? DEFAULT_PROFILE_PREVIEW_IMAGE;
  try {
    return new URL(resolvedAvatar, metadataBaseUrl).toString();
  } catch {
    return new URL(DEFAULT_PROFILE_PREVIEW_IMAGE, metadataBaseUrl).toString();
  }
}

export async function generateMetadata({ params }: ProfilePublicPageProps): Promise<Metadata> {
  const profileId = String(params.id ?? "").trim();
  const metadataBaseUrl = resolveMetadataBaseUrl();
  const profilePath = `/profile/${encodeURIComponent(profileId)}`;
  const canonicalUrl = new URL(profilePath, metadataBaseUrl).toString();

  if (!profileId) {
    return {
      title: "Trainer Card",
      description:
        "Public trainer profile with optional cross-module favorites showcase.",
      robots: { index: false, follow: false },
      alternates: {
        canonical: canonicalUrl
      }
    };
  }

  const profile = await getUserProfileForViewer({
    profileId,
    viewerId: null
  });

  if (!profile) {
    const title = "DexLoom Trainer Card";
    const description =
      "Explore DexLoom trainer cards with battle-ready picks, Pokedex progress, and Pokemon-style profile highlights.";
    const imageUrl = new URL(DEFAULT_PROFILE_PREVIEW_IMAGE, metadataBaseUrl).toString();
    return {
      title,
      description,
      robots: { index: false, follow: false },
      alternates: {
        canonical: canonicalUrl
      },
      openGraph: {
        title,
        description,
        type: "website",
        url: canonicalUrl,
        siteName: "DexLoom",
        images: [
          {
            url: imageUrl,
            alt: "DexLoom Trainer Card Preview"
          }
        ]
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl]
      }
    };
  }

  const displayName = profile.displayName.trim().length > 0 ? profile.displayName : `Trainer ${profile.userId.slice(0, 6)}`;
  const title = `${displayName} | Trainer Card`;
  const description = buildTrainerMetaDescription(displayName, profile.bio);
  const imageUrl = resolvePreviewImageAbsoluteUrl(profile.avatarUrl, metadataBaseUrl);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title,
      description,
      type: "profile",
      url: canonicalUrl,
      siteName: "DexLoom",
      images: [
        {
          url: imageUrl,
          alt: `${displayName} trainer avatar`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl]
    }
  };
}

export default function ProfilePublicPage({ params }: ProfilePublicPageProps) {
  return <ProfilePublicClient profileId={params.id} />;
}
