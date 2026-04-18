"use client";

import { MOCK_RELATIONSHIPS, type RelStatus } from "@/lib/mock/data";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

const STATUS_STYLES: Record<RelStatus, { dot: string; label: string; labelColor: string }> = {
  "strong":          { dot:"bg-emerald-500", label:"Strong",          labelColor:"text-emerald-600" },
  "warm":            { dot:"bg-amber-400",   label:"Warm",            labelColor:"text-amber-600"   },
  "needs-attention": { dot:"bg-red-400",     label:"Needs attention", labelColor:"text-red-500"     },
};

export function RelationshipsPanel({
  onMetricClick,
}: {
  onMetricClick: (metric: string, value: number, max: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Users className="size-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">Relationships</h3>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {MOCK_RELATIONSHIPS.map((r, i) => {
          const st = STATUS_STYLES[r.status];
          const pct = r.score;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onMetricClick(`relationship-${r.label}`, r.score, 100)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors group",
                i > 0 && "border-t border-slate-100"
              )}
            >
              {/* Avatar */}
              <div className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                r.score >= 80 ? "bg-emerald-500" : r.score >= 60 ? "bg-amber-400" : "bg-red-400"
              )}>
                {r.label.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800 truncate">{r.label}</span>
                  <span className={cn("text-[10px] font-medium", st.labelColor)}>{st.label}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-slate-100">
                    <div
                      className={cn("h-full rounded-full", r.score >= 70 ? "bg-emerald-500" : r.score >= 50 ? "bg-amber-400" : "bg-red-400")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{r.score}/100</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] text-slate-400">{r.lastContact}</div>
                <div className="text-[10px] text-slate-300 group-hover:text-slate-500 mt-0.5 transition-colors">suggest →</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
