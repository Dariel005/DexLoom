export const DEFAULT_TRAINER_AVATAR_URL = "/images/characters/red.svg";

export function isGoogleProfileImageUrl(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return false;
  }

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    return host.endsWith("googleusercontent.com") || host.endsWith("ggpht.com");
  } catch {
    return false;
  }
}
