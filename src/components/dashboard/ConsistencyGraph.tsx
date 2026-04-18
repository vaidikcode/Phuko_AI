"use client";

import { useState } from "react";
import { getMockConsistency } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

const days = getMockConsistency();

function barColor(score: number) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-400";
  return "bg-red-400";
}

export function ConsistencyGraph() {
  const [hovered, setHovered] = useState<number | null>(null);
  const avg = Math.round(days.reduce((s, d) => s + d.score, 0) / days.length);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Consistency</h3>
          <p className="text-xs text-slate-400">Last 30 days</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-600">{avg}%</div>
          <div className="text-xs text-slate-400">avg completion</div>
        </div>
      </div>

      {/* Bars */}
      <div className="relative flex items-end gap-0.5 h-24">
        {days.map((d, i) => (
          <div
            key={d.date}
            className="relative flex-1 group"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className={cn("w-full rounded-t-sm transition-opacity", barColor(d.score), hovered !== null && hovered !== i ? "opacity-40" : "opacity-100")}
              style={{ height: `${Math.max(d.score, 4)}%`, minHeight: "3px" }}
            />
            {hovered === i && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 pointer-events-none whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] text-white shadow-lg">
                {d.date.slice(5)}<br/>
                <span className="font-bold">{d.score}%</span> · {d.tasksCompleted}/{d.tasksTotal} tasks
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3">
        {[{color:"bg-emerald-500",label:"≥70%"},{color:"bg-amber-400",label:"50–69%"},{color:"bg-red-400",label:"<50%"}].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={cn("size-2 rounded-full", l.color)} />
            <span className="text-[10px] text-slate-500">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
