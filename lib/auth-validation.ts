export function normalizeEmailAddress(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmailAddress(value: string) {
  const email = normalizeEmailAddress(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(value: string) {
  return value.length >= 8 && value.length <= 128;
}

export function sanitizeDisplayName(value: string, fallbackEmail?: string) {
  const trimmed = value.trim().slice(0, 60);
  if (trimmed.length > 0) {
    return trimmed;
  }

  if (fallbackEmail) {
    return fallbackEmail.split("@")[0];
  }

  return "Trainer";
}

