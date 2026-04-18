"use client";

import { useEffect, useState } from "react";
import { Zap, Brain, Clock, Flame } from "lucide-react";
import { MOCK_METRICS } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

function RadialBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = value / max;
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <svg width="52" height="52" className="-rotate-90">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
      <circle
        cx="26" cy="26" r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  );
}

function useCountdown(minutesAway: number) {
  const [target] = useState(() => Date.now() + minutesAway * 60 * 1000);
  const [remaining, setRemaining] = useState(minutesAway * 60);

  useEffect(() => {
    const iv = setInterval(() => {
      const diff = Math.max(0, Math.round((target - Date.now()) / 1000));
      setRemaining(diff);
    }, 1000);
    return () => clearInterval(iv);
  }, [target]);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${String(s).padStart(2,"0")}s`;
}

export function VitalStats({ onMetricClick }: { onMetricClick: (metric: string, value: number, max: number) => void }) {
  const countdown = useCountdown(MOCK_METRICS.nextEvent.minutesAway);

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Next Event */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-sky-50">
            <Clock className="size-3.5 text-sky-600" />
          </div>
          <span className="text-xs font-medium text-slate-500">Next event</span>
        </div>
        <div className="text-2xl font-bold text-slate-900 tabular-nums">{countdown}</div>
        <div className="mt-1 text-xs text-slate-500 truncate">{MOCK_METRICS.nextEvent.title}</div>
        <div className="mt-2 flex items-center gap-1">
          <div className="size-1.5 rounded-full bg-sky-500 animate-pulse" />
          <span className="text-[10px] text-sky-600 font-medium">Focus block</span>
        </div>
      </div>

      {/* Energy */}
      <button
        type="button"
        onClick={() => onMetricClick("energy", MOCK_METRICS.energy, 100)}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-left hover:border-amber-300 hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50">
            <Zap className="size-3.5 text-amber-500" />
          </div>
          <span className="text-xs font-medium text-slate-500">Energy</span>
        </div>
        <div className="flex items-center gap-3">
          <RadialBar value={MOCK_METRICS.energy} max={100} color="#f59e0b" />
          <div>
            <div className="text-2xl font-bold text-slate-900">{MOCK_METRICS.energy}<span className="text-sm font-normal text-slate-400">/100</span></div>
            <div className={cn("text-[10px] font-medium", MOCK_METRICS.energy >= 70 ? "text-emerald-600" : MOCK_METRICS.energy >= 50 ? "text-amber-500" : "text-red-500")}>
              {MOCK_METRICS.energy >= 70 ? "Good" : MOCK_METRICS.energy >= 50 ? "Moderate" : "Low"}
            </div>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-slate-400 group-hover:text-amber-500 transition-colors">Click for suggestions →</div>
      </button>

      {/* Attention */}
      <button
        type="button"
        onClick={() => onMetricClick("attention", MOCK_METRICS.attentionScore, 100)}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-left hover:border-violet-300 hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-violet-50">
            <Brain className="size-3.5 text-violet-500" />
          </div>
          <span className="text-xs font-medium text-slate-500">Attention score</span>
          <span className="ml-auto text-[9px] text-slate-400">browser</span>
        </div>
        <div className="flex items-center gap-3">
          <RadialBar value={MOCK_METRICS.attentionScore} max={100} color="#8b5cf6" />
          <div>
            <div className="text-2xl font-bold text-slate-900">{MOCK_METRICS.attentionScore}<span className="text-sm font-normal text-slate-400">/100</span></div>
            <div className={cn("text-[10px] font-medium", MOCK_METRICS.attentionScore >= 70 ? "text-emerald-600" : MOCK_METRICS.attentionScore >= 50 ? "text-amber-500" : "text-red-500")}>
              {MOCK_METRICS.attentionScore >= 70 ? "Sharp" : MOCK_METRICS.attentionScore >= 50 ? "Fragmented" : "Depleted"}
            </div>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-slate-400 group-hover:text-violet-500 transition-colors">Click for suggestions →</div>
      </button>
    </div>
  );
}
