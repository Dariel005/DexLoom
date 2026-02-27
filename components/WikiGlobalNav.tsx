"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import {
  WIKI_PRIMARY_MENU,
  WIKI_SEARCH_INDEX,
  WIKI_SECONDARY_MENU
} from "@/lib/wiki-directory";

/** Map wiki-directory labels to i18n keys. */
const NAV_LABEL_KEYS: Record<string, string> = {
  Pokemon: "nav.pokemon",
  Tools: "nav.tools",
  Moves: "nav.moves",
  Items: "nav.items",
  Abilities: "nav.abilities",
  Maps: "nav.maps",
  Games: "nav.games",
  Mechanics: "nav.mechanics",
  Types: "nav.types",
  Cards: "nav.cards",
  "ROM Hacks": "nav.romHacks",
  "Pokemon GO": "nav.pokemonGo",
  Characters: "nav.characters",
  Favorites: "nav.favorites",
  Social: "nav.social",
  Profile: "nav.profile",
  Sources: "nav.sources"
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const HIDDEN_PREFIXES = ["/login", "/register"];

export function WikiGlobalNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");

  const isHidden = useMemo(
    () => HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix)),
    [pathname]
  );

  const filteredEntries = useMemo(() => {
    const query = normalize(searchInput);
    if (!query) {
      return WIKI_SEARCH_INDEX.slice(0, 10);
    }
    return WIKI_SEARCH_INDEX.filter((entry) => {
      const normalizedTitle = normalize(entry.title);
      if (normalizedTitle.includes(query)) {
        return true;
      }
      return entry.keywords.some((keyword) => normalize(keyword).includes(query));
    }).slice(0, 12);
  }, [searchInput]);

  const navigateFromSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = normalize(searchInput);
    if (!query) {
      return;
    }

    const numericMatch = query.match(/^#?(\d{1,4})$/);
    if (numericMatch?.[1]) {
      router.push(`/pokemon/${Number(numericMatch[1])}`);
      return;
    }

    const exact = WIKI_SEARCH_INDEX.find(
      (entry) => normalize(entry.title) === query
    );
    if (exact) {
      router.push(exact.href);
      return;
    }

    const partial = WIKI_SEARCH_INDEX.find((entry) => {
      const normalizedTitle = normalize(entry.title);
      return normalizedTitle.includes(query);
    });
    if (partial) {
      router.push(partial.href);
    }
  };

  if (isHidden) {
    return null;
  }

  return (
    <header role="banner" aria-label="DexLoom wiki navigation" className="sticky top-0 z-50 border-b border-black/20 bg-[linear-gradient(180deg,rgba(245,251,241,0.96),rgba(220,236,213,0.94))] backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[2560px] px-2 py-2 sm:px-4 lg:px-5">
        <div className="flex flex-wrap items-center gap-2">
          {WIKI_PRIMARY_MENU.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "gbc-nav-link pixel-font inline-flex rounded-lg border px-2.5 py-1.5 text-[9px] uppercase tracking-[0.12em] sm:text-[10px]",
                  active
                    ? "explorer-nav-btn-active border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-black/85 dark:text-white/90"
                    : "border-black/25 bg-white/70 text-black/72 dark:border-white/10 dark:bg-black/40 dark:text-white/80"
                )}
              >
                {t(NAV_LABEL_KEYS[item.label] ?? item.label)}
              </Link>
            );
          })}
        </div>

        <div className="mt-2 grid gap-2 lg:grid-cols-[1fr_auto]">
          <form onSubmit={navigateFromSearch} className="search-deck-field" role="search" aria-label="Wiki search">
            <span className="search-deck-led" aria-hidden />
            <span className="search-deck-ball" aria-hidden />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="search-deck-input"
              placeholder={t("common.searchWikiPlaceholder")}
              list="wiki-search-options"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-gramm="false"
              aria-label={t("common.searchWikiAriaLabel")}
            />
            {searchInput.trim().length > 0 ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setSearchInput("");
                }}
                className="search-deck-clear-btn"
                aria-label={t("common.clearSearch")}
              >
                x
              </button>
            ) : null}
            <span className="search-deck-gloss" aria-hidden />
            <datalist id="wiki-search-options">
              {filteredEntries.map((entry) => (
                <option key={`${entry.href}-${entry.title}`} value={entry.title} />
              ))}
            </datalist>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {WIKI_SECONDARY_MENU.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "gbc-nav-link pixel-font inline-flex rounded-lg border px-2 py-1 text-[8px] uppercase tracking-[0.12em] sm:text-[9px]",
                    active
                      ? "border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-black/85 font-medium dark:text-white/90"
                      : "border-black/25 bg-white/70 text-black/70 dark:border-white/10 dark:bg-black/40 dark:text-white/80"
                  )}
                >
                  {t(NAV_LABEL_KEYS[item.label] ?? item.label)}
                </Link>
              );
            })}
            <LanguageSwitcher />

          </div>
        </div>
      </div>
    </header>
  );
}

