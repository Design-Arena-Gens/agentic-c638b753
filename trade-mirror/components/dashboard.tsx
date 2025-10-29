"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import type { MirrorLogEntry, MirrorState, SyncSummary } from "@/lib/types";

type DashboardProps = {
  initialState: MirrorState;
  initialLogs: MirrorLogEntry[];
};

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
};

type StateResponse = MirrorState;
type LogsResponse = { logs: MirrorLogEntry[] };

export default function Dashboard({
  initialState,
  initialLogs,
}: DashboardProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  const {
    data: state,
    mutate: mutateState,
    isValidating: stateLoading,
  } = useSWR<StateResponse>("/api/state", fetcher<StateResponse>, {
    refreshInterval: 10_000,
    fallbackData: initialState,
  });

  const {
    data: logResponse,
    mutate: mutateLogs,
    isValidating: logsLoading,
  } = useSWR<LogsResponse>("/api/logs", fetcher<LogsResponse>, {
    refreshInterval: 15_000,
    fallbackData: { logs: initialLogs },
  });

  const latestLogs = useMemo(() => logResponse?.logs ?? [], [logResponse]);

  const triggerSync = useCallback(async () => {
    try {
      setSyncing(true);
      const response = await fetch("/api/sync", { method: "POST" });
      const summary = (await response.json()) as SyncSummary;
      setSyncSummary(summary);
      await Promise.all([mutateState(), mutateLogs()]);
    } catch (error) {
      console.error("Manual sync failed", error);
    } finally {
      setSyncing(false);
    }
  }, [mutateLogs, mutateState]);

  useEffect(() => {
    void triggerSync();
  }, [triggerSync]);

  useEffect(() => {
    if (!autoSyncEnabled) {
      return undefined;
    }
    const id = setInterval(() => {
      void triggerSync();
    }, 20_000);
    return () => clearInterval(id);
  }, [autoSyncEnabled, triggerSync]);

  const toggleMirroring = useCallback(async () => {
    if (!state) {
      return;
    }
    try {
      setSyncing(true);
      await fetch("/api/state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled: !state.enabled }),
      });
      await mutateState();
    } catch (error) {
      console.error("Toggle mirroring failed", error);
    } finally {
      setSyncing(false);
    }
  }, [mutateState, state]);

  const latestSummary = syncSummary;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              MoxyAI Trade Mirror
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Automatically replicates MoxyAI signals into your trading account.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                state?.enabled
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-amber-500/10 text-amber-300"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  state?.enabled ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              {state?.enabled ? "Mirroring Active" : "Mirroring Paused"}
            </span>
            <button
              type="button"
              onClick={toggleMirroring}
              disabled={syncing}
              className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state?.enabled ? "Pause" : "Resume"}
            </button>
            <button
              type="button"
              onClick={() => void triggerSync()}
              disabled={syncing}
              className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-sm text-slate-400">Auto Sync</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-lg font-semibold">
                {autoSyncEnabled ? "Enabled" : "Disabled"}
              </span>
              <button
                type="button"
                onClick={() => setAutoSyncEnabled((prev) => !prev)}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
              >
                {autoSyncEnabled ? "Disable" : "Enable"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-sm text-slate-400">Last Sync</p>
            <div className="mt-3 text-lg font-semibold">
              {state?.lastSyncAt
                ? new Date(state.lastSyncAt).toLocaleString()
                : "Waiting"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-sm text-slate-400">Last Trade ID</p>
            <div className="mt-3 truncate text-lg font-semibold">
              {state?.lastTradeId ?? "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-sm text-slate-400">Latest Summary</p>
            <div className="mt-3 text-sm leading-5 text-slate-200">
              {latestSummary ? (
                <>
                  <span className="block">
                    Attempted: {latestSummary.attempted}
                  </span>
                  <span className="block">
                    Mirrored: {latestSummary.mirrored}
                  </span>
                  <span className="block">Failed: {latestSummary.failed}</span>
                </>
              ) : (
                "No sync yet"
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold">Mirrored Trades</h2>
              <p className="text-xs text-slate-400">
                Real-time log of mirrored trades and failures.
              </p>
            </div>
            <div className="text-xs text-slate-400">
              {logsLoading ? "Refreshing…" : "Live"}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Trade</th>
                  <th className="px-6 py-3">Position</th>
                  <th className="px-6 py-3">Lot</th>
                  <th className="px-6 py-3">SL / TP</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {latestLogs.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-6 text-center text-slate-500"
                      colSpan={7}
                    >
                      No trades mirrored yet.
                    </td>
                  </tr>
                ) : (
                  latestLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/60">
                      <td className="px-6 py-3 text-xs text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-medium">{log.pair}</div>
                        <div className="text-xs text-slate-400">
                          #{log.tradeId}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            log.direction === "buy"
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-rose-500/10 text-rose-300"
                          }`}
                        >
                          {log.direction.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {log.payload.lotSize.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-3">
                        <div className="text-xs text-slate-300">
                          SL {log.payload.stopLoss}
                        </div>
                        <div className="text-xs text-slate-300">
                          TP {log.payload.takeProfit}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            log.status === "mirrored"
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-rose-500/10 text-rose-300"
                          }`}
                        >
                          {log.status.toUpperCase()}
                        </span>
                        <div className="text-xs text-slate-400">
                          {log.message}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-400">
                        {log.platformOrderId ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
          <h2 className="text-lg font-semibold text-slate-100">
            Integration Checklist
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5">
            <li>
              Set <code>MOXYAI_API_URL</code> and <code>MOXYAI_API_KEY</code>{" "}
              environment variables to connect with your MoxyAI account.
            </li>
            <li>
              Provide <code>TRADING_PLATFORM_API_URL</code> and{" "}
              <code>TRADING_PLATFORM_API_KEY</code> to mirror trades into MetaTrader,
              TradingView, or any REST-compatible execution layer.
            </li>
            <li>
              Optionally configure <code>NOTIFICATION_WEBHOOK_URL</code> for Slack
              or Discord alerts.
            </li>
          </ol>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/60">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            &copy; {new Date().getFullYear()} Trade Mirror Agent. All rights
            reserved.
          </span>
          <span>
            State: {stateLoading ? "Refreshing…" : "Up to date"} · Logs:{" "}
            {logsLoading ? "Refreshing…" : "Up to date"}
          </span>
        </div>
      </footer>
    </div>
  );
}
