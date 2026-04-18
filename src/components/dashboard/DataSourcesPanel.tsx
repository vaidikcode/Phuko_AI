"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { MOCK_DATA_SOURCES, getDemoSourceEvents } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

const SOURCE_ICONS: Record<string, string> = {
  notion: "📋",
  slack: "💬",
  "google-docs": "📄",
  browser: "🌐",
};

export function DataSourcesPanel() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const demoEvents = useMemo(() => getDemoSourceEvents(), []);

  function mockSync(id: string) {
    setSyncing(id);
    setTimeout(() => setSyncing(null), 1200);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Data sources</h3>
        <span className="text-[10px] text-slate-400">Auto-sync every 5 min</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {MOCK_DATA_SOURCES.map(src => {
          const events = demoEvents.filter((e) => e.source === src.id);
          const isOpen = expanded === src.id;
          const isSyncing = syncing === src.id;

          return (
            <div
              key={src.id}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <button
                type="button"
                className="w-full flex items-center gap-2.5 p-3.5 hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(isOpen ? null : src.id)}
              >
                <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white", src.color)}>
                  {src.abbr}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">{src.label}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <div className="size-1.5 rounded-full bg-emerald-500" />
                    {isSyncing ? "Syncing…" : src.lastSync}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500">{src.eventCount}</span>
                  {isOpen ? <ChevronUp className="size-3 text-slate-400" /> : <ChevronDown className="size-3 text-slate-400" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50 px-3 py-2.5 space-y-1.5">
                  {events.map(ev => (
                    <div key={ev.id} className="flex items-start gap-2">
                      <span className="text-xs mt-0.5">{SOURCE_ICONS[ev.source]}</span>
                      <div>
                        <div className="text-[11px] font-medium text-slate-700">{ev.title}</div>
                        <div className="text-[10px] text-slate-400">{ev.date} · {ev.time} · {ev.duration}min</div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => mockSync(src.id)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-600 transition-colors mt-1"
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
