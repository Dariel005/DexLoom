import en from "./en.json";
import es from "./es.json";

export type Locale = "en" | "es";

export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "es"] as const;

export const LOCALE_LABELS: Record<Locale, string> = {
    en: "EN",
    es: "ES"
};

type TranslationDictionary = Record<string, string>;

const dictionaries: Record<Locale, TranslationDictionary> = { en, es };

/**
 * Look up a translation key for a given locale.
 * Falls back to English, then to the raw key if nothing is found.
 */
export function getTranslation(locale: Locale, key: string): string {
    return dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? key;
}

/** Return every key present in the English dictionary. */
export function getAllTranslationKeys(): string[] {
    return Object.keys(en);
}
