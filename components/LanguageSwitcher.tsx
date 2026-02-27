"use client";

import { type Locale, LOCALE_LABELS, SUPPORTED_LOCALES } from "@/lib/i18n";
import { useLocaleStore } from "@/store/locale-store";

/**
 * Compact language toggle styled to match the GBA theme.
 * Cycles through supported locales on click.
 */
export function LanguageSwitcher() {
    const locale = useLocaleStore((state) => state.locale);
    const setLocale = useLocaleStore((state) => state.setLocale);

    const handleClick = () => {
        const currentIndex = SUPPORTED_LOCALES.indexOf(locale);
        const nextIndex = (currentIndex + 1) % SUPPORTED_LOCALES.length;
        setLocale(SUPPORTED_LOCALES[nextIndex] as Locale);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className="pixel-font inline-flex items-center gap-1 rounded-lg border border-black/25 bg-white/70 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-black/72 transition hover:bg-white"
            aria-label={`Language: ${LOCALE_LABELS[locale]}. Click to change.`}
            title="Switch language"
        >
            <span aria-hidden>🌐</span>
            <span>{LOCALE_LABELS[locale]}</span>
        </button>
    );
}
