export type ProfileVisibility = "private" | "public";

export type FavoriteEntityType =
  | "game"
  | "pokemon"
  | "mega"
  | "mega_stone"
  | "character"
  | "item"
  | "move"
  | "ability"
  | "type"
  | "card"
  | "map_region"
  | "location"
  | "pokemon_go_activity"
  | "pokemon_go_item"
  | "mechanics_topic";

export interface UserProfileRecord {
  userId: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  isCreator?: boolean;
  visibility: ProfileVisibility;
  showFavoritesOnPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteRecord {
  id: string;
  userId: string;
  entityType: FavoriteEntityType;
  entityId: string;
  title: string;
  href: string;
  imageUrl: string | null;
  subtitle: string | null;
  tags: string[];
  createdAt: string;
}

export interface FavoriteUpsertInput {
  entityType: FavoriteEntityType;
  entityId: string;
  title: string;
  href: string;
  imageUrl?: string | null;
  subtitle?: string | null;
  tags?: string[];
}

export interface FavoriteUpsertResult {
  record: FavoriteRecord;
  created: boolean;
}

export type FavoriteSyncOperation =
  | {
      op: "add";
      item: FavoriteUpsertInput;
    }
  | {
      op: "remove";
      entityType: FavoriteEntityType;
      entityId: string;
    };

export interface FavoriteListResult {
  items: FavoriteRecord[];
  nextCursor: string | null;
}

export interface ProfileUpdateInput {
  displayName: string;
  bio: string;
  visibility: ProfileVisibility;
  showFavoritesOnPublic: boolean;
}

export interface ProfileOverviewData {
  profile: UserProfileRecord;
  favorites: FavoriteListResult;
}

export interface FavoriteSyncResult {
  applied: number;
  failed: number;
  createdRecords: FavoriteRecord[];
}
