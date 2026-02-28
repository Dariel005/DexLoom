const BULBAGARDEN_MEDIA_HOSTS = new Set([
  "archives.bulbagarden.net",
  "m.archives.bulbagarden.net"
]);

export function isBulbagardenMediaUrl(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && BULBAGARDEN_MEDIA_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export function resolveBulbagardenImageSrc(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  if (!isBulbagardenMediaUrl(value)) {
    return value;
  }

  return `/api/media/bulbagarden?src=${encodeURIComponent(value)}`;
}
