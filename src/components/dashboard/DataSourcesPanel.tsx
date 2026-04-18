"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, RefreshCw, FileText, MessageSquare, Globe, Database, Unplug, PlugZap, X } from "lucide-react";
import { MOCK_DATA_SOURCES, getDemoSourceEvents, type SourceId } from "@/lib/mock/data";
import { cn } from "@/lib/utils";
import { useSourceConnections } from "@/lib/client/source-connections";

const SOURCE_ICONS: Record<SourceId, typeof FileText> = {
  notion:       FileText,
  slack:        MessageSquare,
  "google-docs":FileText,
  browser:      Globe,
};

export function DataSourcesPanel() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [revokeConfirm, setRevokeConfirm] = useState<SourceId | null>(null);
  const demoEvents = useMemo(() => getDemoSourceEvents(), []);
  const { connections, revoke, reconnect } = useSourceConnections();

  function mockSync(id: string) {
    setSyncing(id);
    setTimeout(() => setSyncing(null), 1200);
  }

  const connectedCount = MOCK_DATA_SOURCES.filter(
    (s) => connections[s.id as SourceId] ?? true
  ).length;

  return (
    <div className="rounded-xl border border-surface-border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border bg-surface-base">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-brand-600 shrink-0" />
          <h3 className="text-sm font-semibold text-ink">Data sources</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink-faint">{connectedCount}/{MOCK_DATA_SOURCES.length} connected</span>
          <span className="text-[11px] text-ink-faint">· Auto-sync 5 min</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-3">
        {MOCK_DATA_SOURCES.map((src) => {
          const connected = connections[src.id as SourceId] ?? true;
          const events = demoEvents.filter((e) => e.source === src.id);
          const isOpen = expanded === src.id && connected;
          const isSyncing = syncing === src.id;
          const SourceIcon = SOURCE_ICONS[src.id as SourceId];
          const confirming = revokeConfirm === src.id;

          return (
            <div
              key={src.id}
              className={cn(
                "overflow-hidden rounded-lg border transition-all",
                connected
                  ? "border-surface-border bg-surface-base"
                  : "border-dashed border-surface-border bg-surface-base/50 opacity-70"
              )}
            >
              <div className="flex w-full items-center gap-2.5 p-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  onClick={() => connected && setExpanded(isOpen ? null : src.id)}
                  disabled={!connected}
                >
                  <div className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold transition-all",
                    connected ? src.color : "bg-surface-border text-ink-faint"
                  )}>
                    {src.abbr}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cn("truncate text-xs font-semibold", connected ? "text-ink" : "text-ink-faint line-through")}>
                      {src.label}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-ink-faint">
                      <div className={cn("size-1.5 shrink-0 rounded-full", connected ? "bg-brand-600" : "bg-ink-faint")} />
                      {connected
                        ? (isSyncing ? "Syncing…" : src.lastSync)
                        : "Access revoked"}
                    </div>
                  </div>
                </button>

                {/* Actions */}
                {connected ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] font-bold text-ink mr-1">{src.eventCount}</span>
                    {isOpen
                      ? <ChevronUp className="size-3 text-ink-faint" />
                      : <ChevronDown className="size-3 text-ink-faint cursor-pointer" onClick={() => setExpanded(src.id)} />
                    }
                    {confirming ? (
                      <>
                        <button
                          type="button"
                          onClick={() => { revoke(src.id as SourceId); setRevokeConfirm(null); setExpanded(null); }}
                          className="text-[10px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded px-1.5 py-0.5 transition-colors"
                        >
                          Revoke
                        </button>
                        <button
                          type="button"
                          onClick={() => setRevokeConfirm(null)}
                          className="p-0.5 text-ink-faint hover:text-ink"
                        >
                          <X className="size-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRevokeConfirm(src.id as SourceId)}
                        className="ml-1 p-0.5 text-ink-faint hover:text-red-500 transition-colors rounded"
                        title="Revoke access"
                      >
                        <Unplug className="size-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => reconnect(src.id as SourceId)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-md px-2 py-1 transition-colors shrink-0"
                  >
                    <PlugZap className="size-3" />
                    Connect
                  </button>
                )}
              </div>

              {isOpen && connected && (
                <div className="space-y-1.5 border-t border-surface-border bg-white px-3 py-2.5">
                  {events.map((ev) => {
                    const EvIcon = SOURCE_ICONS[ev.source as SourceId];
                    return (
                      <div key={ev.id} className="flex items-start gap-2">
                        <span className="mt-0.5 flex shrink-0 text-ink-subtle">
                          <EvIcon className="size-3.5" />
                        </span>
                        <div>
                          <div className="text-[11px] font-medium text-ink">{ev.title}</div>
                          <div className="text-[10px] text-ink-faint">
                            {ev.date} · {ev.time} · {ev.duration}min
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => mockSync(src.id)}
                    className="mt-1 flex items-center gap-1 text-[11px] text-ink-faint transition-colors hover:text-brand-600"
                  >
                    <RefreshCw className={cn("size-2.5", isSyncing && "animate-spin")} />
                    {isSyncing ? "Syncing…" : "Sync now"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
