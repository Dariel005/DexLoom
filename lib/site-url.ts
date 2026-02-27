const DEFAULT_SITE_URL = "https://dexloom.net";

export function resolveSiteUrl() {
  const configuredUrl = String(process.env.NEXTAUTH_URL ?? "").trim() || DEFAULT_SITE_URL;
  try {
    return new URL(configuredUrl);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

export function resolveAbsoluteUrl(pathname: string) {
  return new URL(pathname, resolveSiteUrl()).toString();
}
