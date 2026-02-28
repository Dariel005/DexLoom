"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useDeferredValue, useEffect, useMemo, useState, type DragEvent } from "react";
import { buildTeamTypeRows, normalizeName } from "@/lib/pokedex-pro-tools";
import { pokemonDetailQueryOptions, pokemonItemIndexQueryOptions } from "@/lib/pokemon-query-options";
import {
  TEAM_BUILDER_BANK_LIMIT,
  TEAM_BUILDER_MAX_EV_TOTAL,
  TEAM_BUILDER_NATURES,
  TEAM_BUILDER_STAT_KEYS,
  TEAM_BUILDER_STAT_LABELS,
  TEAM_BUILDER_TYPE_COLORS,
  buildDefaultDraftName,
  buildSavedTeamId,
  buildTeamBuilderArtworkUrl,
  buildTeamBuilderSpriteUrl,
  buildTeamBuilderTypeOptions,
  calculateBattleStats,
  clampEvForTeamBuilder,
  cloneTeamBuilderSlot,
  createEmptyPersistedTeamBuilderState,
  createEmptyTeamBuilderSlots,
  createTeamBuilderSlot,
  getFirstEmptySlotIndex,
  hasMeaningfulTeamBuilderState,
  getTeamBuilderNature,
  getTotalEvs,
  hydrateTeamBuilderSlot,
  loadTeamBuilderState,
  resolveTeamBuilderSlots,
  saveTeamBuilderState,
  type PersistedTeamBuilderState,
  type TeamBuilderSavedTeam,
  type TeamBuilderSlot,
  type TeamBuilderStatKey
} from "@/lib/team-builder";
import { cn } from "@/lib/utils";
import { type PokemonItemIndexEntry } from "@/types/item";
import { type GenerationKey, type PokemonDetail, type PokemonListEntry } from "@/types/pokemon";

const TEAM_DRAG_SLOT_KEY = "application/x-bga-team-slot";
const TEAM_DRAG_POKEMON_KEY = "application/x-bga-pokemon-id";
const ALL_GENERATIONS: Array<{ key: GenerationKey | "all"; label: string }> = [
  { key: "all", label: "ALL" },
  { key: "gen1", label: "G1" },
  { key: "gen2", label: "G2" },
  { key: "gen3", label: "G3" },
  { key: "gen4", label: "G4" },
  { key: "gen5", label: "G5" },
  { key: "gen6", label: "G6" },
  { key: "gen7", label: "G7" },
  { key: "gen8", label: "G8" },
  { key: "gen9", label: "G9" }
];

const EMPTY_MOVE_INPUTS = ["", "", "", ""];

interface TeamBuilderWorkbenchProps {
  candidatePokemon: PokemonListEntry[];
}

interface GbaAlertState {
  title: string;
  message: string;
}

function PokemonSprite({
  pokemonId,
  alt,
  className,
  large = false
}: {
  pokemonId: number;
  alt: string;
  className?: string;
  large?: boolean;
}) {
  return (
    <img
      src={buildTeamBuilderSpriteUrl(pokemonId)}
      alt={alt}
      loading="lazy"
      className={className}
      style={{ imageRendering: "pixelated" }}
      onError={(event) => {
        const target = event.currentTarget;
        if (target.dataset.fallbackApplied === "true") {
          return;
        }
        target.dataset.fallbackApplied = "true";
        target.src = buildTeamBuilderArtworkUrl(pokemonId);
        if (large) {
          target.style.imageRendering = "auto";
        }
      }}
    />
  );
}

function TypeChip({ type }: { type: string }) {
  const normalizedType = normalizeName(type);
  const accent = TEAM_BUILDER_TYPE_COLORS[normalizedType] ?? "#5f7c5f";

  return (
    <span
      className="team-builder-gba__type-chip pixel-font"
      style={{ ["--type-accent" as string]: accent }}
    >
      {type}
    </span>
  );
}

function StatRadar({
  stats
}: {
  stats: Record<TeamBuilderStatKey, number>;
}) {
  const size = 220;
  const center = size / 2;
  const radius = 76;
  const levels = [0.2, 0.4, 0.6, 0.8, 1];

  const axisPoints = TEAM_BUILDER_STAT_KEYS.map((statKey, index) => {
    const angle = ((Math.PI * 2) / TEAM_BUILDER_STAT_KEYS.length) * index - Math.PI / 2;
    return {
      statKey,
      angle,
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius
    };
  });

  const polygonPoints = axisPoints
    .map((point) => {
      const value = Math.min(255, Math.max(0, stats[point.statKey]));
      const scaledRadius = (value / 255) * radius;
      return `${center + Math.cos(point.angle) * scaledRadius},${
        center + Math.sin(point.angle) * scaledRadius
      }`;
    })
    .join(" ");

  return (
    <svg
      className="team-builder-gba__radar"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Radar chart for current stats"
    >
      {levels.map((level) => {
        const ring = axisPoints
          .map(
            (point) =>
              `${center + Math.cos(point.angle) * radius * level},${
                center + Math.sin(point.angle) * radius * level
              }`
          )
          .join(" ");

        return (
          <polygon
            key={`ring-${level}`}
            points={ring}
            className="team-builder-gba__radar-ring"
          />
        );
      })}

      {axisPoints.map((point) => (
        <line
          key={`axis-${point.statKey}`}
          x1={center}
          y1={center}
          x2={point.x}
          y2={point.y}
          className="team-builder-gba__radar-axis"
        />
      ))}

      <polygon points={polygonPoints} className="team-builder-gba__radar-shape" />

      {axisPoints.map((point) => (
        <text
          key={`label-${point.statKey}`}
          x={center + Math.cos(point.angle) * (radius + 24)}
          y={center + Math.sin(point.angle) * (radius + 24)}
          className="team-builder-gba__radar-label"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {TEAM_BUILDER_STAT_LABELS[point.statKey]}
        </text>
      ))}
    </svg>
  );
}

function SavedTeamCard({
  team,
  isActive,
  onLoad,
  onDelete
}: {
  team: TeamBuilderSavedTeam;
  isActive: boolean;
  onLoad: (team: TeamBuilderSavedTeam) => void;
  onDelete: (teamId: string) => void;
}) {
  const occupiedCount = team.slots.filter(Boolean).length;

  return (
    <article className={cn("team-builder-gba__save-card", isActive && "is-active")}>
      <div>
        <p className="pixel-font team-builder-gba__save-title">{team.name}</p>
        <p className="team-builder-gba__save-meta">
          {occupiedCount}/6 party slots / {new Date(team.updatedAt).toLocaleDateString()}
        </p>
      </div>
      <div className="team-builder-gba__save-actions">
        <button type="button" className="team-builder-gba__mini-btn" onClick={() => onLoad(team)}>
          Load
        </button>
        <button
          type="button"
          className="team-builder-gba__mini-btn is-danger"
          onClick={() => onDelete(team.id)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function TeamSlotCard({
  index,
  slot,
  detail,
  isSelected,
  onClick,
  onRemove,
  onDropPokemon,
  onSwap,
  onDragStateChange
}: {
  index: number;
  slot: TeamBuilderSlot | null;
  detail: PokemonDetail | null;
  isSelected: boolean;
  onClick: () => void;
  onRemove: () => void;
  onDropPokemon: (pokemonId: number, slotIndex: number) => void;
  onSwap: (fromIndex: number, toIndex: number) => void;
  onDragStateChange: (slotIndex: number | null) => void;
}) {
  const resolvedSlot = slot && detail ? hydrateTeamBuilderSlot(slot, detail) : slot;
  const occupancyLabel = `Slot ${index + 1}`;

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onDragStateChange(null);

    const slotIndex = Number(event.dataTransfer.getData(TEAM_DRAG_SLOT_KEY));
    if (Number.isFinite(slotIndex) && slotIndex >= 0) {
      if (slotIndex !== index) {
        onSwap(slotIndex, index);
      }
      return;
    }

    const pokemonId = Number(event.dataTransfer.getData(TEAM_DRAG_POKEMON_KEY));
    if (Number.isFinite(pokemonId) && pokemonId > 0) {
      onDropPokemon(pokemonId, index);
    }
  };

  return (
    <button
      type="button"
      className={cn(
        "team-builder-gba__team-slot",
        resolvedSlot && "is-filled",
        isSelected && "is-selected"
      )}
      onClick={onClick}
      onDragOver={(event) => {
        event.preventDefault();
        onDragStateChange(index);
      }}
      onDragLeave={() => onDragStateChange(null)}
      onDrop={handleDrop}
      draggable={Boolean(resolvedSlot)}
      onDragStart={(event) => {
        if (!resolvedSlot) {
          return;
        }
        event.dataTransfer.setData(TEAM_DRAG_SLOT_KEY, String(index));
        event.dataTransfer.effectAllowed = "move";
      }}
      aria-label={
        resolvedSlot ? `Edit ${detail?.name ?? occupancyLabel}` : `Empty team slot ${index + 1}`
      }
    >
      <span className="team-builder-gba__team-slot-shell" aria-hidden />
      {resolvedSlot && detail ? (
        <>
          <div className="team-builder-gba__team-card">
            <div className="team-builder-gba__team-sprite-wrap">
              <PokemonSprite
                pokemonId={resolvedSlot.pokemonId}
                alt={`${detail.name} sprite`}
                className="team-builder-gba__team-sprite"
              />
            </div>
            <div className="team-builder-gba__team-copy">
              <p className="pixel-font team-builder-gba__team-name">{detail.name}</p>
              <div className="team-builder-gba__type-row">
                {detail.types.map((type) => (
                  <TypeChip key={`${detail.id}-${type}`} type={type} />
                ))}
              </div>
              <p className="team-builder-gba__team-summary">
                {resolvedSlot.abilityName || "Choose ability"} / {resolvedSlot.teraType || "Tera"}
              </p>
            </div>
          </div>
          <span
            className="team-builder-gba__remove-slot"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onRemove();
              }
            }}
            aria-label={`Remove ${detail.name} from slot ${index + 1}`}
          >
            x
          </span>
        </>
      ) : (
        <span className="team-builder-gba__team-empty">
          <span className="pixel-font">POKE BALL SLOT {index + 1}</span>
          <span>Drop a Pokemon here</span>
        </span>
      )}
    </button>
  );
}

function buildPersistedState(input: {
  draftName: string;
  activeTeamId: string | null;
  teamSlots: Array<TeamBuilderSlot | null>;
  savedTeams: TeamBuilderSavedTeam[];
}): PersistedTeamBuilderState {
  return {
    version: 1,
    draftName: input.draftName,
    activeTeamId: input.activeTeamId,
    draftSlots: input.teamSlots.map((slot) => (slot ? cloneTeamBuilderSlot(slot) : null)),
    savedTeams: input.savedTeams.map((team) => ({
      ...team,
      slots: team.slots.map((slot) => (slot ? cloneTeamBuilderSlot(slot) : null))
    }))
  };
}

export function TeamBuilderWorkbench({ candidatePokemon }: TeamBuilderWorkbenchProps) {
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id ?? null;
  const [draftName, setDraftName] = useState("BOX 01");
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [teamSlots, setTeamSlots] = useState<Array<TeamBuilderSlot | null>>(
    createEmptyTeamBuilderSlots
  );
  const [savedTeams, setSavedTeams] = useState<TeamBuilderSavedTeam[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [generationFilter, setGenerationFilter] = useState<GenerationKey | "all">("all");
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [moveInputs, setMoveInputs] = useState<string[]>(EMPTY_MOVE_INPUTS);
  const [dragHoverIndex, setDragHoverIndex] = useState<number | null>(null);
  const [alertState, setAlertState] = useState<GbaAlertState | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [hasLoadedRemoteState, setHasLoadedRemoteState] = useState(false);
  const [isRemoteSyncing, setIsRemoteSyncing] = useState(false);
  const [remoteSyncError, setRemoteSyncError] = useState<string | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const applyPersistedState = (state: PersistedTeamBuilderState) => {
    setDraftName(state.draftName);
    setActiveTeamId(state.activeTeamId);
    setTeamSlots(state.draftSlots);
    setSavedTeams(state.savedTeams);
    const firstFilledSlot = state.draftSlots.findIndex((slot) => slot !== null);
    setSelectedSlotIndex(firstFilledSlot === -1 ? null : firstFilledSlot);
  };

  useEffect(() => {
    const persistedState = loadTeamBuilderState();
    applyPersistedState(persistedState);
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const nextState = buildPersistedState({
      draftName,
      activeTeamId,
      teamSlots,
      savedTeams
    });

    saveTeamBuilderState(nextState);
  }, [activeTeamId, draftName, hasHydrated, savedTeams, teamSlots]);

  useEffect(() => {
    if (!hasHydrated || sessionStatus === "loading") {
      return;
    }

    if (!userId) {
      setHasLoadedRemoteState(false);
      setRemoteSyncError(null);
      return;
    }

    let cancelled = false;

    const loadRemoteState = async () => {
      try {
        const response = await fetch("/api/team-builder", {
          method: "GET",
          cache: "no-store"
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(payload.message ?? "Unable to load synced teams.");
        }

        const payload = (await response.json()) as { state?: PersistedTeamBuilderState };
        if (cancelled) {
          return;
        }

        const remoteState = payload.state ?? createEmptyPersistedTeamBuilderState();
        if (hasMeaningfulTeamBuilderState(remoteState)) {
          applyPersistedState(remoteState);
        } else {
          const localState = buildPersistedState({
            draftName,
            activeTeamId,
            teamSlots,
            savedTeams
          });

          if (hasMeaningfulTeamBuilderState(localState)) {
            const backfillResponse = await fetch("/api/team-builder", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ state: localState })
            });

            if (!backfillResponse.ok) {
              const payload = (await backfillResponse.json().catch(() => ({}))) as {
                message?: string;
              };
              throw new Error(payload.message ?? "Unable to sync teams.");
            }
          }
        }

        setRemoteSyncError(null);
        setHasLoadedRemoteState(true);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setRemoteSyncError(
          error instanceof Error ? error.message : "Unable to load synced teams."
        );
        setHasLoadedRemoteState(true);
      }
    };

    void loadRemoteState();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, sessionStatus, userId]);

  useEffect(() => {
    if (!hasHydrated || !hasLoadedRemoteState || !userId) {
      return;
    }

    const nextState = buildPersistedState({
      draftName,
      activeTeamId,
      teamSlots,
      savedTeams
    });

    const timeout = window.setTimeout(async () => {
      try {
        setIsRemoteSyncing(true);
        const response = await fetch("/api/team-builder", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ state: nextState })
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(payload.message ?? "Unable to sync teams.");
        }

        setRemoteSyncError(null);
      } catch (error) {
        setRemoteSyncError(error instanceof Error ? error.message : "Unable to sync teams.");
      } finally {
        setIsRemoteSyncing(false);
      }
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [
    activeTeamId,
    draftName,
    hasHydrated,
    hasLoadedRemoteState,
    savedTeams,
    teamSlots,
    userId
  ]);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setStatusMessage("");
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  const occupiedSlots = useMemo(
    () =>
      teamSlots.flatMap((slot, index) =>
        slot
          ? [
              {
                index,
                slot
              }
            ]
          : []
      ),
    [teamSlots]
  );

  const detailQueries = useQueries({
    queries: occupiedSlots.map(({ slot }) => ({
      ...pokemonDetailQueryOptions(slot.pokemonId),
      enabled: true
    }))
  });

  const detailsBySlotIndex = useMemo(() => {
    const map = new Map<number, PokemonDetail>();
    occupiedSlots.forEach((entry, index) => {
      const detail = detailQueries[index]?.data;
      if (detail) {
        map.set(entry.index, detail);
      }
    });
    return map;
  }, [detailQueries, occupiedSlots]);

  const detailsByPokemonId = useMemo(() => {
    const map = new Map<number, PokemonDetail>();
    detailQueries.forEach((query) => {
      if (query.data && !map.has(query.data.id)) {
        map.set(query.data.id, query.data);
      }
    });
    return map;
  }, [detailQueries]);

  const resolvedSlots = useMemo(
    () => resolveTeamBuilderSlots(teamSlots, detailsByPokemonId),
    [detailsByPokemonId, teamSlots]
  );

  const teamDetails = useMemo(
    () =>
      occupiedSlots.flatMap((entry, index) =>
        detailQueries[index]?.data ? [detailQueries[index].data] : []
      ),
    [detailQueries, occupiedSlots]
  );

  const selectedSlot = selectedSlotIndex === null ? null : resolvedSlots[selectedSlotIndex];
  const selectedDetail =
    selectedSlot && detailsByPokemonId.has(selectedSlot.pokemonId)
      ? detailsByPokemonId.get(selectedSlot.pokemonId) ?? null
      : null;
  const selectedMoveSignature = selectedSlot?.moves.join("|") ?? "";

  useEffect(() => {
    setMoveInputs(selectedSlot ? selectedSlot.moves.slice(0, 4) : EMPTY_MOVE_INPUTS);
  }, [selectedMoveSignature, selectedSlot?.pokemonId]);

  const itemIndexQuery = useQuery({
    ...pokemonItemIndexQueryOptions(),
    enabled: selectedSlotIndex !== null
  });

  const groupedItems = useMemo(() => {
    const groups = new Map<string, PokemonItemIndexEntry[]>();
    (itemIndexQuery.data ?? []).forEach((item) => {
      const pocket = item.pocket || "Misc";
      const bucket = groups.get(pocket) ?? [];
      bucket.push(item);
      groups.set(pocket, bucket);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [itemIndexQuery.data]);

  const filteredCandidates = useMemo(() => {
    const normalizedQuery = normalizeName(deferredSearchQuery);
    return candidatePokemon
      .filter((entry) => generationFilter === "all" || entry.generationKey === generationFilter)
      .filter((entry) => {
        if (!normalizedQuery) {
          return true;
        }
        return (
          normalizeName(entry.displayName).includes(normalizedQuery) ||
          String(entry.id).includes(normalizedQuery) ||
          normalizeName(entry.name).includes(normalizedQuery)
        );
      })
      .slice(0, 48);
  }, [candidatePokemon, deferredSearchQuery, generationFilter]);

  const occupiedCount = resolvedSlots.filter(Boolean).length;
  const teamTypeRows = useMemo(() => buildTeamTypeRows(teamDetails), [teamDetails]);

  const dangerRows = useMemo(
    () =>
      teamTypeRows
        .filter((row) => row.weak > row.resist + row.immune)
        .sort((a, b) => b.weak - a.weak || a.type.localeCompare(b.type))
        .slice(0, 6),
    [teamTypeRows]
  );

  const wallRows = useMemo(
    () =>
      teamTypeRows
        .filter((row) => row.resist + row.immune >= 2)
        .sort((a, b) => b.resist + b.immune - (a.resist + a.immune))
        .slice(0, 6),
    [teamTypeRows]
  );

  const selectedNature = selectedSlot ? getTeamBuilderNature(selectedSlot.nature) : null;
  const selectedStats = useMemo(
    () =>
      selectedSlot && selectedDetail
        ? calculateBattleStats(selectedDetail, selectedSlot)
        : null,
    [selectedDetail, selectedSlot]
  );
  const selectedEvTotal = selectedSlot ? getTotalEvs(selectedSlot.evs) : 0;
  const syncLabel = !hasHydrated
    ? "BOOTING"
    : !userId
      ? "LOCAL CACHE"
      : isRemoteSyncing
        ? "SYNCING CLOUD"
        : remoteSyncError
          ? "CLOUD ERROR"
          : hasLoadedRemoteState
            ? "CLOUD READY"
            : "LINKING CLOUD";

  const selectedMoveOptions = useMemo(() => {
    if (!selectedDetail) {
      return EMPTY_MOVE_INPUTS.map(() => []);
    }

    return moveInputs.map((value, index) => {
      const normalizedValue = normalizeName(value);
      const currentMove = selectedSlot?.moves[index] ?? "";
      return selectedDetail.moves
        .filter((move) => {
          if (!normalizedValue) {
            return true;
          }
          return normalizeName(move.name).includes(normalizedValue);
        })
        .filter(
          (move) =>
            move.name === currentMove ||
            !selectedSlot?.moves.some(
              (entry, moveIndex) => moveIndex !== index && entry === move.name
            )
        )
        .slice(0, 12);
    });
  }, [moveInputs, selectedDetail, selectedSlot?.moves]);

  const typeOptions = useMemo(() => buildTeamBuilderTypeOptions(), []);

  const applySlotUpdate = (
    slotIndex: number,
    updater: (slot: TeamBuilderSlot) => TeamBuilderSlot
  ) => {
    setTeamSlots((current) =>
      current.map((slot, currentIndex) => {
        if (currentIndex !== slotIndex || !slot) {
          return slot;
        }
        return updater(slot);
      })
    );
  };

  const placePokemonInSlot = (pokemonId: number, slotIndex: number) => {
    setTeamSlots((current) =>
      current.map((slot, currentIndex) =>
        currentIndex === slotIndex ? createTeamBuilderSlot(pokemonId) : slot
      )
    );
    setSelectedSlotIndex(slotIndex);
    const entry = candidatePokemon.find((pokemon) => pokemon.id === pokemonId);
    setStatusMessage(`${entry?.displayName ?? `#${pokemonId}`} entered your party.`);
  };

  const addPokemonToFirstOpenSlot = (pokemonId: number) => {
    const firstEmptySlot = getFirstEmptySlotIndex(teamSlots);
    if (firstEmptySlot === -1) {
      setAlertState({
        title: "Party Full",
        message:
          "Your active party already has six Pokemon. Replace a member or clear a slot first."
      });
      return;
    }
    placePokemonInSlot(pokemonId, firstEmptySlot);
  };

  const swapTeamSlots = (fromIndex: number, toIndex: number) => {
    setTeamSlots((current) => {
      const next = current.slice();
      const temp = next[fromIndex];
      next[fromIndex] = next[toIndex];
      next[toIndex] = temp;
      return next;
    });

    setSelectedSlotIndex((current) => {
      if (current === fromIndex) {
        return toIndex;
      }
      if (current === toIndex) {
        return fromIndex;
      }
      return current;
    });
  };

  const removeTeamSlot = (slotIndex: number) => {
    setTeamSlots((current) =>
      current.map((slot, currentIndex) => (currentIndex === slotIndex ? null : slot))
    );
    setSelectedSlotIndex((current) => (current === slotIndex ? null : current));
    setStatusMessage(`Slot ${slotIndex + 1} cleared.`);
  };

  const handleNewDraft = () => {
    setTeamSlots(createEmptyTeamBuilderSlots());
    setSelectedSlotIndex(null);
    setActiveTeamId(null);
    setDraftName(buildDefaultDraftName(savedTeams.length));
    setStatusMessage("Opened a fresh Bill's PC draft.");
  };

  const handleSaveDraft = () => {
    const safeName = draftName.trim() || buildDefaultDraftName(savedTeams.length);
    if (occupiedCount === 0) {
      setAlertState({
        title: "No Team Data",
        message:
          "You need at least one Pokemon in the party before storing a team in Bill's PC."
      });
      return;
    }

    const normalizedSlots = resolvedSlots.map((slot) =>
      slot ? cloneTeamBuilderSlot(slot) : null
    );
    const existingTeam = activeTeamId
      ? savedTeams.find((team) => team.id === activeTeamId) ?? null
      : null;

    if (!existingTeam && savedTeams.length >= TEAM_BUILDER_BANK_LIMIT) {
      setAlertState({
        title: "PC Boxes Full",
        message: "The boxes in your PC are full. Delete a team before saving a new one."
      });
      return;
    }

    if (existingTeam) {
      setSavedTeams((current) =>
        current
          .map((team) =>
            team.id === existingTeam.id
              ? {
                  ...team,
                  name: safeName,
                  updatedAt: new Date().toISOString(),
                  slots: normalizedSlots
                }
              : team
          )
          .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      );
      setStatusMessage(`${safeName} updated in Bill's PC.`);
      setDraftName(safeName);
      return;
    }

    const newTeamId = buildSavedTeamId();
    const newTeam: TeamBuilderSavedTeam = {
      id: newTeamId,
      name: safeName,
      updatedAt: new Date().toISOString(),
      slots: normalizedSlots
    };

    setSavedTeams((current) =>
      [newTeam, ...current].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    );
    setActiveTeamId(newTeamId);
    setDraftName(safeName);
    setStatusMessage(`${safeName} stored in Bill's PC.`);
  };

  const handleLoadSavedTeam = (team: TeamBuilderSavedTeam) => {
    setTeamSlots(team.slots.map((slot) => (slot ? cloneTeamBuilderSlot(slot) : null)));
    setDraftName(team.name);
    setActiveTeamId(team.id);
    const firstFilledSlot = team.slots.findIndex((slot) => slot !== null);
    setSelectedSlotIndex(firstFilledSlot === -1 ? null : firstFilledSlot);
    setStatusMessage(`${team.name} loaded from Bill's PC.`);
  };

  const handleDeleteSavedTeam = (teamId: string) => {
    setSavedTeams((current) => current.filter((team) => team.id !== teamId));
    if (activeTeamId === teamId) {
      setActiveTeamId(null);
    }
    setStatusMessage("Saved team deleted from Bill's PC.");
  };

  return (
    <section className="team-builder-gba" aria-label="BGA Team Builder">
      <header className="team-builder-gba__topbar">
        <div className="team-builder-gba__brand">
          <span className="team-builder-gba__light is-green" aria-hidden />
          <span className="team-builder-gba__light" aria-hidden />
          <span className="team-builder-gba__light" aria-hidden />
          <div>
            <p className="pixel-font team-builder-gba__brand-title">BGA TEAM BUILDER</p>
            <p className="team-builder-gba__brand-copy">
              Bill&apos;s PC protocol / live draft console
            </p>
          </div>
        </div>

        <div className="team-builder-gba__actions">
          <label className="team-builder-gba__draft-field">
            <span className="pixel-font">PC BOX NAME</span>
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              maxLength={28}
              placeholder="BOX 01"
            />
          </label>

          <button
            type="button"
            className="team-builder-gba__action-btn"
            onClick={handleNewDraft}
          >
            New Draft
          </button>
          <button
            type="button"
            className="team-builder-gba__action-btn is-save"
            onClick={handleSaveDraft}
          >
            Save To PC
          </button>
        </div>
      </header>

      <div className="team-builder-gba__hud">
        <p className="pixel-font">TEAM STATUS // {occupiedCount}/6 ACTIVE</p>
        <p className="pixel-font">PC BOXES // {savedTeams.length}/{TEAM_BUILDER_BANK_LIMIT}</p>
        <p className="pixel-font">SYNC // {syncLabel}</p>
      </div>

      {statusMessage ? <p className="team-builder-gba__status-line">{statusMessage}</p> : null}
      {remoteSyncError ? (
        <p className="team-builder-gba__status-line is-error">
          Cloud sync warning: {remoteSyncError}
        </p>
      ) : null}

      <div className="team-builder-gba__main-grid">
        <section className="team-builder-gba__panel">
          <header className="team-builder-gba__panel-head">
            <p className="pixel-font">EXPLORER CONSOLE A</p>
            <span className="team-builder-gba__panel-pill">{filteredCandidates.length}</span>
          </header>

          <div className="team-builder-gba__panel-body">
            <label className="team-builder-gba__search">
              <span className="pixel-font">Search Pokemon Database</span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name or National Dex number..."
              />
            </label>

            <div className="team-builder-gba__generation-row">
              {ALL_GENERATIONS.map((generation) => (
                <button
                  key={generation.key}
                  type="button"
                  className={cn(
                    "team-builder-gba__tab",
                    generationFilter === generation.key && "is-active"
                  )}
                  onClick={() => setGenerationFilter(generation.key)}
                >
                  {generation.label}
                </button>
              ))}
            </div>

            <section className="team-builder-gba__pc-bank">
              <div className="team-builder-gba__bank-head">
                <div>
                  <p className="pixel-font">BILL&apos;S PC BOXES</p>
                  <p className="team-builder-gba__bank-copy">
                    Save up to ten teams and reload them without leaving the page.
                  </p>
                </div>
                <span className="team-builder-gba__panel-pill">
                  {savedTeams.length}/{TEAM_BUILDER_BANK_LIMIT}
                </span>
              </div>

              <div className="team-builder-gba__save-grid">
                {savedTeams.length > 0 ? (
                  savedTeams.map((team) => (
                    <SavedTeamCard
                      key={team.id}
                      team={team}
                      isActive={team.id === activeTeamId}
                      onLoad={handleLoadSavedTeam}
                      onDelete={handleDeleteSavedTeam}
                    />
                  ))
                ) : (
                  <div className="team-builder-gba__empty-copy">
                    <p className="pixel-font">NO BOX DATA</p>
                    <p>Save your first party to start building a permanent team library.</p>
                  </div>
                )}
              </div>
            </section>

            <div className="team-builder-gba__pokemon-grid">
              {filteredCandidates.map((entry) => (
                <article
                  key={entry.id}
                  className="team-builder-gba__pokemon-card"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(TEAM_DRAG_POKEMON_KEY, String(entry.id));
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                >
                  <div className="team-builder-gba__pokemon-card-head">
                    <p className="pixel-font">#{entry.id.toString().padStart(4, "0")}</p>
                    <span>{entry.generationKey.toUpperCase()}</span>
                  </div>
                  <div className="team-builder-gba__pokemon-sprite-card">
                    <PokemonSprite
                      pokemonId={entry.id}
                      alt={`${entry.displayName} sprite`}
                      className="team-builder-gba__pokemon-sprite"
                    />
                  </div>
                  <div className="team-builder-gba__pokemon-card-copy">
                    <p className="pixel-font">{entry.displayName}</p>
                    <p>{entry.generation}</p>
                  </div>
                  <button
                    type="button"
                    className="team-builder-gba__mini-btn"
                    onClick={() => addPokemonToFirstOpenSlot(entry.id)}
                  >
                    Send To Party
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="team-builder-gba__panel">
          <header className="team-builder-gba__panel-head">
            <p className="pixel-font">DATA TERMINAL</p>
            <span className="team-builder-gba__panel-pill">{occupiedCount}/6</span>
          </header>

          <div className="team-builder-gba__panel-body">
            <div className="team-builder-gba__party-grid">
              {resolvedSlots.map((slot, index) => (
                <div
                  key={`team-slot-${index}`}
                  className={cn(dragHoverIndex === index && "team-builder-gba__drag-target")}
                >
                  <TeamSlotCard
                    index={index}
                    slot={slot}
                    detail={slot ? detailsBySlotIndex.get(index) ?? null : null}
                    isSelected={selectedSlotIndex === index}
                    onClick={() => setSelectedSlotIndex(index)}
                    onRemove={() => removeTeamSlot(index)}
                    onDropPokemon={placePokemonInSlot}
                    onSwap={swapTeamSlots}
                    onDragStateChange={setDragHoverIndex}
                  />
                </div>
              ))}
            </div>

            <section className="team-builder-gba__synergy">
              <div className="team-builder-gba__synergy-head">
                <div>
                  <p className="pixel-font">TEAM SYNERGY SCANNER</p>
                  <p>Global defensive readout based on your current six-slot roster.</p>
                </div>
              </div>

              <div className="team-builder-gba__synergy-summary">
                <div className="team-builder-gba__summary-card is-danger">
                  <p className="pixel-font">Pressure Points</p>
                  <p>
                    {dangerRows.length > 0
                      ? dangerRows.map((row) => `${row.type} x${row.weak}`).join(", ")
                      : "No major stacked weakness detected."}
                  </p>
                </div>
                <div className="team-builder-gba__summary-card is-safe">
                  <p className="pixel-font">Best Cover</p>
                  <p>
                    {wallRows.length > 0
                      ? wallRows
                          .map((row) => `${row.type} ${row.resist + row.immune} layers`)
                          .join(", ")
                      : "Add more members to generate layered resistances."}
                  </p>
                </div>
              </div>

              <div className="team-builder-gba__type-table">
                {teamTypeRows.map((row) => {
                  const scoreTone =
                    row.weak >= 2 && row.resist + row.immune === 0
                      ? "is-danger"
                      : row.resist + row.immune >= 2
                        ? "is-safe"
                        : "";

                  return (
                    <div key={row.type} className={cn("team-builder-gba__type-cell", scoreTone)}>
                      <div className="team-builder-gba__type-cell-top">
                        <TypeChip type={row.type} />
                        <span className="pixel-font">W {row.weak}</span>
                      </div>
                      <div className="team-builder-gba__type-cell-bottom">
                        <span>Resist {row.resist}</span>
                        <span>Immune {row.immune}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </section>
      </div>

      {selectedSlotIndex !== null && selectedSlot && selectedDetail ? (
        <div className="team-builder-gba__editor-overlay" role="dialog" aria-modal="true">
          <div
            className="team-builder-gba__editor-backdrop"
            onClick={() => setSelectedSlotIndex(null)}
          />
          <aside className="team-builder-gba__editor">
            <header className="team-builder-gba__editor-head">
              <div>
                <p className="pixel-font">TRAINER DATA CARD</p>
                <p>Edit held item, nature, moves, EVs, IVs and Tera assignment.</p>
              </div>
              <button
                type="button"
                className="team-builder-gba__mini-btn"
                onClick={() => setSelectedSlotIndex(null)}
              >
                Close
              </button>
            </header>

            <div className="team-builder-gba__editor-scroll">
              <section className="team-builder-gba__editor-hero">
                <div className="team-builder-gba__editor-sprite-shell">
                  <PokemonSprite
                    pokemonId={selectedSlot.pokemonId}
                    alt={`${selectedDetail.name} sprite`}
                    className="team-builder-gba__editor-sprite"
                    large
                  />
                </div>

                <div className="team-builder-gba__editor-copy">
                  <p className="pixel-font team-builder-gba__editor-name">{selectedDetail.name}</p>
                  <div className="team-builder-gba__type-row">
                    {selectedDetail.types.map((type) => (
                      <TypeChip key={`${selectedDetail.id}-editor-${type}`} type={type} />
                    ))}
                  </div>
                  <p className="team-builder-gba__editor-flavor">{selectedDetail.description}</p>
                </div>
              </section>

              <section className="team-builder-gba__editor-grid">
                <label className="team-builder-gba__field">
                  <span className="pixel-font">Held Item</span>
                  <select
                    value={selectedSlot.itemName}
                    onChange={(event) =>
                      applySlotUpdate(selectedSlotIndex, (slot) => ({
                        ...slot,
                        itemName: event.target.value
                      }))
                    }
                  >
                    <option value="">No held item</option>
                    {groupedItems.map(([pocket, items]) => (
                      <optgroup key={pocket} label={pocket}>
                        {items.map((item) => (
                          <option key={item.id} value={item.displayName}>
                            {item.displayName}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>

                <label className="team-builder-gba__field">
                  <span className="pixel-font">Ability</span>
                  <select
                    value={selectedSlot.abilityName}
                    onChange={(event) =>
                      applySlotUpdate(selectedSlotIndex, (slot) => ({
                        ...slot,
                        abilityName: event.target.value
                      }))
                    }
                  >
                    {selectedDetail.abilities.map((ability) => (
                      <option key={ability.name} value={ability.name}>
                        {ability.name}
                        {ability.isHidden ? " (Hidden)" : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="team-builder-gba__field">
                  <span className="pixel-font">Tera Type</span>
                  <select
                    value={selectedSlot.teraType}
                    onChange={(event) =>
                      applySlotUpdate(selectedSlotIndex, (slot) => ({
                        ...slot,
                        teraType: event.target.value
                      }))
                    }
                  >
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="team-builder-gba__field">
                  <span className="pixel-font">Nature</span>
                  <select
                    value={selectedSlot.nature}
                    onChange={(event) =>
                      applySlotUpdate(selectedSlotIndex, (slot) => ({
                        ...slot,
                        nature: event.target.value
                      }))
                    }
                  >
                    {TEAM_BUILDER_NATURES.map((nature) => (
                      <option key={nature.key} value={nature.key}>
                        {nature.label}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              <section className="team-builder-gba__nature-panel">
                <div>
                  <p className="pixel-font">Nature Diagnostics</p>
                  <p>
                    {selectedNature?.increase && selectedNature.decrease
                      ? `${selectedNature.label} boosts ${TEAM_BUILDER_STAT_LABELS[selectedNature.increase]} and drops ${TEAM_BUILDER_STAT_LABELS[selectedNature.decrease]}.`
                      : `${selectedNature?.label ?? "Hardy"} keeps all stats neutral.`}
                  </p>
                </div>

                <div className="team-builder-gba__nature-stats">
                  {TEAM_BUILDER_STAT_KEYS.map((statKey) => {
                    const tone =
                      selectedNature?.increase === statKey
                        ? "is-up"
                        : selectedNature?.decrease === statKey
                          ? "is-down"
                          : "";

                    return (
                      <span key={statKey} className={cn("team-builder-gba__nature-chip", tone)}>
                        {TEAM_BUILDER_STAT_LABELS[statKey]}
                      </span>
                    );
                  })}
                </div>
              </section>

              <section className="team-builder-gba__moves-panel">
                <div className="team-builder-gba__section-head">
                  <p className="pixel-font">Move Slots</p>
                  <p>Search through this Pokemon&apos;s learnset and lock four battle commands.</p>
                </div>

                <div className="team-builder-gba__moves-grid">
                  {moveInputs.map((value, moveIndex) => (
                    <label key={`move-${moveIndex}`} className="team-builder-gba__move-field">
                      <span className="pixel-font">Move {moveIndex + 1}</span>
                      <input
                        list={`move-list-${selectedSlot.pokemonId}-${moveIndex}`}
                        value={value}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setMoveInputs((current) =>
                            current.map((entry, index) =>
                              index === moveIndex ? nextValue : entry
                            )
                          );
                          applySlotUpdate(selectedSlotIndex, (slot) => {
                            const nextMoves = slot.moves.slice(0, 4);
                            nextMoves[moveIndex] = nextValue;
                            while (nextMoves.length < 4) {
                              nextMoves.push("");
                            }
                            return {
                              ...slot,
                              moves: nextMoves
                            };
                          });
                        }}
                        placeholder="Search attack..."
                      />
                      <datalist id={`move-list-${selectedSlot.pokemonId}-${moveIndex}`}>
                        {selectedMoveOptions[moveIndex]?.map((move) => (
                          <option key={`${moveIndex}-${move.name}`} value={move.name} />
                        ))}
                      </datalist>
                    </label>
                  ))}
                </div>
              </section>

              <section className="team-builder-gba__stats-panel">
                <div className="team-builder-gba__section-head">
                  <p className="pixel-font">EV / IV Lab</p>
                  <p>
                    Tune your final spread and watch the radar update live. EV total:{" "}
                    <strong>{selectedEvTotal}</strong> / {TEAM_BUILDER_MAX_EV_TOTAL}
                  </p>
                </div>

                <div className="team-builder-gba__stats-grid">
                  <div className="team-builder-gba__sliders">
                    {TEAM_BUILDER_STAT_KEYS.map((statKey) => (
                      <div key={statKey} className="team-builder-gba__slider-block">
                        <div className="team-builder-gba__slider-head">
                          <span className="pixel-font">{TEAM_BUILDER_STAT_LABELS[statKey]}</span>
                          <span>
                            EV {selectedSlot.evs[statKey]} / IV {selectedSlot.ivs[statKey]}
                          </span>
                        </div>

                        <div className="team-builder-gba__slider-row">
                          <label>
                            <span>EV</span>
                            <input
                              type="range"
                              min={0}
                              max={252}
                              step={4}
                              value={selectedSlot.evs[statKey]}
                              onChange={(event) =>
                                applySlotUpdate(selectedSlotIndex, (slot) => ({
                                  ...slot,
                                  evs: {
                                    ...slot.evs,
                                    [statKey]: clampEvForTeamBuilder(
                                      Number(event.target.value),
                                      slot.evs,
                                      statKey
                                    )
                                  }
                                }))
                              }
                            />
                          </label>

                          <label>
                            <span>IV</span>
                            <input
                              type="range"
                              min={0}
                              max={31}
                              step={1}
                              value={selectedSlot.ivs[statKey]}
                              onChange={(event) =>
                                applySlotUpdate(selectedSlotIndex, (slot) => ({
                                  ...slot,
                                  ivs: {
                                    ...slot.ivs,
                                    [statKey]: Number(event.target.value)
                                  }
                                }))
                              }
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="team-builder-gba__radar-panel">
                    {selectedStats ? <StatRadar stats={selectedStats} /> : null}
                    <div className="team-builder-gba__computed-grid">
                      {selectedStats
                        ? TEAM_BUILDER_STAT_KEYS.map((statKey) => (
                            <div
                              key={`computed-${statKey}`}
                              className="team-builder-gba__computed-cell"
                            >
                              <span className="pixel-font">
                                {TEAM_BUILDER_STAT_LABELS[statKey]}
                              </span>
                              <strong>{selectedStats[statKey]}</strong>
                            </div>
                          ))
                        : null}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </div>
      ) : null}

      {alertState ? (
        <div className="team-builder-gba__alert-overlay" role="alertdialog" aria-modal="true">
          <div className="team-builder-gba__alert-box">
            <p className="pixel-font team-builder-gba__alert-title">{alertState.title}</p>
            <p className="team-builder-gba__alert-copy">{alertState.message}</p>
            <button
              type="button"
              className="team-builder-gba__action-btn is-save"
              onClick={() => setAlertState(null)}
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
