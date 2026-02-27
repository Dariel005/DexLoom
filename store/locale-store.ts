import { create } from "zustand";
import { type Locale, SUPPORTED_LOCALES } from "@/lib/i18n";

interface LocaleState {
    locale: Locale;
    setLocale: (locale: Locale) => void;
}

function resolveInitialLocale(): Locale {
    if (typeof window === "undefined") {
        return "en";
    }

    try {
        const stored = localStorage.getItem("dexloom-locale");
        if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
            return stored as Locale;
        }
    } catch {
        /* localStorage unavailable */
    }

    return "en";
}

export const useLocaleStore = create<LocaleState>((set) => ({
    locale: resolveInitialLocale(),
    setLocale: (locale: Locale) => {
        set({ locale });

        try {
            localStorage.setItem("dexloom-locale", locale);
        } catch {
            /* localStorage unavailable */
        }

        if (typeof document !== "undefined") {
            document.documentElement.lang = locale;
        }
    }
}));
