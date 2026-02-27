const LOCAL_AVATAR_BASE_PATH = "/images/avatars/";
const AVATAR_PROXY_BASE_PATH = "/api/profile/avatar-file/";

export function resolveAvatarSrc(value: string | null | undefined) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return null;
  }

  if (raw.startsWith(LOCAL_AVATAR_BASE_PATH)) {
    const fileName = raw.slice(LOCAL_AVATAR_BASE_PATH.length);
    if (!fileName) {
      return null;
    }
    return `${AVATAR_PROXY_BASE_PATH}${encodeURIComponent(fileName)}`;
  }

  return raw;
}
