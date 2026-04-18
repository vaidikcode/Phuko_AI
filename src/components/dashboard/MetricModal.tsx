"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  metric: string;
  value: number;
  max: number;
  onClose: () => void;
};

function humanLabel(metric: string) {
  const map: Record<string, string> = {
    health: "Health", knowledge: "Knowledge", money: "Money", work: "Work",
    energy: "Energy", attention: "Attention Score",
  };
  if (metric.startsWith("relationship-")) return metric.replace("relationship-", "Relationship: ");
  return map[metric] ?? metric.charAt(0).toUpperCase() + metric.slice(1);
}

export function MetricModal({ metric, value, max, onClose }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    async function load() {
      try {
        const res = await fetch("/api/dashboard/metric-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metric, value, max }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!res.body) throw new Error("No stream");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        setLoading(false);

        while (true) {
          const { done, value: chunk } = await reader.read();
          if (done) break;
          setText(prev => prev + decoder.decode(chunk, { stream: true }));
        }
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
        setError((e as Error)?.message ?? "Failed to load suggestions");
        setLoading(false);
      }
    }

    void load();
    return () => ctrl.abort();
  }, [metric, value, max]);

  const pct = Math.round((value / max) * 100);
  const isLow = pct < 50;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg mx-4 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <div className={cn("flex size-9 items-center justify-center rounded-xl", isLow ? "bg-red-50" : "bg-emerald-50")}>
            <Sparkles className={cn("size-4", isLow ? "text-red-500" : "text-emerald-600")} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-900">{humanLabel(metric)}</div>
            <div className="text-xs text-slate-500">
              {value}/{max} · {pct}% · {isLow ? "Below target — " : "On track — "}AI suggestions
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X className="size-4" />
          </button>
        </div>

        {/* Score bar */}
        <div className="px-6 pt-4 pb-2">
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div
              className={cn("h-full rounded-full transition-all", isLow ? "bg-red-400" : pct < 75 ? "bg-amber-400" : "bg-emerald-500")}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 min-h-[200px] max-h-[420px] overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin text-emerald-600" />
              Analysing your data…
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
          )}
          {text && (
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{text}</div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
