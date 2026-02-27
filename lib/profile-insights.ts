import {
  type FavoriteEntityType,
  type FavoriteRecord,
  type UserProfileRecord
} from "@/lib/profile-types";

export interface FavoriteEntityInsight {
  entityType: FavoriteEntityType;
  label: string;
  count: number;
  ratio: number;
}

export interface FavoriteTagInsight {
  tag: string;
  count: number;
  ratio: number;
}

export interface ProfileChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface ProfileCompletenessResult {
  score: number;
  checklist: ProfileChecklistItem[];
}

export function formatFavoriteEntityLabel(entityType: FavoriteEntityType) {
  return entityType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toSafeDate(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function sortFavoritesByCreatedAt(items: FavoriteRecord[], direction: "asc" | "desc") {
  const sorted = items.slice();
  sorted.sort((a, b) => {
    const left = toSafeDate(a.createdAt);
    const right = toSafeDate(b.createdAt);
    return direction === "asc" ? left - right : right - left;
  });
  return sorted;
}

export function getFavoriteEntityInsights(items: FavoriteRecord[]) {
  const total = items.length;
  if (total === 0) {
    return [] as FavoriteEntityInsight[];
  }

  const countMap = new Map<FavoriteEntityType, number>();
  items.forEach((entry) => {
    countMap.set(entry.entityType, (countMap.get(entry.entityType) ?? 0) + 1);
  });

  const rows = Array.from(countMap.entries()).map(([entityType, count]) => ({
    entityType,
    label: formatFavoriteEntityLabel(entityType),
    count,
    ratio: count / total
  }));

  rows.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.label.localeCompare(b.label);
  });

  return rows;
}

export function getFavoriteTagInsights(items: FavoriteRecord[], maxItems = 10) {
  if (items.length === 0) {
    return [] as FavoriteTagInsight[];
  }

  const tagMap = new Map<string, number>();
  items.forEach((entry) => {
    const tagSet = new Set(entry.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean));
    tagSet.forEach((tag) => {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    });
  });

  const total = items.length;
  const rows = Array.from(tagMap.entries()).map(([tag, count]) => ({
    tag,
    count,
    ratio: count / total
  }));

  rows.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.tag.localeCompare(b.tag);
  });

  return rows.slice(0, Math.max(1, maxItems));
}

export function getRecentFavorites(items: FavoriteRecord[], limit = 6) {
  return sortFavoritesByCreatedAt(items, "desc").slice(0, Math.max(1, limit));
}

export function calculateProfileCompleteness(input: {
  profile: Pick<
    UserProfileRecord,
    "displayName" | "bio" | "avatarUrl" | "visibility" | "showFavoritesOnPublic"
  > | null;
  fallbackDisplayName?: string | null;
  favoritesCount: number;
  moduleCount: number;
}) {
  const profile = input.profile;
  const name = (profile?.displayName ?? input.fallbackDisplayName ?? "").trim();
  const bio = (profile?.bio ?? "").trim();
  const hasAvatar = Boolean(profile?.avatarUrl);
  const isPublic = profile?.visibility === "public";
  const hasPublicFavorites = profile?.showFavoritesOnPublic === true;

  const checklist: ProfileChecklistItem[] = [
    {
      id: "name",
      label: "Trainer name configured",
      done: name.length >= 3
    },
    {
      id: "bio",
      label: "Bio has meaningful context",
      done: bio.length >= 30
    },
    {
      id: "avatar",
      label: "Avatar uploaded",
      done: hasAvatar
    },
    {
      id: "favorites",
      label: "At least 8 favorites captured",
      done: input.favoritesCount >= 8
    },
    {
      id: "modules",
      label: "Favorites span 4+ modules",
      done: input.moduleCount >= 4
    },
    {
      id: "public",
      label: "Public showcase enabled",
      done: isPublic && hasPublicFavorites
    }
  ];

  let score = 0;
  score += checklist[0].done ? 22 : name.length > 0 ? 10 : 0;
  score += checklist[1].done ? 24 : bio.length > 0 ? 10 : 0;
  score += checklist[2].done ? 18 : 0;
  score += checklist[3].done ? 14 : input.favoritesCount > 0 ? 6 : 0;
  score += checklist[4].done ? 12 : input.moduleCount > 0 ? 4 : 0;
  score += checklist[5].done ? 10 : isPublic ? 4 : 0;

  return {
    score: Math.max(0, Math.min(100, score)),
    checklist
  } satisfies ProfileCompletenessResult;
}

