"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RoleBadge } from "@/components/RoleBadge";
import { RoleGate, useRole } from "@/components/RoleContext";
import type { AdminOverviewPayload, AdminUserRow, AdminUsersPayload } from "@/lib/admin-types";
import { ROLE_LABELS, USER_ROLE_VALUES, type UserRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

type UserSortKey = "username" | "role" | "joinDate" | "lastActive" | "email";
type SortDirection = "asc" | "desc";
type StreamState = "connecting" | "live" | "degraded";

interface EditorState {
  displayName: string;
  email: string;
  avatarUrl: string;
  bio: string;
  role: UserRole;
  visibility: "private" | "public";
  showFavoritesOnPublic: boolean;
}

const emptyEditorState: EditorState = {
  displayName: "",
  email: "",
  avatarUrl: "",
  bio: "",
  role: "member",
  visibility: "private",
  showFavoritesOnPublic: false
};

const emptyUsers: AdminUserRow[] = [];

async function fetchJson<T>(input: string): Promise<T> {
  const response = await fetch(input, { cache: "no-store" });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(payload.message ?? "Request failed.");
  }
  return response.json() as Promise<T>;
}

function formatAbsoluteDate(value: string | null | undefined) {
  if (!value) {
    return "Never";
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "Unknown";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(new Date(parsed));
}

function formatRelativeDate(value: string | null | undefined) {
  if (!value) {
    return "Never";
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "Unknown";
  }
  const deltaMs = Date.now() - parsed;
  const minute = 60_000;
  const hour = minute * 60;
  const day = hour * 24;
  if (deltaMs < minute) return "just now";
  if (deltaMs < hour) return `${Math.max(1, Math.floor(deltaMs / minute))}m ago`;
  if (deltaMs < day) return `${Math.max(1, Math.floor(deltaMs / hour))}h ago`;
  if (deltaMs < day * 7) return `${Math.max(1, Math.floor(deltaMs / day))}d ago`;
  return formatAbsoluteDate(value);
}

function buildEditorState(user: AdminUserRow | null | undefined): EditorState {
  if (!user) {
    return emptyEditorState;
  }
  return {
    displayName: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl ?? "",
    bio: user.bio,
    role: user.role,
    visibility: user.visibility,
    showFavoritesOnPublic: user.showFavoritesOnPublic
  };
}

function compareValues(left: string | number, right: string | number, direction: SortDirection) {
  if (left === right) {
    return 0;
  }
  const result = left < right ? -1 : 1;
  return direction === "asc" ? result : -result;
}

export function AdminDashboardClient() {
  const queryClient = useQueryClient();
  const { userId } = useRole();
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [joinedFrom, setJoinedFrom] = useState("");
  const [joinedTo, setJoinedTo] = useState("");
  const [sortKey, setSortKey] = useState<UserSortKey>("joinDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<EditorState>(emptyEditorState);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streamState, setStreamState] = useState<StreamState>("connecting");

  const overviewQuery = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchJson<AdminOverviewPayload>("/api/admin/overview")
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchJson<AdminUsersPayload>("/api/admin/users")
  });

  useEffect(() => {
    if (!userId) {
      return;
    }

    const source = new EventSource("/api/admin/stream");
    const handleOverview = (event: Event) => {
      const message = event as MessageEvent<string>;
      try {
        const payload = JSON.parse(message.data) as AdminOverviewPayload;
        queryClient.setQueryData(["admin-overview"], payload);
        setStreamState("live");
      } catch {
        setStreamState("degraded");
      }
    };
    const handleUsers = (event: Event) => {
      const message = event as MessageEvent<string>;
      try {
        const payload = JSON.parse(message.data) as AdminUsersPayload;
        queryClient.setQueryData(["admin-users"], payload);
        setStreamState("live");
      } catch {
        setStreamState("degraded");
      }
    };
    const handleReady = () => {
      setStreamState("live");
    };
    const handleError = () => {
      setStreamState("degraded");
    };

    setStreamState("connecting");
    source.addEventListener("overview", handleOverview as EventListener);
    source.addEventListener("users", handleUsers as EventListener);
    source.addEventListener("ready", handleReady);
    source.addEventListener("stream-error", handleError);
    source.onerror = handleError;

    return () => {
      source.removeEventListener("overview", handleOverview as EventListener);
      source.removeEventListener("users", handleUsers as EventListener);
      source.removeEventListener("ready", handleReady);
      source.removeEventListener("stream-error", handleError);
      source.close();
    };
  }, [queryClient, userId]);

  const updateUserMutation = useMutation({
    mutationFn: async (payload: {
      userId: string;
      displayName: string;
      email: string;
      avatarUrl: string | null;
      bio: string;
      role: UserRole;
      visibility: "private" | "public";
      showFavoritesOnPublic?: boolean;
      suspend?: boolean;
    }) => {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
        user?: AdminUserRow;
      };
      if (!response.ok) {
        throw new Error(result.message ?? "Unable to update user.");
      }
      return result;
    },
    onSuccess: async (result) => {
      setInfoMessage("User updated.");
      setErrorMessage(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-overview"] })
      ]);
      startTransition(() => {
        setSelectedUserId(result.user?.uid ?? null);
      });
    },
    onError: (error) => {
      setInfoMessage(null);
      setErrorMessage(error instanceof Error ? error.message : "Unable to update user.");
    }
  });

  const allUsers = usersQuery.data?.items ?? emptyUsers;
  const filteredUsers = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const fromTime = joinedFrom ? Date.parse(joinedFrom) : null;
    const toTime = joinedTo ? Date.parse(joinedTo) : null;

    return allUsers
      .filter((user) => {
        if (roleFilter !== "all" && user.role !== roleFilter) {
          return false;
        }
        if (statusFilter === "active" && user.suspendedAt) {
          return false;
        }
        if (statusFilter === "suspended" && !user.suspendedAt) {
          return false;
        }

        const joinTime = Date.parse(user.joinDate);
        if (fromTime && !Number.isNaN(fromTime) && joinTime < fromTime) {
          return false;
        }
        if (toTime && !Number.isNaN(toTime) && joinTime > toTime + 86_399_999) {
          return false;
        }

        if (!query) {
          return true;
        }

        return (
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.uid.toLowerCase().includes(query)
        );
      })
      .sort((left, right) => {
        if (sortKey === "username") {
          return compareValues(left.username.toLowerCase(), right.username.toLowerCase(), sortDirection);
        }
        if (sortKey === "role") {
          return compareValues(ROLE_LABELS[left.role], ROLE_LABELS[right.role], sortDirection);
        }
        if (sortKey === "email") {
          return compareValues(left.email.toLowerCase(), right.email.toLowerCase(), sortDirection);
        }
        if (sortKey === "lastActive") {
          return compareValues(
            Date.parse(left.lastActive ?? "") || 0,
            Date.parse(right.lastActive ?? "") || 0,
            sortDirection
          );
        }
        return compareValues(
          Date.parse(left.joinDate) || 0,
          Date.parse(right.joinDate) || 0,
          sortDirection
        );
      });
  }, [allUsers, deferredSearch, joinedFrom, joinedTo, roleFilter, sortDirection, sortKey, statusFilter]);

  const selectedUser =
    filteredUsers.find((user) => user.uid === selectedUserId) ??
    allUsers.find((user) => user.uid === selectedUserId) ??
    null;

  useEffect(() => {
    if (!selectedUserId && filteredUsers[0]) {
      setSelectedUserId(filteredUsers[0].uid);
      return;
    }
    if (selectedUserId && filteredUsers.length === 0) {
      setSelectedUserId(null);
    }
  }, [filteredUsers, selectedUserId]);

  useEffect(() => {
    setEditorState(buildEditorState(selectedUser));
  }, [selectedUser]);

  const kpiCards = overviewQuery.data
    ? [
        {
          label: "Usuarios Totales",
          value: overviewQuery.data.kpis.totalUsers.toLocaleString("en-US"),
          accent: "from-slate-300/12 via-slate-200/8 to-transparent",
          helper: `${overviewQuery.data.deltas.pageViews >= 0 ? "+" : ""}${overviewQuery.data.deltas.pageViews} pageviews vs prior day`
        },
        {
          label: "Usuarios Activos",
          value: overviewQuery.data.kpis.activeUsers.toLocaleString("en-US"),
          accent: "from-emerald-400/16 via-emerald-300/10 to-transparent",
          helper: `${overviewQuery.data.deltas.activeUsers >= 0 ? "+" : ""}${overviewQuery.data.deltas.activeUsers} in the last 24h`
        },
        {
          label: "Tasa de Rebote",
          value: `${overviewQuery.data.kpis.bounceRate.toFixed(1)}%`,
          accent: "from-amber-300/16 via-amber-100/8 to-transparent",
          helper: `${overviewQuery.data.deltas.bounceRate >= 0 ? "+" : ""}${overviewQuery.data.deltas.bounceRate.toFixed(1)} pts`
        },
        {
          label: "Tiempo Medio",
          value: `${overviewQuery.data.kpis.avgSessionMinutes.toFixed(1)} min`,
          accent: "from-sky-400/14 via-sky-200/8 to-transparent",
          helper: `${overviewQuery.data.deltas.avgSessionMinutes >= 0 ? "+" : ""}${overviewQuery.data.deltas.avgSessionMinutes.toFixed(1)} min`
        }
      ]
    : [];

  return (
    <RoleGate requireAdmin>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(38,48,71,0.36),transparent_44%),linear-gradient(180deg,#05070c_0%,#0a0f19_45%,#0f1725_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6">
          <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] shadow-[0_30px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 border-b border-white/8 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Enterprise Control</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Backoffice operativo</h1>
                <p className="mt-3 max-w-3xl text-sm text-slate-300/78">Analitica viva, estado del sistema y gobierno de usuarios en una sola superficie.</p>
              </div>
                <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <span className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Access</span>
                    <p className="mt-2 font-medium text-white">Creator authority only</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <span className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Live Stream</span>
                    <p className="mt-2 font-medium text-white">
                      {streamState === "live" ? "SSE connected" : streamState === "connecting" ? "Connecting..." : "Reconnecting"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Operator {userId ?? "Unknown"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 sm:col-span-2">
                    <span className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Transport</span>
                    <p className="mt-2 font-medium text-white">Overview and users replicated in realtime</p>
                    <p className="mt-1 text-xs text-slate-400">Server-sent events keep KPIs, infra and command table current.</p>
                  </div>
                </div>
              </div>

            <div className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-4">
              {overviewQuery.isLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div key={`kpi-skeleton-${index}`} className="h-[138px] animate-pulse rounded-[24px] border border-white/8 bg-white/[0.04]" />
                  ))
                : kpiCards.map((card) => (
                    <article
                      key={card.label}
                      className={cn(
                        "relative overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(9,14,24,0.96))] p-5",
                        "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-100 before:content-['']",
                        card.accent
                      )}
                    >
                      <div className="relative z-[1]">
                        <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">{card.label}</p>
                        <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{card.value}</p>
                        <p className="mt-4 text-sm text-slate-300/72">{card.helper}</p>
                      </div>
                    </article>
                  ))}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
            <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.34)]">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Trafico y registros</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Actividad diaria</h2>
                </div>
                <p className="text-sm text-slate-400">Ultimos 7 dias</p>
              </div>
              <div className="mt-6 h-[340px]">
                {overviewQuery.data ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={overviewQuery.data.traffic}>
                      <defs>
                        <linearGradient id="trafficFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.42} />
                          <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="registrationFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.38} />
                          <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "rgba(9, 14, 24, 0.92)", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 18, color: "#f8fafc" }} />
                      <Area type="monotone" dataKey="pageViews" stroke="#6ee7b7" strokeWidth={2} fill="url(#trafficFill)" />
                      <Area type="monotone" dataKey="registrations" stroke="#60a5fa" strokeWidth={2} fill="url(#registrationFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-white/10 text-sm text-slate-400">Loading chart...</div>
                )}
              </div>
            </article>

            <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.34)]">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">System Health</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Infra y base de datos</h2>
                </div>
                <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-medium", overviewQuery.data?.system.databaseState === "online" ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-300" : overviewQuery.data?.system.databaseState === "offline" ? "border-rose-400/35 bg-rose-500/10 text-rose-300" : "border-amber-400/35 bg-amber-500/10 text-amber-300")}>
                  {overviewQuery.data?.system.databaseState ?? "loading"}
                </span>
              </div>
              <div className="mt-6 grid gap-4">
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Latency</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{overviewQuery.data?.system.responseLatencyMs ?? 0}ms</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.26em] text-slate-500">CPU</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{overviewQuery.data?.system.cpuUsagePercent.toFixed(1) ?? "0.0"}%</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Memory</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{overviewQuery.data?.system.memoryUsagePercent.toFixed(1) ?? "0.0"}%</p>
                    <p className="mt-2 text-sm text-slate-400">{overviewQuery.data?.system.memoryUsedMb ?? 0}MB / {overviewQuery.data?.system.memoryTotalMb ?? 0}MB</p>
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Database</p>
                  <p className="mt-3 text-xl font-semibold text-white">{overviewQuery.data?.system.databaseLabel ?? "Unknown"}</p>
                  <p className="mt-2 text-sm text-slate-400">{overviewQuery.data?.system.databaseDetail ?? "No detail"}</p>
                </div>
              </div>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
            <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.34)]">
              <div className="flex flex-col gap-4 border-b border-white/8 pb-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Central de Comando</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Gestion de usuarios</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300">Total {usersQuery.data?.totals.total ?? 0}</span>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">Active {usersQuery.data?.totals.active ?? 0}</span>
                    <span className="rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-xs text-rose-300">Suspended {usersQuery.data?.totals.suspended ?? 0}</span>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-6">
                  <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search username, email or uid" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/45 lg:col-span-2" />
                  <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | "all")} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/45">
                    <option value="all">All roles</option>
                    {USER_ROLE_VALUES.map((role) => (
                      <option key={`filter-role-${role}`} value={role}>{ROLE_LABELS[role]}</option>
                    ))}
                  </select>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "suspended")} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/45">
                    <option value="all">All states</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  <input type="date" value={joinedFrom} onChange={(event) => setJoinedFrom(event.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/45" />
                  <input type="date" value={joinedTo} onChange={(event) => setJoinedTo(event.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/45" />
                </div>

                <div className="flex flex-wrap gap-3">
                  <select value={sortKey} onChange={(event) => setSortKey(event.target.value as UserSortKey)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/45">
                    <option value="joinDate">Sort by join date</option>
                    <option value="lastActive">Sort by last active</option>
                    <option value="username">Sort by username</option>
                    <option value="email">Sort by email</option>
                    <option value="role">Sort by role</option>
                  </select>
                  <button type="button" onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 transition hover:border-white/20">
                    {sortDirection === "asc" ? "Ascending" : "Descending"}
                  </button>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[24px] border border-white/8">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/8 text-left text-sm">
                    <thead className="bg-white/[0.04] text-slate-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">User</th>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium">Join Date</th>
                        <th className="px-4 py-3 font-medium">Last Active</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/8 bg-black/10">
                      {usersQuery.isLoading ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading users...</td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No users match the current filter.</td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.uid} className={cn("transition hover:bg-white/[0.04]", selectedUserId === user.uid && "bg-sky-500/[0.08]")}>
                            <td className="px-4 py-4">
                              <div className="min-w-[220px]">
                                <p className="font-medium text-white">{user.username}</p>
                                <p className="mt-1 text-xs text-slate-400">{user.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-slate-200">
                              <RoleBadge role={user.role} compact />
                            </td>
                            <td className="px-4 py-4 text-slate-300">{formatAbsoluteDate(user.joinDate)}</td>
                            <td className="px-4 py-4 text-slate-300">{formatRelativeDate(user.lastActive)}</td>
                            <td className="px-4 py-4">
                              <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs", user.suspendedAt ? "border-rose-400/30 bg-rose-500/10 text-rose-300" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300")}>
                                {user.suspendedAt ? "Suspended" : "Active"}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <button type="button" onClick={() => setSelectedUserId(user.uid)} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-white/20">
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </article>

            <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.34)]">
              <div className="flex items-end justify-between gap-3 border-b border-white/8 pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">User Editor</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">{selectedUser ? selectedUser.username : "Select a user"}</h2>
                </div>
                {selectedUser ? <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300">{selectedUser.uid.slice(0, 12)}</span> : null}
              </div>

              {selectedUser ? (
                <div className="mt-5 space-y-4">
                  <label className="block space-y-2">
                    <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Display Name</span>
                    <input value={editorState.displayName} onChange={(event) => setEditorState((current) => ({ ...current, displayName: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/45" />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Email</span>
                    <input value={editorState.email} onChange={(event) => setEditorState((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/45" />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Avatar URL</span>
                    <input value={editorState.avatarUrl} onChange={(event) => setEditorState((current) => ({ ...current, avatarUrl: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/45" />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Role</span>
                    <select value={editorState.role} onChange={(event) => setEditorState((current) => ({ ...current, role: event.target.value as UserRole }))} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/45">
                      {USER_ROLE_VALUES.map((role) => (
                        <option key={`editor-role-${role}`} value={role}>{ROLE_LABELS[role]}</option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Visibility</span>
                      <select value={editorState.visibility} onChange={(event) => setEditorState((current) => ({ ...current, visibility: event.target.value as "private" | "public" }))} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/45">
                        <option value="private">Private</option>
                        <option value="public">Public</option>
                      </select>
                    </label>
                    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
                      <input type="checkbox" checked={editorState.showFavoritesOnPublic} onChange={(event) => setEditorState((current) => ({ ...current, showFavoritesOnPublic: event.target.checked }))} className="h-4 w-4" />
                      Public favorites
                    </label>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Bio</span>
                    <textarea value={editorState.bio} onChange={(event) => setEditorState((current) => ({ ...current, bio: event.target.value }))} rows={5} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/45" />
                  </label>

                  {infoMessage ? <p className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{infoMessage}</p> : null}
                  {errorMessage ? <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</p> : null}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setInfoMessage(null);
                        setErrorMessage(null);
                        updateUserMutation.mutate({
                          userId: selectedUser.uid,
                          displayName: editorState.displayName,
                          email: editorState.email,
                          avatarUrl: editorState.avatarUrl.trim() ? editorState.avatarUrl.trim() : null,
                          bio: editorState.bio,
                          role: editorState.role,
                          visibility: editorState.visibility,
                          showFavoritesOnPublic: editorState.showFavoritesOnPublic
                        });
                      }}
                      disabled={updateUserMutation.isPending}
                      className={cn("rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-100", updateUserMutation.isPending && "opacity-60")}
                    >
                      {updateUserMutation.isPending ? "Saving..." : "Save changes"}
                    </button>
                    <button type="button" onClick={() => setEditorState(buildEditorState(selectedUser))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 transition hover:border-white/20">
                      Reset
                    </button>
                    <button
                      type="button"
                      disabled={selectedUser.uid === userId || Boolean(selectedUser.suspendedAt)}
                      onClick={() => {
                        setInfoMessage(null);
                        setErrorMessage(null);
                        updateUserMutation.mutate({
                          userId: selectedUser.uid,
                          displayName: editorState.displayName,
                          email: editorState.email,
                          avatarUrl: editorState.avatarUrl.trim() ? editorState.avatarUrl.trim() : null,
                          bio: editorState.bio,
                          role: editorState.role,
                          visibility: editorState.visibility,
                          showFavoritesOnPublic: editorState.showFavoritesOnPublic,
                          suspend: true
                        });
                      }}
                      className={cn("rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200 transition hover:bg-rose-500/16", (selectedUser.uid === userId || Boolean(selectedUser.suspendedAt)) && "opacity-50")}
                    >
                      Suspend permanently
                    </button>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                    <div className="flex flex-wrap justify-between gap-3">
                      <span>Joined: {formatAbsoluteDate(selectedUser.joinDate)}</span>
                      <span>Last active: {formatRelativeDate(selectedUser.lastActive)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap justify-between gap-3">
                      <span>Provider: {selectedUser.provider}</span>
                      <span>Status: {selectedUser.suspendedAt ? "Suspended" : "Active"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[24px] border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-400">Select a user from the table to edit profile data, authority and status.</div>
              )}
            </article>
          </section>
        </div>
      </main>
    </RoleGate>
  );
}
