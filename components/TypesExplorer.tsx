"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from "react";
import { EncyclopediaDataTable } from "@/components/EncyclopediaDataTable";
import { ExplorerDetailSection, ExplorerEmptyState, ExplorerSearchBar } from "@/components/explorer";
import { FavoriteStarButton } from "@/components/FavoriteStarButton";
import { MobileDexBottomNav } from "@/components/MobileDexBottomNav";
import { PokedexFrame } from "@/components/PokedexFrame";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { TypeBadge } from "@/components/TypeBadge";
import { VirtualizedGrid } from "@/components/VirtualizedGrid";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUiTone } from "@/hooks/useUiTone";
import {
  pokemonTypeDetailQueryOptions,
  pokemonTypeIndexQueryOptions
} from "@/lib/pokemon-query-options";
import { cn } from "@/lib/utils";

const TYPE_ACCENT_MAP: Record<string, string> = {
  normal: "#A8A77A",
  fire: "#EE5A0D",
  water: "#1F6BD6",
  electric: "#D6B10D",
  grass: "#49A443",
  ice: "#5BBFB8",
  fighting: "#972A1B",
  poison: "#7938A3",
  ground: "#C69F2C",
  flying: "#7F6FD2",
  psychic: "#D43871",
  bug: "#7C8D0A",
  rock: "#8E7820",
  ghost: "#513878",
  dragon: "#4F2ED0",
  dark: "#4A372A",
  steel: "#8888A0",
  fairy: "#DC89C0"
};

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
      : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  if ([red, green, blue].some((channel) => Number.isNaN(channel))) {
    return `rgba(107, 114, 128, ${alpha})`;
  }

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function IntelChip({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="types-intel-chip rounded-lg border border-black/18 bg-white/72 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
      <p className="pixel-font text-[8px] uppercase tracking-[0.12em] text-black/58">{label}</p>
      <p className="mt-1 text-sm font-medium text-black/78">{value}</p>
    </div>
  );
}

function StatMeter({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: "green" | "amber" | "rose" | "sky";
}) {
  const fillClass =
    tone === "green"
      ? "from-emerald-400 to-emerald-600"
      : tone === "amber"
        ? "from-amber-300 to-amber-500"
        : tone === "rose"
          ? "from-rose-400 to-rose-600"
          : "from-sky-400 to-sky-600";

  return (
    <div className="types-stat-meter rounded-lg border border-black/18 bg-white/72 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.74)]">
      <div className="flex items-center justify-between gap-2">
        <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-black/65">{label}</p>
        <span className="text-xs text-black/62">{value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full border border-black/15 bg-black/10">
        <span
          className={cn("block h-full bg-gradient-to-r", fillClass)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function RelationGroup({
  title,
  values,
  tone
}: {
  title: string;
  values: string[];
  tone: "danger" | "safe" | "neutral";
}) {
  const panelClass =
    tone === "danger"
      ? "border-rose-300/70 bg-[linear-gradient(150deg,rgba(255,246,248,0.94),rgba(255,231,236,0.8))]"
      : tone === "safe"
        ? "border-emerald-300/70 bg-[linear-gradient(150deg,rgba(245,255,249,0.94),rgba(224,247,233,0.8))]"
        : "border-slate-300/70 bg-[linear-gradient(150deg,rgba(248,251,255,0.94),rgba(232,238,250,0.8))]";

  const counterClass =
    tone === "danger"
      ? "border-rose-300 bg-rose-100/86 text-rose-900"
      : tone === "safe"
        ? "border-emerald-300 bg-emerald-100/86 text-emerald-900"
        : "border-slate-300 bg-slate-100/86 text-slate-800";

  return (
    <article className={cn("types-relation-group rounded-xl border px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]", panelClass)}>
      <div className="flex items-center justify-between gap-2">
        <p className="pixel-font text-[9px] uppercase tracking-[0.12em] text-black/72">{title}</p>
        <span className={cn("rounded-md border px-1.5 py-0.5 text-[10px] font-medium", counterClass)}>
          {values.length}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.length > 0 ? (
          values.map((value) => (
            <TypeBadge
              key={`${title}-${value}`}
              type={value}
              className="h-6 min-w-[86px] px-2 text-[8px]"
            />
          ))
        ) : (
          <span className="text-xs text-black/62">None</span>
        )}
      </div>
    </article>
  );
}

/* DetailSection replaced by ExplorerDetailSection from @/components/explorer */

export function TypesExplorer() {
  const playUiTone = useUiTone();
  const controlsRef = useRef<HTMLElement | null>(null);
  const catalogRef = useRef<HTMLElement | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const debouncedSearch = useDebouncedValue(searchInput, 220);
  const didMountSearchRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const indexQuery = useQuery(pokemonTypeIndexQueryOptions());
  const types = useMemo(() => indexQuery.data ?? [], [indexQuery.data]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    playUiTone("switch");
    setSearchInput("");
  }, [playUiTone]);

  const filteredTypes = useMemo(() => {
    const query = normalize(debouncedSearch);
    if (!query) {
      return types;
    }
    return types.filter((type) => {
      return (
        normalize(type.name).includes(query) ||
        normalize(type.displayName).includes(query) ||
        String(type.id).startsWith(query)
      );
    });
  }, [debouncedSearch, types]);

  useEffect(() => {
    if (!didMountSearchRef.current) {
      didMountSearchRef.current = true;
      return;
    }

    if (debouncedSearch.trim().length > 0) {
      playUiTone("scroll");
    }
  }, [debouncedSearch, playUiTone]);

  const scrollToElement = useCallback((element: HTMLElement | null) => {
    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleSelectType = useCallback(
    (typeId: number) => {
      setSelectedTypeId((current) => {
        playUiTone(current === typeId ? "switch" : "select");
        return typeId;
      });

      if (typeof window !== "undefined" && window.innerWidth < 768) {
        window.requestAnimationFrame(() => {
          scrollToElement(detailRef.current);
        });
      }
    },
    [playUiTone, scrollToElement]
  );

  const handleMobileExplore = useCallback(() => {
    playUiTone("switch");
    scrollToElement(catalogRef.current);
  }, [playUiTone, scrollToElement]);

  const handleMobileSettings = useCallback(() => {
    playUiTone("switch");
    scrollToElement(controlsRef.current);
  }, [playUiTone, scrollToElement]);

  useEffect(() => {
    if (filteredTypes.length === 0) {
      setSelectedTypeId(null);
      return;
    }
    if (selectedTypeId && filteredTypes.some((type) => type.id === selectedTypeId)) {
      return;
    }
    setSelectedTypeId(filteredTypes[0].id);
  }, [filteredTypes, selectedTypeId]);

  const detailQuery = useQuery({
    ...pokemonTypeDetailQueryOptions(selectedTypeId ?? ""),
    enabled: Boolean(selectedTypeId),
    placeholderData: keepPreviousData
  });
  const selectedType = detailQuery.data ?? null;

  const activeAccent = useMemo(() => {
    const key = selectedType?.name ? normalize(selectedType.name) : "";
    return TYPE_ACCENT_MAP[key] ?? "#6b7280";
  }, [selectedType?.name]);

  const activeAccentSoft = useMemo(() => hexToRgba(activeAccent, 0.22), [activeAccent]);
  const activeAccentBorder = useMemo(() => hexToRgba(activeAccent, 0.45), [activeAccent]);

  const battleIntel = useMemo(() => {
    if (!selectedType) {
      return null;
    }

    return {
      offensePressure: clampPercent(
        selectedType.doubleDamageTo.length * 17 +
        selectedType.noDamageTo.length * 10 -
        selectedType.halfDamageTo.length * 3 +
        22
      ),
      defenseStability: clampPercent(
        selectedType.halfDamageFrom.length * 14 +
        selectedType.noDamageFrom.length * 23 -
        selectedType.doubleDamageFrom.length * 5 +
        24
      ),
      riskLoad: clampPercent(selectedType.doubleDamageFrom.length * 18 + 10),
      ecosystemReach: clampPercent(
        Math.round(selectedType.pokemonCount / 4.6 + selectedType.moveCount / 5.6)
      )
    };
  }, [selectedType]);

  const frameStatus = useMemo(() => {
    if (indexQuery.isError || detailQuery.isError) {
      return "error" as const;
    }
    if (indexQuery.isLoading || (detailQuery.isLoading && Boolean(selectedTypeId))) {
      return "loading" as const;
    }
    return "success" as const;
  }, [detailQuery.isError, detailQuery.isLoading, indexQuery.isError, indexQuery.isLoading, selectedTypeId]);

  const leftPanel = (
    <section className="types-mobile-left space-y-4">
      <section
        ref={controlsRef}
        className="types-mobile-controls rounded-2xl border border-black/20 bg-[radial-gradient(circle_at_12%_12%,rgba(255,255,255,0.55),transparent_40%),linear-gradient(160deg,rgba(255,255,255,0.84),rgba(225,237,230,0.75))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_12px_20px_rgba(0,0,0,0.08)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
            Type Command Deck
          </p>
          <RouteTransitionLink
            href="/"
            className="gbc-nav-link pixel-font inline-flex rounded-lg border border-black/25 bg-white/75 px-2.5 py-1.5 text-[9px] uppercase tracking-wide text-black/75 transition hover:bg-white"
          >
            Back to Pokedex
          </RouteTransitionLink>
        </div>

        <h1 className="pixel-font mt-2 text-[15px] uppercase tracking-[0.12em] text-black/84 sm:text-[17px]">
          Element Matrix Intelligence
        </h1>
        <p className="mt-2 text-sm text-black/74">
          Decode offensive pressure, defensive stability, and ecosystem reach for every Pokemon type.
        </p>

        <div className="mt-3">
          <ExplorerSearchBar
            id="types-search"
            value={searchInput}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
            placeholder="Search types..."
          />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <IntelChip label="Visible Types" value={String(filteredTypes.length)} />
          <IntelChip label="Total Types" value={String(types.length)} />
          <IntelChip label="Active Type" value={selectedType?.displayName ?? "None"} />
          <IntelChip label="Generation" value={selectedType?.generation ?? "Unknown"} />
        </div>
      </section>

      <section
        ref={catalogRef}
        className="types-mobile-catalog rounded-2xl border border-black/20 bg-white/55 p-3"
      >
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/72">
          Type Matrix
        </p>
        <p className="mt-1 text-xs text-black/58">
          Select a type card to load a full matchup profile in Screen B.
        </p>
        {indexQuery.isLoading ? (
          <div className="pokemon-scrollbar mt-3 h-[58vh] min-h-[360px] max-h-[86vh] sm:h-[64vh] sm:min-h-[520px] sm:max-h-[88vh] lg:h-[72vh] lg:min-h-[760px] lg:max-h-[900px] overflow-y-scroll pr-1">
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={`type-skeleton-${index}`} className="h-14 animate-pulse rounded-lg bg-black/10" />
              ))}
            </div>
          </div>
        ) : null}

        {!indexQuery.isLoading && filteredTypes.length === 0 ? (
          <div className="pokemon-scrollbar mt-3 h-[58vh] min-h-[360px] max-h-[86vh] sm:h-[64vh] sm:min-h-[520px] sm:max-h-[88vh] lg:h-[72vh] lg:min-h-[760px] lg:max-h-[900px] overflow-y-scroll pr-1">
            <ExplorerEmptyState message="No types found with this filter." />
          </div>
        ) : null}

        {filteredTypes.length > 0 ? (
          <VirtualizedGrid
            items={filteredTypes}
            itemKey={(type) => type.id}
            minColumnWidth={isMobileViewport ? 132 : 170}
            itemHeight={88}
            gap={8}
            overscanRows={3}
            className="types-mobile-catalog-grid pokemon-scrollbar mt-3 h-[58vh] min-h-[360px] max-h-[86vh] sm:h-[64vh] sm:min-h-[520px] sm:max-h-[88vh] lg:h-[72vh] lg:min-h-[760px] lg:max-h-[900px] overflow-y-scroll pr-1 pt-1"
            renderItem={(type) => {
              const isSelected = type.id === selectedTypeId;
              const typeAccent = TYPE_ACCENT_MAP[normalize(type.name)] ?? "#6b7280";
              const selectedStyle: CSSProperties | undefined = isSelected
                ? {
                  borderColor: typeAccent,
                  boxShadow: `0 0 0 1px ${typeAccent}, 0 12px 20px ${hexToRgba(typeAccent, 0.24)}`
                }
                : undefined;

              return (
                <button
                  type="button"
                  onClick={() => handleSelectType(type.id)}
                  style={selectedStyle}
                  className={cn(
                    "types-mobile-catalog-item group relative h-full w-full overflow-hidden rounded-xl border px-3 py-2 text-left transition",
                    isSelected
                      ? "bg-[linear-gradient(155deg,rgba(255,255,255,0.9),rgba(233,243,238,0.76))] text-black/86"
                      : "border-black/20 bg-[linear-gradient(155deg,rgba(255,255,255,0.84),rgba(236,241,248,0.74))] text-black/75 hover:bg-white"
                  )}
                >
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.86),transparent)]" />
                  <div className="flex items-center justify-between gap-2">
                    <p className="pixel-font text-[9px] uppercase tracking-[0.13em]">
                      #{type.id.toString().padStart(3, "0")}
                    </p>
                    <span className="rounded-md border border-black/15 bg-white/74 px-1.5 py-0.5 text-[10px] text-black/58">
                      Type
                    </span>
                  </div>
                  <div className="mt-2">
                    <TypeBadge
                      type={type.displayName}
                      className="h-7 min-w-[96px] px-2.5 text-[8px] transition group-hover:brightness-110"
                    />
                  </div>
                </button>
              );
            }}
          />
        ) : null}
      </section>
    </section>
  );

  const rightPanel = (
    <section className="types-mobile-right space-y-4">
      <div
        ref={detailRef}
        className="types-mobile-detail-shell rounded-2xl border border-black/20 bg-[linear-gradient(165deg,rgba(255,255,255,0.64),rgba(227,237,248,0.58))] p-4 min-h-[420px] sm:min-h-[560px] lg:min-h-[760px] shadow-[inset_0_1px_0_rgba(255,255,255,0.76),0_10px_18px_rgba(0,0,0,0.07)]"
      >
        <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
          Type Details
        </p>

        {detailQuery.isLoading ? (
          <div className="mt-3 space-y-3">
            <div className="h-6 w-2/3 animate-pulse rounded bg-black/10" />
            <div className="h-24 animate-pulse rounded-xl bg-black/10" />
            <div className="h-28 animate-pulse rounded-xl bg-black/10" />
            <div className="h-24 animate-pulse rounded-xl bg-black/10" />
          </div>
        ) : null}

        {!detailQuery.isLoading && !selectedType ? (
          <p className="mt-3 rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-4 text-sm text-black/65">
            Select a type to open matchup data.
          </p>
        ) : null}

        {selectedType ? (
          <div className="types-mobile-detail-stack mt-3 space-y-4">
            <div
              className="types-mobile-detail-hero rounded-2xl border bg-[radial-gradient(circle_at_10%_12%,rgba(255,255,255,0.42),transparent_44%),linear-gradient(145deg,rgba(248,251,248,0.9),rgba(232,239,233,0.82))] p-4"
              style={
                {
                  borderColor: activeAccentBorder,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.78), 0 12px 22px ${activeAccentSoft}`
                } as CSSProperties
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/60">
                    Type #{selectedType.id.toString().padStart(3, "0")}
                  </p>
                  <h1 className="pixel-font mt-1 text-[14px] uppercase tracking-wide text-black/85">
                    {selectedType.displayName}
                  </h1>
                  <p className="mt-1 text-sm text-black/65">
                    {selectedType.generation ?? "Unknown generation"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <TypeBadge type={selectedType.displayName} className="h-7 min-w-[100px] text-[9px]" />
                  <FavoriteStarButton
                    favorite={{
                      entityType: "type",
                      entityId: selectedType.name,
                      title: `${selectedType.displayName} Type`,
                      href: "/types",
                      subtitle: selectedType.generation ?? "Type entry",
                      tags: ["type", selectedType.name]
                    }}
                  />
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <IntelChip label="Pokemon mapped" value={String(selectedType.pokemonCount)} />
                <IntelChip label="Moves mapped" value={String(selectedType.moveCount)} />
                <IntelChip
                  label="Immunity count"
                  value={String(selectedType.noDamageTo.length + selectedType.noDamageFrom.length)}
                />
              </div>
            </div>

            {battleIntel ? (
              <ExplorerDetailSection
                title="Battle Profile"
                subtitle="Composite tactical signals built from offensive and defensive relations."
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <StatMeter label="Offense Pressure" value={battleIntel.offensePressure} tone="green" />
                  <StatMeter label="Defense Stability" value={battleIntel.defenseStability} tone="sky" />
                  <StatMeter label="Risk Load" value={battleIntel.riskLoad} tone="rose" />
                  <StatMeter label="Ecosystem Reach" value={battleIntel.ecosystemReach} tone="amber" />
                </div>
              </ExplorerDetailSection>
            ) : null}

            <ExplorerDetailSection title="Offensive Matchups" subtitle="How this type performs when attacking.">
              <div className="grid gap-2">
                <RelationGroup
                  title="Super effective vs"
                  values={selectedType.doubleDamageTo}
                  tone="safe"
                />
                <RelationGroup
                  title="Not very effective vs"
                  values={selectedType.halfDamageTo}
                  tone="danger"
                />
                <RelationGroup
                  title="No effect vs"
                  values={selectedType.noDamageTo}
                  tone="neutral"
                />
              </div>
            </ExplorerDetailSection>

            <ExplorerDetailSection title="Defensive Matchups" subtitle="How this type receives incoming damage.">
              <div className="grid gap-2">
                <RelationGroup
                  title="Weak to"
                  values={selectedType.doubleDamageFrom}
                  tone="danger"
                />
                <RelationGroup
                  title="Resists"
                  values={selectedType.halfDamageFrom}
                  tone="safe"
                />
                <RelationGroup
                  title="Immune to"
                  values={selectedType.noDamageFrom}
                  tone="neutral"
                />
              </div>
            </ExplorerDetailSection>

            <ExplorerDetailSection
              title="Type Ecosystem"
              subtitle={`${selectedType.pokemonCount} Pokemon and ${selectedType.moveCount} moves mapped.`}
            >
              <div className="grid gap-3 xl:grid-cols-2">
                <EncyclopediaDataTable
                  className="border-black/22 bg-[linear-gradient(150deg,rgba(255,255,255,0.88),rgba(232,242,249,0.76))] shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]"
                  rows={selectedType.samplePokemon}
                  rowKey={(entry, index) => `${entry.name}-${entry.slot}-${index}`}
                  columns={[
                    {
                      key: "pokemon",
                      header: "Sample Pokemon",
                      render: (entry) => entry.name
                    },
                    {
                      key: "slot",
                      header: "Slot",
                      render: (entry) => entry.slot
                    }
                  ]}
                />
                <EncyclopediaDataTable
                  className="border-black/22 bg-[linear-gradient(150deg,rgba(255,255,255,0.88),rgba(232,242,249,0.76))] shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]"
                  rows={selectedType.sampleMoves}
                  rowKey={(moveName, index) => `${moveName}-${index}`}
                  columns={[
                    {
                      key: "moves",
                      header: "Sample Moves",
                      render: (moveName) => moveName
                    }
                  ]}
                />
              </div>
            </ExplorerDetailSection>
          </div>
        ) : null}
      </div>
    </section>
  );

  return (
    <div className="encyclopedia-mobile-page">
      <PokedexFrame
        title="Pokemon Types Encyclopedia"
        status={frameStatus}
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        className="encyclopedia-mobile-frame types-mobile-frame"
      />
      <MobileDexBottomNav
        activeKey="explore"
        onExplore={handleMobileExplore}
        onSettings={handleMobileSettings}
        className="encyclopedia-mobile-bottom-nav"
      />
    </div>
  );
}
