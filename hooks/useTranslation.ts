import { useCallback } from "react";
import { getTranslation } from "@/lib/i18n";
import { useLocaleStore } from "@/store/locale-store";

/**
 * Returns a `t(key)` translation function bound to the current locale.
 *
 * @example
 * ```tsx
 * const { t } = useTranslation();
 * return <p>{t("nav.pokemon")}</p>;
 * ```
 */
export function useTranslation() {
    const locale = useLocaleStore((state) => state.locale);

    const t = useCallback(
        (key: string) => getTranslation(locale, key),
        [locale]
    );

    return { t, locale };
}
