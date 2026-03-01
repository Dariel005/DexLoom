"use client";

import { AnimatePresence, m } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EncyclopediaDataTable } from "@/components/EncyclopediaDataTable";
import { FavoriteStarButton } from "@/components/FavoriteStarButton";
import { MobileDexBottomNav } from "@/components/MobileDexBottomNav";
import { PokedexFrame } from "@/components/PokedexFrame";
import { PokedexHeaderAccess } from "@/components/PokedexHeaderAccess";
import { TypeBadge } from "@/components/TypeBadge";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUiTone } from "@/hooks/useUiTone";
import {
  pokemonCardDetailQueryOptions,
  pokemonCardIndexQueryOptions,
  pokemonCardTypeIdsQueryOptions,
  pokemonCardTypesQueryOptions,
} from "@/lib/pokemon-query-options";
import { cn } from "@/lib/utils";
import {
  type PokemonCardDetail,
  type PokemonCardIndexEntry,
} from "@/types/encyclopedia";

const CARDS_PER_PAGE = 36;

const TCG_TYPE_TO_POKEMON_TYPE: Record<string, string> = {
  colorless: "normal",
  darkness: "dark",
  lightning: "electric",
  metal: "steel",
  pokemon: "pokemon",
  trainer: "trainer",
  energy: "energy",
};

type CardSortMode = "release-desc" | "release-asc" | "name-asc" | "hp-desc";
type CardSupertypeFilter = "all" | "pokemon" | "trainer" | "energy";
const countFormatter = new Intl.NumberFormat("en-US");

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatCount(value: number) {
  return countFormatter.format(value);
}

function sanitizeSort(value: string): CardSortMode {
  if (value === "release-asc" || value === "name-asc" || value === "hp-desc") {
    return value;
  }
  return "release-desc";
}

function sanitizeSupertype(value: string): CardSupertypeFilter {
  if (value === "pokemon" || value === "trainer" || value === "energy") {
    return value;
  }
  return "all";
}

function parseReleaseDate(value: string | null) {
  if (!value) {
    return 0;
  }
  const normalized = value.includes("/") ? value.replace(/\//g, "-") : value;
  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatReleaseDate(value: string | null) {
  if (!value) {
    return "Unknown date";
  }
  const normalized = value.includes("/") ? value.replace(/\//g, "-") : value;
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(parsed));
}

function mapCatalogTypeToBadge(typeValue: string) {
  const normalized = normalize(typeValue);
  return TCG_TYPE_TO_POKEMON_TYPE[normalized] ?? normalized;
}

function resolveCatalogBadgeTypes(card: PokemonCardIndexEntry) {
  const source = card.types.length > 0 ? card.types : [card.supertype];
  const unique: string[] = [];

  for (const value of source) {
    const mapped = mapCatalogTypeToBadge(value);
    if (!mapped || unique.includes(mapped)) {
      continue;
    }
    unique.push(mapped);
    if (unique.length >= 2) {
      break;
    }
  }

  return unique.length > 0 ? unique : ["normal"];
}

function formatCatalogDexLabel(card: PokemonCardIndexEntry) {
  const dexNumber = card.nationalPokedexNumbers[0];
  if (typeof dexNumber === "number" && Number.isFinite(dexNumber)) {
    return `#${dexNumber.toString().padStart(4, "0")}`;
  }

  const number = card.number.trim();
  if (/^\d+$/.test(number)) {
    return `#${number.padStart(4, "0")}`;
  }

  return `#${number.toUpperCase()}`;
}

function toPlaceholderDetail(entry: PokemonCardIndexEntry): PokemonCardDetail {
  return {
    ...entry,
    flavorText: null,
    rules: [],
    abilityEntries: [],
    attackEntries: [],
    weaknesses: [],
    resistances: [],
    retreatCost: [],
    convertedRetreatCost: null,
    legalityStandard: null,
    legalityExpanded: null,
    legalityUnlimited: null,
    setPrintedTotal: null,
    setTotal: null,
    setSymbolUrl: null,
    setLogoUrl: null,
    tcgplayerUrl: null,
    cardmarketUrl: null,
    priceSnapshots: [],
    marketLastUpdatedAt: null,
  };
}

function InfoChip({
  value,
  tone = "neutral",
}: {
  value: string;
  tone?: "neutral" | "sky" | "amber" | "green" | "rose";
}) {
  const className =
    tone === "sky"
      ? "border-sky-300 bg-sky-100/75 text-sky-900"
      : tone === "amber"
        ? "border-amber-300 bg-amber-100/75 text-amber-900"
        : tone === "green"
          ? "border-emerald-300 bg-emerald-100/75 text-emerald-900"
          : tone === "rose"
            ? "border-rose-300 bg-rose-100/75 text-rose-900"
            : "border-black/20 bg-white/70 text-black/75";

  return (
    <span className={cn("rounded-md border px-2 py-1 text-xs", className)}>
      {value}
    </span>
  );
}

function DetailSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/20 bg-[radial-gradient(circle_at_14%_8%,rgba(255,255,255,0.34),transparent_34%),linear-gradient(158deg,rgba(255,255,255,0.9),rgba(229,239,248,0.78))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_8px_16px_rgba(0,0,0,0.06)]">
      <div className="mb-3 flex items-start gap-2">
        <span className="mt-1 h-2 w-2 rounded-full border border-black/30 bg-[var(--theme-accent)] shadow-[0_0_12px_var(--theme-accent-soft)]" />
        <div>
          <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/78">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-black/62">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

type InfoTileTone = "neutral" | "sky" | "amber" | "rose" | "green";

function InfoTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: InfoTileTone;
}) {
  const toneClass =
    tone === "sky"
      ? "border-sky-300/85 bg-sky-50/72 text-sky-900"
      : tone === "amber"
        ? "border-amber-300/85 bg-amber-50/72 text-amber-900"
        : tone === "rose"
          ? "border-rose-300/85 bg-rose-50/72 text-rose-900"
          : tone === "green"
            ? "border-emerald-300/85 bg-emerald-50/72 text-emerald-900"
            : "border-black/18 bg-white/74 text-black/78";

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
        toneClass,
      )}
    >
      <p className="pixel-font text-[9px] uppercase tracking-[0.12em] opacity-70">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium leading-tight">{value}</p>
    </div>
  );
}

function RuleCard({ value }: { value: string }) {
  return (
    <li className="rounded-lg border border-black/18 bg-[linear-gradient(150deg,rgba(255,255,255,0.86),rgba(234,243,248,0.76))] px-3 py-2 text-sm text-black/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <span className="flex items-start gap-2">
        <span className="mt-[6px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--theme-accent)]" />
        <span>{value}</span>
      </span>
    </li>
  );
}

function QuickFilterButton({
  label,
  shortCode,
  active = false,
  onClick,
}: {
  label: string;
  shortCode: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cards-mobile-quick-filter pixel-font",
        active && "cards-mobile-quick-filter-active",
      )}
    >
      <span className="cards-mobile-quick-filter-glyph" aria-hidden>
        {shortCode}
      </span>
      <span>{label}</span>
    </button>
  );
}

export function CardsExplorer() {
  const playUiTone = useUiTone();
  const [searchInput, setSearchInput] = useState("");
  const [sortMode, setSortMode] = useState<CardSortMode>("release-desc");
  const [supertypeFilter, setSupertypeFilter] =
    useState<CardSupertypeFilter>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isCardZoomOpen, setIsCardZoomOpen] = useState(false);
  const [isMobileTerminalOpen, setIsMobileTerminalOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const debouncedSearch = useDebouncedValue(searchInput, 120);
  const didMountSearchRef = useRef(false);
  const detailAnchorRef = useRef<HTMLDivElement | null>(null);

  const catalogQuery = useQuery(pokemonCardIndexQueryOptions());
  const cardTypesQuery = useQuery(pokemonCardTypesQueryOptions());
  const cards = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const isUsingLocalFallback = useMemo(
    () =>
      cards.length > 0 && cards.every((entry) => entry.id.startsWith("dex-")),
    [cards],
  );
  const hasInlineTypeData = useMemo(
    () => cards.some((entry) => entry.types.length > 0),
    [cards],
  );
  const remoteTypeIdsQuery = useQuery(
    pokemonCardTypeIdsQueryOptions(typeFilter !== "all" ? typeFilter : ""),
  );
  const remoteTypeIdSet = useMemo(() => {
    if (!remoteTypeIdsQuery.data || remoteTypeIdsQuery.data.length === 0) {
      return null;
    }
    return new Set(remoteTypeIdsQuery.data);
  }, [remoteTypeIdsQuery.data]);
  const selectedCardQuery = useQuery(
    pokemonCardDetailQueryOptions(selectedCardId ?? ""),
  );
  const searchableCards = useMemo(
    () =>
      cards.map((card) => ({
        card,
        normalizedSupertype: normalize(card.supertype),
        normalizedTypes: card.types.map((entry) => normalize(entry)),
        releaseMs: parseReleaseDate(card.setReleaseDate),
      })),
    [cards],
  );
  const cardsById = useMemo(
    () => new Map(cards.map((entry) => [entry.id, entry] as const)),
    [cards],
  );

  const availableTypes = useMemo(() => {
    if (cardTypesQuery.data && cardTypesQuery.data.length > 0) {
      return cardTypesQuery.data;
    }

    const map = new Map<string, string>();
    for (const card of cards) {
      for (const typeName of card.types) {
        const key = normalize(typeName);
        if (!map.has(key)) {
          map.set(key, typeName);
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [cardTypesQuery.data, cards]);

  const popularTypeFilters = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();

    for (const card of cards) {
      for (const typeName of card.types) {
        const key = normalize(typeName);
        const current = counts.get(key);
        if (current) {
          current.count += 1;
          continue;
        }
        counts.set(key, { label: typeName, count: 1 });
      }
    }

    return Array.from(counts.values())
      .sort((a, b) => {
        if (a.count !== b.count) {
          return b.count - a.count;
        }
        return a.label.localeCompare(b.label);
      })
      .slice(0, 3);
  }, [cards]);

  const handleSearchInput = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchInput((current) => {
      if (current.trim().length > 0) {
        playUiTone("switch");
      }
      return "";
    });
  }, [playUiTone]);

  const handleSortModeValue = useCallback(
    (value: string) => {
      const next = sanitizeSort(value);
      setSortMode((current) => {
        if (current !== next) {
          playUiTone("switch");
        }
        return next;
      });
    },
    [playUiTone],
  );

  const handleSupertypeValue = useCallback(
    (value: string) => {
      const next = sanitizeSupertype(normalize(value));
      setSupertypeFilter((current) => {
        if (current !== next) {
          playUiTone("switch");
        }
        return next;
      });
    },
    [playUiTone],
  );

  const handleTypeValue = useCallback(
    (value: string) => {
      const next = normalize(value);
      setTypeFilter((current) => {
        if (current !== next) {
          playUiTone("switch");
        }
        return next;
      });
    },
    [playUiTone],
  );

  const handleQuickSupertypeToggle = useCallback(
    (value: CardSupertypeFilter) => {
      const next = supertypeFilter === value ? "all" : value;
      handleSupertypeValue(next);
    },
    [handleSupertypeValue, supertypeFilter],
  );

  const handleQuickTypeToggle = useCallback(
    (value: string) => {
      const next = normalize(value);
      handleTypeValue(typeFilter === next ? "all" : next);
    },
    [handleTypeValue, typeFilter],
  );

  const filteredCards = useMemo(() => {
    const query = normalize(debouncedSearch);

    const result = searchableCards.filter((searchableCard) => {
      const { card, normalizedSupertype, normalizedTypes } = searchableCard;
      const supertypeMatch =
        supertypeFilter === "all" ||
        normalizedSupertype.includes(supertypeFilter);
      if (!supertypeMatch) {
        return false;
      }

      if (typeFilter !== "all") {
        const hasInlineType = normalizedTypes.some(
          (entry) => entry === typeFilter,
        );
        if (!hasInlineType) {
          if (remoteTypeIdSet) {
            if (!remoteTypeIdSet.has(card.id)) {
              return false;
            }
          } else if (hasInlineTypeData) {
            return false;
          }
        }
      }

      if (!query) {
        return true;
      }

      return (
        normalize(searchableCard.card.displayName).includes(query) ||
        normalize(searchableCard.card.setName).includes(query) ||
        normalize(searchableCard.card.setSeries).includes(query) ||
        normalize(searchableCard.card.artist ?? "").includes(query) ||
        normalize(searchableCard.card.id).includes(query) ||
        normalize(searchableCard.card.number).includes(query) ||
        normalizedTypes.some((entry) => entry.includes(query))
      );
    });

    if (sortMode === "name-asc") {
      return result
        .slice()
        .sort((a, b) => a.card.displayName.localeCompare(b.card.displayName))
        .map((entry) => entry.card);
    }

    if (sortMode === "hp-desc") {
      return result
        .slice()
        .sort((a, b) => (b.card.hp ?? -1) - (a.card.hp ?? -1))
        .map((entry) => entry.card);
    }

    if (sortMode === "release-asc") {
      return result
        .slice()
        .sort((a, b) => {
          if (a.releaseMs !== b.releaseMs) {
            return a.releaseMs - b.releaseMs;
          }
          return a.card.displayName.localeCompare(b.card.displayName);
        })
        .map((entry) => entry.card);
    }

    return result.map((entry) => entry.card);
  }, [
    debouncedSearch,
    hasInlineTypeData,
    remoteTypeIdSet,
    searchableCards,
    sortMode,
    supertypeFilter,
    typeFilter,
  ]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortMode, supertypeFilter, typeFilter]);

  useEffect(() => {
    if (!didMountSearchRef.current) {
      didMountSearchRef.current = true;
      return;
    }

    if (debouncedSearch.trim().length > 0) {
      playUiTone("scroll");
    }
  }, [debouncedSearch, playUiTone]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCards.length / CARDS_PER_PAGE),
  );
  const totalPagesRef = useRef(totalPages);
  totalPagesRef.current = totalPages;
  const safePage = Math.min(page, totalPages);
  const pagedCards = useMemo(
    () =>
      filteredCards.slice(
        (safePage - 1) * CARDS_PER_PAGE,
        safePage * CARDS_PER_PAGE,
      ),
    [filteredCards, safePage],
  );
  const handleSelectCard = useCallback(
    (cardId: string) => {
      setSelectedCardId((current) => {
        playUiTone(current === cardId ? "switch" : "select");
        return cardId;
      });

      if (typeof window !== "undefined") {
        if (window.innerWidth < 768) {
          setIsMobileTerminalOpen(true);
          return;
        }

        if (window.innerWidth < 1280) {
          window.requestAnimationFrame(() => {
            detailAnchorRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
        }
      }
    },
    [playUiTone],
  );

  const handleResetFilters = useCallback(() => {
    const shouldPlay =
      sortMode !== "release-desc" ||
      supertypeFilter !== "all" ||
      typeFilter !== "all" ||
      page !== 1;

    if (shouldPlay) {
      playUiTone("switch");
    }

    setSortMode("release-desc");
    setSupertypeFilter("all");
    setTypeFilter("all");
    setPage(1);
  }, [page, playUiTone, sortMode, supertypeFilter, typeFilter]);

  const handlePreviousPage = useCallback(() => {
    setPage((current) => {
      const next = Math.max(1, current - 1);
      if (next !== current) {
        playUiTone("switch");
      }
      return next;
    });
  }, [playUiTone]);

  const handleNextPage = useCallback(() => {
    setPage((current) => {
      const next = Math.min(totalPagesRef.current, current + 1);
      if (next !== current) {
        playUiTone("switch");
      }
      return next;
    });
  }, [playUiTone]);

  const handleOpenCardZoom = useCallback(() => {
    playUiTone("select");
    setIsCardZoomOpen(true);
  }, [playUiTone]);

  const handleCloseCardZoom = useCallback(() => {
    playUiTone("switch");
    setIsCardZoomOpen(false);
  }, [playUiTone]);

  const handleCloseMobileTerminal = useCallback(() => {
    setIsMobileTerminalOpen(false);
    playUiTone("switch");
  }, [playUiTone]);

  const handleToggleMobileFilters = useCallback(() => {
    setIsMobileFiltersOpen((current) => {
      playUiTone("switch");
      return !current;
    });
  }, [playUiTone]);

  useEffect(() => {
    if (safePage !== page) {
      setPage(safePage);
    }
  }, [page, safePage]);

  useEffect(() => {
    if (filteredCards.length === 0) {
      setSelectedCardId(null);
      return;
    }

    if (
      selectedCardId &&
      filteredCards.some((card) => card.id === selectedCardId)
    ) {
      return;
    }

    setSelectedCardId(pagedCards[0]?.id ?? filteredCards[0]?.id ?? null);
  }, [filteredCards, pagedCards, selectedCardId]);

  useEffect(() => {
    setIsCardZoomOpen(false);
  }, [selectedCardId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!isMobileTerminalOpen || !window.matchMedia("(max-width: 767px)").matches) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileTerminalOpen]);

  const selectedCardIndex = useMemo(
    () => (selectedCardId ? (cardsById.get(selectedCardId) ?? null) : null),
    [cardsById, selectedCardId],
  );

  const selectedCard = useMemo(() => {
    if (selectedCardQuery.data) {
      return selectedCardQuery.data;
    }
    if (selectedCardIndex) {
      return toPlaceholderDetail(selectedCardIndex);
    }
    return null;
  }, [selectedCardQuery.data, selectedCardIndex]);

  useEffect(() => {
    if (!selectedCard) {
      setIsMobileTerminalOpen(false);
    }
  }, [selectedCard]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncViewport = () => {
      setIsMobileViewport(mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  useEffect(() => {
    if (!isCardZoomOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCardZoomOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCardZoomOpen]);

  const frameStatus = useMemo(() => {
    if (catalogQuery.isError || selectedCardQuery.isError) {
      return "error" as const;
    }
    if (
      catalogQuery.isLoading ||
      (Boolean(selectedCardId) && selectedCardQuery.isLoading && !selectedCard)
    ) {
      return "loading" as const;
    }
    if (!selectedCard) {
      return "idle" as const;
    }
    return "success" as const;
  }, [
    catalogQuery.isError,
    catalogQuery.isLoading,
    selectedCard,
    selectedCardId,
    selectedCardQuery.isError,
    selectedCardQuery.isLoading,
  ]);

  const leftPanel = (
    <section className="cards-explorer-left space-y-4">
      <div className="cards-filter-console relative overflow-hidden rounded-2xl border border-black/20 bg-[radial-gradient(circle_at_9%_14%,rgba(255,255,255,0.44),transparent_28%),radial-gradient(circle_at_88%_0%,rgba(108,168,118,0.18),transparent_40%),linear-gradient(155deg,rgba(255,255,255,0.75),rgba(224,238,227,0.72))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_10px_18px_rgba(16,50,20,0.08)]">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(64,128,74,0.6),transparent)]" />

        <div className="relative">
          <div className="cards-filter-console-head flex flex-wrap items-center justify-between gap-2">
            <p className="cards-filter-console-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/72">
              Card Explorer
            </p>
            <span className="cards-filter-console-badge pixel-font rounded-md border border-black/18 bg-white/65 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-black/58">
              Deck Filters
            </span>
          </div>

          <p className="cards-filter-console-copy mt-1 text-xs text-black/58">
            Refine the full card archive by release, class, and type.
          </p>

          <div className="cards-filter-search-row mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label
              htmlFor="cards-search"
              className="search-deck-field w-full sm:flex-1"
            >
              <span className="search-deck-led" aria-hidden />
              <span className="search-deck-ball" aria-hidden />
              <input
                id="cards-search"
                value={searchInput}
                onChange={(event) => handleSearchInput(event.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-gramm="false"
                placeholder="Search card, set, artist, type..."
                className="search-deck-input"
              />
              {searchInput.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleClearSearch();
                  }}
                  className="search-deck-clear-btn"
                  aria-label="Clear search"
                >
                  x
                </button>
              ) : null}
              <span className="search-deck-gloss" aria-hidden />
            </label>

            <button
              type="button"
              onClick={handleToggleMobileFilters}
              className={cn(
                "cards-mobile-filter-toggle pixel-font rounded-lg border border-black/22 bg-white/80 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-black/74 md:hidden",
                isMobileFiltersOpen && "cards-mobile-filter-toggle-active",
              )}
            >
              Filters
            </button>

          </div>

          <div className="cards-mobile-quick-filter-grid mt-3 md:hidden">
            <QuickFilterButton
              label="Pokemon"
              shortCode="PK"
              active={supertypeFilter === "pokemon"}
              onClick={() => handleQuickSupertypeToggle("pokemon")}
            />
            <QuickFilterButton
              label="Trainer"
              shortCode="TR"
              active={supertypeFilter === "trainer"}
              onClick={() => handleQuickSupertypeToggle("trainer")}
            />
            <QuickFilterButton
              label="Energy"
              shortCode="EN"
              active={supertypeFilter === "energy"}
              onClick={() => handleQuickSupertypeToggle("energy")}
            />
            {popularTypeFilters.map((entry) => (
              <QuickFilterButton
                key={`cards-mobile-type-${entry.label}`}
                label={entry.label}
                shortCode={entry.label.slice(0, 2).toUpperCase()}
                active={typeFilter === normalize(entry.label)}
                onClick={() => handleQuickTypeToggle(entry.label)}
              />
            ))}
          </div>

          <div
            className={cn(
              "cards-filter-drawer mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]",
              isMobileFiltersOpen && "cards-filter-drawer-open",
            )}
          >
            <div className="cards-sort-box min-w-[168px] rounded-xl border border-black/20 bg-white/64 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.76)]">
              <p className="pixel-font px-1 text-[8px] uppercase tracking-[0.12em] text-black/55">
                Sort
              </p>
              <select
                value={sortMode}
                onChange={(event) =>
                  handleSortModeValue(event.currentTarget.value)
                }
                className="mt-1 w-full rounded-lg border border-black/20 bg-white/88 px-2.5 py-2 text-xs text-black/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition focus:border-black/35 focus:outline-none"
              >
                <option value="release-desc">Latest release</option>
                <option value="release-asc">Oldest release</option>
                <option value="name-asc">Name A-Z</option>
                <option value="hp-desc">Highest HP</option>
              </select>
            </div>

            <div className="cards-supertype-box rounded-xl border border-black/20 bg-white/64 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.76)]">
              <p className="pixel-font px-1 text-[8px] uppercase tracking-[0.12em] text-black/55">
                Supertype
              </p>
              <select
                value={supertypeFilter}
                onChange={(event) =>
                  handleSupertypeValue(event.currentTarget.value)
                }
                className="mt-1 w-full rounded-lg border border-black/20 bg-white/88 px-2.5 py-2 text-xs text-black/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition focus:border-black/35 focus:outline-none"
              >
                <option value="all">All supertypes</option>
                <option value="pokemon">Pokemon</option>
                <option value="trainer">Trainer</option>
                <option value="energy">Energy</option>
              </select>
            </div>

            <div className="cards-type-box rounded-xl border border-black/20 bg-white/64 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.76)]">
              <p className="pixel-font px-1 text-[8px] uppercase tracking-[0.12em] text-black/55">
                Type
              </p>
              <select
                value={typeFilter}
                onChange={(event) => handleTypeValue(event.currentTarget.value)}
                className="mt-1 w-full rounded-lg border border-black/20 bg-white/88 px-2.5 py-2 text-xs text-black/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition focus:border-black/35 focus:outline-none"
              >
                <option value="all">All types</option>
                {availableTypes.map((entry) => (
                  <option key={`card-type-${entry}`} value={normalize(entry)}>
                    {entry}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="pixel-font inline-flex h-[42px] items-center justify-center self-end rounded-lg border border-black/22 bg-white/74 px-3 text-[10px] uppercase tracking-[0.11em] text-black/72 transition hover:bg-white"
            >
              Reset
            </button>
          </div>

          <div className="cards-filter-chip-row mt-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-black/15 bg-white/46 px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
            <InfoChip value={`Visible ${formatCount(filteredCards.length)}`} />
            <InfoChip value={`Total ${formatCount(cards.length)}`} />
            {isUsingLocalFallback ? (
              <InfoChip value="Local fallback active" tone="rose" />
            ) : null}
            {typeFilter !== "all" && remoteTypeIdsQuery.isFetching ? (
              <InfoChip value="Syncing type filter..." tone="amber" />
            ) : null}
            {selectedCard ? (
              <InfoChip
                value={`Active ${selectedCard.displayName}`}
                tone="sky"
              />
            ) : null}
          </div>
        </div>
      </div>

      {isUsingLocalFallback ? (
        <div className="rounded-xl border border-rose-300/85 bg-[linear-gradient(145deg,rgba(255,236,239,0.85),rgba(255,219,228,0.72))] px-3 py-2 text-xs text-rose-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]">
          Live card source is unavailable right now. Showing local backup cards.
        </div>
      ) : null}

      <section className="cards-catalog-panel rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.64),rgba(224,234,246,0.58))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.74)]">
        <p className="cards-catalog-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Card Catalog
        </p>

        {catalogQuery.isLoading ? (
          <div className="pokemon-scrollbar mt-3 h-[58vh] min-h-[360px] max-h-[86vh] sm:h-[64vh] sm:min-h-[520px] sm:max-h-[88vh] lg:h-[72vh] lg:min-h-[760px] lg:max-h-[900px] overflow-y-scroll pr-1">
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={`card-skeleton-${index}`}
                  className="h-[92px] animate-pulse rounded-xl bg-black/10"
                />
              ))}
            </div>
          </div>
        ) : null}

        {!catalogQuery.isLoading && pagedCards.length === 0 ? (
          <div className="pokemon-scrollbar mt-3 h-[58vh] min-h-[360px] max-h-[86vh] sm:h-[64vh] sm:min-h-[520px] sm:max-h-[88vh] lg:h-[72vh] lg:min-h-[760px] lg:max-h-[900px] overflow-y-scroll pr-1">
            <p className="rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-4 text-sm text-black/65">
              No cards found with this filter.
            </p>
          </div>
        ) : null}

        {pagedCards.length > 0 ? (
          <div className="cards-catalog-scroll pokemon-scrollbar mt-3 h-[58vh] min-h-[360px] max-h-[86vh] sm:h-[64vh] sm:min-h-[520px] sm:max-h-[88vh] lg:h-[72vh] lg:min-h-[760px] lg:max-h-[900px] overflow-y-scroll pr-1">
            <div className="cards-catalog-grid grid gap-3 sm:gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,236px),1fr))]">
              {pagedCards.map((card) => {
                const isSelected = card.id === selectedCardId;
                const badgeTypes = resolveCatalogBadgeTypes(card);
                const artwork = card.imageSmall ?? card.imageLarge;
                const cardButton = (
                  <article
                    data-selected={isSelected ? "true" : "false"}
                    className={cn(
                      "pokemon-card-shell cards-mobile-card group relative flex h-full min-h-[252px] w-full flex-col overflow-hidden rounded-2xl border p-3 text-left transition sm:p-3.5",
                      isSelected
                        ? "pokemon-card-selected"
                        : "pokemon-card-idle",
                    )}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectCard(card.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleSelectCard(card.id);
                        }
                      }}
                      aria-pressed={isSelected}
                      aria-label={`Select card ${card.displayName}`}
                      className="cards-mobile-card-hit-area w-full flex-1 text-left"
                    >
                      <div className="cards-mobile-card-head flex items-start justify-between gap-3">
                        <div className="cards-mobile-card-copy min-w-0">
                          <p className="pokemon-card-index pixel-font text-[9px] uppercase tracking-[0.14em] text-black/55">
                            {formatCatalogDexLabel(card)}
                          </p>
                          <p className="pokemon-card-name pixel-font mt-1 line-clamp-1 text-[11px] uppercase tracking-wide">
                            {card.displayName}
                          </p>
                          <p className="pokemon-card-generation mt-1 line-clamp-1 text-[11px] text-black/55">
                            {card.setName}
                          </p>
                        </div>
                        <div
                          className="cards-mobile-card-favorite-wrap shrink-0"
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <FavoriteStarButton
                            favorite={{
                              entityType: "card",
                              entityId: card.id,
                              title: card.displayName,
                              href: "/cards",
                              imageUrl:
                                card.imageSmall ?? card.imageLarge ?? null,
                              subtitle: card.setName,
                              tags: ["card", card.supertype.toLowerCase()],
                            }}
                            compact={false}
                            className="h-9 w-9 min-w-0 px-0"
                          />
                        </div>
                      </div>

                      <div className="cards-mobile-card-content mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 sm:gap-3">
                        <div className="cards-mobile-card-art-shell pokemon-card-sprite relative h-[114px] w-[114px] flex-shrink-0 sm:h-[130px] sm:w-[130px]">
                          {artwork ? (
                            <Image
                              src={artwork}
                              alt={`${card.displayName} card`}
                              fill
                              sizes="(min-width: 640px) 130px, 114px"
                              className="object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.25)]"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-black/45">
                              No art
                            </div>
                          )}
                        </div>
                        <div className="cards-mobile-card-types pokemon-card-type-stack flex min-w-0 flex-col items-end gap-1.5">
                          {badgeTypes.map((type) => (
                            <TypeBadge
                              key={`${card.id}-${type}`}
                              type={type}
                              className="pokemon-card-type-badge h-6 min-w-[82px] justify-center px-2 text-[8px]"
                            />
                          ))}
                        </div>
                      </div>

                      <div className="cards-mobile-card-meta-row mt-3">
                        <p className="cards-mobile-card-name pixel-font">
                          {card.displayName}
                        </p>
                        {card.rarity ? (
                          <span className="cards-mobile-card-rarity pixel-font">
                            {card.rarity}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );

                return <div key={card.id}>{cardButton}</div>;
              })}
            </div>
          </div>
        ) : null}

        <div className="cards-pagination mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handlePreviousPage}
            disabled={safePage <= 1}
            className="cards-pagination-btn rounded-lg border border-black/20 bg-white/78 px-2.5 py-1 text-xs text-black/70 transition hover:bg-white disabled:opacity-50"
          >
            Previous
          </button>
          <span className="cards-pagination-state text-xs text-black/65">
            Page {safePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={safePage >= totalPages}
            className="cards-pagination-btn rounded-lg border border-black/20 bg-white/78 px-2.5 py-1 text-xs text-black/70 transition hover:bg-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </section>
    </section>
  );

  const detailPanel = (
      <div className="cards-detail-panel rounded-2xl border border-black/20 bg-[linear-gradient(165deg,rgba(255,255,255,0.64),rgba(226,236,247,0.58))] p-4 min-h-[420px] sm:min-h-[560px] lg:min-h-[760px] shadow-[inset_0_1px_0_rgba(255,255,255,0.74),0_10px_18px_rgba(0,0,0,0.07)]">
        <p className="cards-detail-panel-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Card Details
        </p>

        {!selectedCard ? (
          <p className="cards-detail-empty mt-3 rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-4 text-sm text-black/65">
            Select a card to open full deck intelligence.
          </p>
        ) : (
          <div className="cards-detail-scroll pokemon-scrollbar mt-3 max-h-[70vh] sm:max-h-[75vh] lg:max-h-[79vh] overflow-y-auto pr-1">
            <div className="cards-detail-stack space-y-4">
              <section className="tcg-showcase-shell cards-detail-hero rounded-2xl border border-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="cards-detail-hero-copy">
                    <p className="cards-detail-series pixel-font text-[10px] uppercase tracking-[0.14em] text-black/58">
                      {selectedCard.setSeries}
                    </p>
                    <h1 className="cards-detail-name pixel-font mt-1 text-[14px] uppercase tracking-[0.12em] text-black/86">
                      {selectedCard.displayName}
                    </h1>
                    <p className="cards-detail-release mt-1 text-sm text-black/64">
                      {selectedCard.setName} | Released{" "}
                      {formatReleaseDate(selectedCard.setReleaseDate)}
                    </p>
                  </div>

                  <div className="cards-detail-chip-row flex flex-wrap items-center gap-1.5">
                    <FavoriteStarButton
                      favorite={{
                        entityType: "card",
                        entityId: selectedCard.id,
                        title: selectedCard.displayName,
                        href: "/cards",
                        imageUrl:
                          selectedCard.imageSmall ??
                          selectedCard.imageLarge ??
                          null,
                        subtitle: selectedCard.setName,
                        tags: ["card", selectedCard.supertype.toLowerCase()],
                      }}
                    />
                    <InfoChip value={selectedCard.supertype} />
                    {selectedCard.rarity ? (
                      <InfoChip value={selectedCard.rarity} tone="amber" />
                    ) : null}
                    <InfoChip
                      value={`Type ${
                        selectedCard.types[0]
                          ? selectedCard.types[0]
                          : selectedCard.supertype
                      }`}
                      tone="sky"
                    />
                  </div>
                </div>

                <div className="cards-detail-hero-grid mt-4 grid gap-3 lg:[grid-template-columns:minmax(0,1fr)_minmax(280px,360px)]">
                  <div className="tcg-showcase-card cards-detail-art-card relative min-h-[320px] overflow-hidden rounded-2xl border border-black/25 bg-[linear-gradient(165deg,rgba(255,255,255,0.9),rgba(223,233,246,0.82))]">
                    {selectedCard.imageLarge ? (
                      <>
                        <Image
                          src={selectedCard.imageLarge}
                          alt={`${selectedCard.displayName} card artwork`}
                          fill
                          priority={selectedCard.id === filteredCards[0]?.id}
                          sizes="(max-width: 1024px) 95vw, 34vw"
                          className="tcg-showcase-image object-contain p-4"
                        />
                        <button
                          type="button"
                          onClick={handleOpenCardZoom}
                          className="no-gbc-btn absolute inset-0 z-[2] cursor-zoom-in border-0 bg-transparent p-0"
                          aria-label={`Zoom ${selectedCard.displayName} card artwork`}
                        />
                        <span className="cards-detail-zoom-chip pointer-events-none absolute bottom-3 right-3 z-[3] rounded-md border border-black/30 bg-white/84 px-2 py-1 text-[11px] text-black/72 shadow-[0_2px_8px_rgba(0,0,0,0.16)]">
                          Zoom
                        </span>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-black/50">
                        No artwork available
                      </div>
                    )}
                    <span className="tcg-showcase-foil pointer-events-none absolute inset-0" />
                  </div>

                  <div className="cards-detail-fact-stack space-y-3">
                    <div className="cards-detail-fact-grid grid gap-2 sm:grid-cols-2">
                      <InfoTile
                        label="Hit Points"
                        value={`HP ${selectedCard.hp ?? "N/A"}`}
                        tone="green"
                      />
                      <InfoTile
                        label="Card Number"
                        value={`#${selectedCard.number}`}
                      />
                      {selectedCard.stage ? (
                        <InfoTile
                          label="Evolution Stage"
                          value={selectedCard.stage}
                          tone="sky"
                        />
                      ) : null}
                      {selectedCard.regulationMark ? (
                        <InfoTile
                          label="Regulation"
                          value={selectedCard.regulationMark}
                          tone="rose"
                        />
                      ) : null}
                    </div>

                    {selectedCard.types.length > 0 ? (
                      <div className="cards-detail-type-signature rounded-lg border border-black/18 bg-[linear-gradient(150deg,rgba(255,255,255,0.88),rgba(232,242,249,0.74))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                        <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-black/62">
                          Type Signature
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {selectedCard.types.map((entry) => (
                            <InfoChip
                              key={`${selectedCard.id}-type-${entry}`}
                              value={entry}
                              tone="sky"
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {selectedCard.flavorText ? (
                      <p className="cards-detail-flavor rounded-lg border border-black/18 bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(235,244,249,0.78))] px-3 py-2 text-sm italic text-black/76 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]">
                        &ldquo;{selectedCard.flavorText}&rdquo;
                      </p>
                    ) : null}

                  </div>
                </div>
              </section>

              <DetailSection
                title="Card Snapshot"
                subtitle="Core attributes and legal state."
              >
                <div className="cards-detail-snapshot-grid grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoTile
                    label="Artist"
                    value={selectedCard.artist ?? "Unknown"}
                  />
                  <InfoTile
                    label="Pokedex"
                    value={
                      selectedCard.nationalPokedexNumbers.length > 0
                        ? selectedCard.nationalPokedexNumbers.join(", ")
                        : "N/A"
                    }
                  />
                  <InfoTile
                    label="Evolves From"
                    value={selectedCard.evolvesFrom ?? "Base card"}
                  />
                  <InfoTile
                    label="Standard"
                    value={selectedCard.legalityStandard ?? "Unknown"}
                    tone="green"
                  />
                  <InfoTile
                    label="Expanded"
                    value={selectedCard.legalityExpanded ?? "Unknown"}
                    tone="sky"
                  />
                  <InfoTile
                    label="Unlimited"
                    value={selectedCard.legalityUnlimited ?? "Unknown"}
                    tone="amber"
                  />
                </div>
              </DetailSection>

              <DetailSection
                title="Attack Matrix"
                subtitle={`Damage lines and costs (${selectedCard.attackEntries.length} attacks).`}
              >
                <EncyclopediaDataTable
                  className="border-black/22 bg-[linear-gradient(150deg,rgba(255,255,255,0.88),rgba(232,241,248,0.76))] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]"
                  rows={selectedCard.attackEntries}
                  rowKey={(attack, index) => `${attack.name}-${index}`}
                  columns={[
                    {
                      key: "attack",
                      header: "Attack",
                      headerClassName:
                        "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                      render: (attack) => attack.name,
                    },
                    {
                      key: "cost",
                      header: "Cost",
                      headerClassName:
                        "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                      render: (attack) =>
                        attack.cost.length > 0
                          ? attack.cost.join(" + ")
                          : "No cost",
                    },
                    {
                      key: "damage",
                      header: "Damage",
                      headerClassName:
                        "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                      render: (attack) => attack.damage ?? "N/A",
                    },
                    {
                      key: "effect",
                      header: "Effect",
                      headerClassName:
                        "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                      render: (attack) => attack.text ?? "No extra effect.",
                    },
                  ]}
                  emptyMessage="No attack lines available for this card."
                />
              </DetailSection>

              <DetailSection
                title="Abilities & Rules"
                subtitle="Passive effects and official rule text."
              >
                <div className="space-y-3">
                  <EncyclopediaDataTable
                    className="border-black/22 bg-[linear-gradient(150deg,rgba(255,255,255,0.88),rgba(232,241,248,0.76))] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]"
                    rows={selectedCard.abilityEntries}
                    rowKey={(ability, index) => `${ability.name}-${index}`}
                    columns={[
                      {
                        key: "ability",
                        header: "Ability",
                        headerClassName:
                          "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                        render: (ability) =>
                          `${ability.name}${ability.type ? ` (${ability.type})` : ""}`,
                      },
                      {
                        key: "effect",
                        header: "Effect",
                        headerClassName:
                          "pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65",
                        render: (ability) => ability.text,
                      },
                    ]}
                    emptyMessage="No passive abilities on this card."
                  />

                  <ul className="space-y-1.5">
                    {(selectedCard.rules.length > 0
                      ? selectedCard.rules
                      : ["No additional rule text for this card."]
                    ).map((rule, index) => (
                      <RuleCard
                        key={`${selectedCard.id}-rule-${index}`}
                        value={rule}
                      />
                    ))}
                  </ul>
                </div>
              </DetailSection>

              <DetailSection
                title="Battle Resistances"
                subtitle="Weakness, resistance and retreat profile."
              >
                <div className="cards-detail-resistance-grid grid gap-3 lg:grid-cols-3">
                  <div className="rounded-xl border border-rose-300/65 bg-[linear-gradient(145deg,rgba(255,248,249,0.88),rgba(255,234,238,0.72))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                    <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-rose-900/78">
                      Weaknesses
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedCard.weaknesses.length > 0 ? (
                        selectedCard.weaknesses.map((entry, index) => (
                          <InfoChip
                            key={`${selectedCard.id}-weak-${entry.type}-${index}`}
                            value={`${entry.type} ${entry.value}`}
                            tone="rose"
                          />
                        ))
                      ) : (
                        <span className="text-xs text-black/58">
                          None listed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-300/65 bg-[linear-gradient(145deg,rgba(246,255,250,0.88),rgba(227,247,236,0.72))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                    <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-emerald-900/78">
                      Resistances
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedCard.resistances.length > 0 ? (
                        selectedCard.resistances.map((entry, index) => (
                          <InfoChip
                            key={`${selectedCard.id}-resist-${entry.type}-${index}`}
                            value={`${entry.type} ${entry.value}`}
                            tone="green"
                          />
                        ))
                      ) : (
                        <span className="text-xs text-black/58">
                          None listed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-sky-300/65 bg-[linear-gradient(145deg,rgba(248,252,255,0.88),rgba(230,240,251,0.72))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                    <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-sky-900/78">
                      Retreat Cost
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedCard.retreatCost.length > 0 ? (
                        selectedCard.retreatCost.map((entry, index) => (
                          <InfoChip
                            key={`${selectedCard.id}-retreat-${entry}-${index}`}
                            value={entry}
                          />
                        ))
                      ) : (
                        <span className="text-xs text-black/58">
                          None listed
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <InfoTile
                        label="Converted"
                        value={String(
                          selectedCard.convertedRetreatCost ?? "N/A",
                        )}
                        tone="sky"
                      />
                    </div>
                  </div>
                </div>
              </DetailSection>
            </div>
          </div>
        )}
      </div>
  );

  const rightPanel = (
    <section ref={detailAnchorRef} className="cards-explorer-right space-y-4">
      {detailPanel}
    </section>
  );

  const mobileBottomNav = (
    <MobileDexBottomNav
      activeKey="explore"
      className="cards-mobile-bottom-nav"
      onExplore={() => {
        handleCloseMobileTerminal();
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      onSettings={() => {
        handleCloseMobileTerminal();
        setIsMobileFiltersOpen(true);
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
    />
  );

  const mobileDetailTerminal = (
    <AnimatePresence>
      {selectedCard && isMobileTerminalOpen ? (
        <m.div
          key={`cards-mobile-terminal-${selectedCard.id}`}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="home-mobile-terminal-overlay cards-mobile-terminal-overlay md:hidden"
        >
          <div className="home-mobile-terminal-frame cards-mobile-terminal-frame">
            <header className="home-mobile-terminal-topbar">
              <div className="home-mobile-terminal-leds" aria-hidden>
                <span className="pokedex-led pokedex-led-signal h-4 w-4 bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.64)]" />
                <span className="pokedex-led pokedex-led-signal h-2.5 w-2.5 bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.58)]" />
                <span className="pokedex-led pokedex-led-signal h-2.5 w-2.5 bg-red-300 shadow-[0_0_8px_rgba(252,165,165,0.58)]" />
              </div>
              <p className="pixel-font home-mobile-terminal-title">
                Card Details: {selectedCard.displayName}
              </p>
              <div className="home-mobile-terminal-avatar-slot">
                <PokedexHeaderAccess tone="dark" className="home-mobile-terminal-access" />
              </div>
            </header>

            <div className="home-mobile-terminal-screen cards-mobile-terminal-screen">
              <div className="cards-mobile-detail-toolbar">
                <button
                  type="button"
                  onClick={handleCloseMobileTerminal}
                  className="cards-mobile-back pixel-font"
                >
                  Back to Index
                </button>
              </div>
              {detailPanel}
            </div>
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      <PokedexFrame
        title={isMobileViewport ? "DexLoom" : "Pokemon Trading Card Encyclopedia"}
        status={frameStatus}
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        className="cards-mobile-frame"
      />
      {mobileDetailTerminal}
      {mobileBottomNav}

      {isCardZoomOpen && selectedCard?.imageLarge ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/72 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedCard.displayName} zoom`}
        >
          <button
            type="button"
            onClick={handleCloseCardZoom}
            aria-label="Close card zoom"
            className="no-gbc-btn absolute inset-0 border-0 bg-transparent p-0"
          />

          <div className="relative z-[1] w-full max-w-[760px] rounded-2xl border border-white/25 bg-black/45 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
            <div className="relative mx-auto aspect-[5/7] w-full overflow-hidden rounded-xl border border-white/30 bg-black/25">
              <Image
                src={selectedCard.imageLarge}
                alt={`${selectedCard.displayName} zoomed card artwork`}
                fill
                priority
                sizes="(max-width: 900px) 90vw, 700px"
                className="object-contain p-2"
              />
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="pixel-font text-[10px] uppercase tracking-[0.12em] text-white/88">
                {selectedCard.displayName}
              </p>
              <button
                type="button"
                onClick={handleCloseCardZoom}
                className="no-gbc-btn rounded-lg border border-white/35 bg-white/16 px-2.5 py-1 text-xs text-white/90 transition hover:bg-white/24"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
