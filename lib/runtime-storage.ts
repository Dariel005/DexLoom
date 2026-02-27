import { tmpdir } from "node:os";
import path from "node:path";

function resolveOptionalPath(raw: string | undefined, fallback: string) {
  const value = String(raw ?? "").trim();
  if (!value) {
    return fallback;
  }
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

export function resolveDataStoreDir() {
  const fallback =
    process.env.NODE_ENV === "production"
      ? path.join(tmpdir(), "dexloom-data")
      : path.resolve(process.cwd(), ".data");
  return resolveOptionalPath(process.env.POKEDEX_DATA_DIR, fallback);
}

export function resolveAvatarStoreDir() {
  const fallback =
    process.env.NODE_ENV === "production"
      ? path.join(tmpdir(), "dexloom-avatars")
      : path.resolve(process.cwd(), "public", "images", "avatars");
  return resolveOptionalPath(process.env.POKEDEX_AVATAR_DIR, fallback);
}
