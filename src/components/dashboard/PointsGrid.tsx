"use client";

import { MOCK_POINTS } from "@/lib/mock/data";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

const POINT_META = {
  health:    { label:"Health",    emoji:"💪", color:"emerald", bg:"bg-emerald-50", ring:"ring-emerald-200", bar:"bg-emerald-500", text:"text-emerald-700" },
  knowledge: { label:"Knowledge", emoji:"📚", color:"blue",    bg:"bg-blue-50",    ring:"ring-blue-200",    bar:"bg-blue-500",    text:"text-blue-700"    },
  money:     { label:"Money",     emoji:"💰", color:"amber",   bg:"bg-amber-50",   ring:"ring-amber-200",   bar:"bg-amber-500",   text:"text-amber-700"   },
  work:      { label:"Work",      emoji:"💼", color:"violet",  bg:"bg-violet-50",  ring:"ring-violet-200",  bar:"bg-violet-500",  text:"text-violet-700"  },
} as const;

type MetricKey = keyof typeof POINT_META;

function PointCard({ metricKey, onMetricClick }: { metricKey: MetricKey; onMetricClick: (metric: string, value: number, max: number) => void }) {
  const data = MOCK_POINTS[metricKey];
  const meta = POINT_META[metricKey];
  const pct = (data.value / data.max) * 100;
  const isLow = pct < 50;
  const isMed = pct >= 50 && pct < 75;

  return (
    <button
      type="button"
      onClick={() => onMetricClick(metricKey, data.value, data.max)}
      className={cn(
        "relative rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md group",
        isLow ? "border-red-200 hover:border-red-400" : isMed ? "border-amber-200 hover:border-amber-400" : "border-slate-200 hover:border-emerald-300"
      )}
    >
      {isLow && (
        <div className="absolute top-2 right-2 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-600 uppercase tracking-wide">
          Low
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{meta.emoji}</span>
        <span className="text-sm font-semibold text-slate-700">{meta.label}</span>
      </div>
      <div className="text-3xl font-bold text-slate-900">
        {data.value}
        <span className="text-sm font-normal text-slate-400">/{data.max}</span>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all duration-700", meta.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium", data.trend === "up" ? "text-emerald-600" : "text-red-500")}>
        {data.trend === "up" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
        {data.delta > 0 ? "+" : ""}{data.delta} this week
      </div>
      <div className="mt-2 text-[10px] text-slate-400 group-hover:text-slate-600 transition-colors">
        {isLow ? "Click to fix →" : "Click for insights →"}
      </div>
    </button>
  );
}

export function PointsGrid({ onMetricClick }: { onMetricClick: (metric: string, value: number, max: number) => void }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Life points</h3>
      <div className="grid grid-cols-2 gap-4">
        {(Object.keys(POINT_META) as MetricKey[]).map(k => (
          <PointCard key={k} metricKey={k} onMetricClick={onMetricClick} />
        ))}
      </div>
    </div>
  );
}
