import {
  type FavoriteEntityType,
  type FavoriteSyncOperation,
  type FavoriteUpsertInput,
  type ProfileUpdateInput,
  type ProfileVisibility
} from "@/lib/profile-types";

const FAVORITE_ENTITY_TYPES: FavoriteEntityType[] = [
  "game",
  "pokemon",
  "mega",
  "mega_stone",
  "character",
  "item",
  "move",
  "ability",
  "type",
  "card",
  "map_region",
  "location",
  "pokemon_go_activity",
  "pokemon_go_item",
  "mechanics_topic"
];

const PROFILE_VISIBILITY_VALUES: ProfileVisibility[] = ["private", "public"];
const MAX_DISPLAY_NAME = 60;
const MAX_BIO = 320;
const MAX_TITLE = 120;
const MAX_ENTITY_ID = 120;
const MAX_HREF = 240;
const MAX_IMAGE_URL = 320;
const MAX_SUBTITLE = 140;
const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 28;

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function clampString(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

function toBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }
    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }
  }
  return fallback;
}

export function isFavoriteEntityType(value: string): value is FavoriteEntityType {
  return FAVORITE_ENTITY_TYPES.includes(value as FavoriteEntityType);
}

export function normalizeProfileVisibility(
  value: unknown,
  fallback: ProfileVisibility = "private"
): ProfileVisibility {
  const normalized = asString(value).trim().toLowerCase();
  if (PROFILE_VISIBILITY_VALUES.includes(normalized as ProfileVisibility)) {
    return normalized as ProfileVisibility;
  }
  return fallback;
}

export function sanitizeDisplayName(value: unknown, fallback = "Trainer") {
  const normalized = clampString(asString(value), MAX_DISPLAY_NAME);
  return normalized || fallback;
}

export function sanitizeBio(value: unknown) {
  return clampString(asString(value), MAX_BIO);
}

export function buildFavoriteId(entityType: FavoriteEntityType, entityId: string) {
  return `${entityType}:${entityId}`;
}

export function sanitizeTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  const unique = new Set<string>();
  for (const candidate of value) {
    if (unique.size >= MAX_TAGS) {
      break;
    }
    const normalized = clampString(asString(candidate), MAX_TAG_LENGTH).toLowerCase();
    if (!normalized) {
      continue;
    }
    unique.add(normalized);
  }

  return Array.from(unique);
}

export function parseProfileUpdatePayload(payload: unknown): ProfileUpdateInput {
  const body = (payload ?? {}) as Record<string, unknown>;
  const displayName = sanitizeDisplayName(body.displayName, "Trainer");
  const bio = sanitizeBio(body.bio);
  const visibility = normalizeProfileVisibility(body.visibility, "private");
  const showFavoritesOnPublic = toBoolean(body.showFavoritesOnPublic, false);

  return {
    displayName,
    bio,
    visibility,
    showFavoritesOnPublic
  };
}

export function parseFavoriteUpsertPayload(payload: unknown): FavoriteUpsertInput {
  const body = (payload ?? {}) as Record<string, unknown>;
  const entityTypeRaw = asString(body.entityType).trim().toLowerCase();
  if (!isFavoriteEntityType(entityTypeRaw)) {
    throw new Error("Invalid favorite entity type.");
  }

  const entityId = clampString(asString(body.entityId), MAX_ENTITY_ID);
  if (!entityId) {
    throw new Error("Missing favorite entity id.");
  }

  const title = clampString(asString(body.title), MAX_TITLE);
  if (!title) {
    throw new Error("Missing favorite title.");
  }

  const href = clampString(asString(body.href), MAX_HREF);
  if (!href) {
    throw new Error("Missing favorite href.");
  }

  const imageUrl = clampString(asString(body.imageUrl), MAX_IMAGE_URL) || null;
  const subtitle = clampString(asString(body.subtitle), MAX_SUBTITLE) || null;
  const tags = sanitizeTags(body.tags);

  return {
    entityType: entityTypeRaw,
    entityId,
    title,
    href,
    imageUrl,
    subtitle,
    tags
  };
}

export function parseFavoriteDeletePayload(payload: unknown): {
  entityType: FavoriteEntityType;
  entityId: string;
} {
  const body = (payload ?? {}) as Record<string, unknown>;
  const entityTypeRaw = asString(body.entityType).trim().toLowerCase();
  if (!isFavoriteEntityType(entityTypeRaw)) {
    throw new Error("Invalid favorite entity type.");
  }

  const entityId = clampString(asString(body.entityId), MAX_ENTITY_ID);
  if (!entityId) {
    throw new Error("Missing favorite entity id.");
  }

  return { entityType: entityTypeRaw, entityId };
}

export function parseFavoritesSyncPayload(payload: unknown): FavoriteSyncOperation[] {
  const body = (payload ?? {}) as Record<string, unknown>;
  const opsRaw = Array.isArray(body.ops) ? body.ops : [];

  return opsRaw
    .map((op): FavoriteSyncOperation | null => {
      if (!op || typeof op !== "object") {
        return null;
      }
      const candidate = op as Record<string, unknown>;
      const opType = asString(candidate.op).trim().toLowerCase();

      if (opType === "add") {
        try {
          return {
            op: "add",
            item: parseFavoriteUpsertPayload(candidate.item)
          };
        } catch {
          return null;
        }
      }

      if (opType === "remove") {
        try {
          const parsed = parseFavoriteDeletePayload(candidate);
          return {
            op: "remove",
            entityType: parsed.entityType,
            entityId: parsed.entityId
          };
        } catch {
          return null;
        }
      }

      return null;
    })
    .filter((entry): entry is FavoriteSyncOperation => Boolean(entry));
}

export function parseFavoritesListParams(searchParams: URLSearchParams) {
  const entityTypeRaw = searchParams.get("entityType")?.trim().toLowerCase() ?? "";
  const entityType = isFavoriteEntityType(entityTypeRaw)
    ? (entityTypeRaw as FavoriteEntityType)
    : null;
  const cursor = clampString(searchParams.get("cursor") ?? "", 64) || null;
  const limitRaw = Number(searchParams.get("limit"));
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(100, Math.max(1, Math.floor(limitRaw)))
      : 50;

  return { entityType, cursor, limit };
}

export function encodeCursor(offset: number) {
  const safeOffset = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;
  return Buffer.from(String(safeOffset), "utf-8").toString("base64url");
}

export function decodeCursor(cursor: string | null) {
  if (!cursor) {
    return 0;
  }

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf-8");
    const offset = Number(decoded);
    if (!Number.isFinite(offset) || offset < 0) {
      return 0;
    }
    return Math.floor(offset);
  } catch {
    return 0;
  }
}
