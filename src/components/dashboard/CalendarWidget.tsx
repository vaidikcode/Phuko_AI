"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMockCalendarDays } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["S","M","T","W","T","F","S"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const DAY_COLORS: Record<"green"|"yellow"|"red", string> = {
  green:  "bg-emerald-500 text-white",
  yellow: "bg-amber-400 text-white",
  red:    "bg-red-400 text-white",
};

const calendarDays = getMockCalendarDays();

export function CalendarWidget() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [tooltip, setTooltip] = useState<string | null>(null);

  const { days, firstDayOfWeek } = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const first = new Date(viewYear, viewMonth, 1).getDay();
    return { days: daysInMonth, firstDayOfWeek: first };
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const cells: Array<null | { day: number; iso: string }> = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: days }, (_, i) => {
      const d = i + 1;
      const iso = `${viewYear}-${String(viewMonth + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      return { day: d, iso };
    }),
  ];

  const todayIso = today.toISOString().split("T")[0];
  const isThisMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-semibold text-slate-900">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((l, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-slate-400 py-1">{l}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const { day, iso } = cell;
          const status = calendarDays[iso];
          const isToday = iso === todayIso;
          return (
            <div
              key={iso}
              className="relative flex items-center justify-center"
              onMouseEnter={() => status && setTooltip(iso)}
              onMouseLeave={() => setTooltip(null)}
            >
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-medium transition-all cursor-default",
                  status ? DAY_COLORS[status] : "text-slate-400",
                  isToday && "ring-2 ring-offset-1 ring-slate-400",
                )}
              >
                {day}
              </div>
              {tooltip === iso && status && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 pointer-events-none rounded-lg bg-slate-900 px-2 py-1 text-[10px] text-white shadow-lg whitespace-nowrap">
                  {iso.slice(5)} · {status === "green" ? "≥50% tasks done" : status === "red" ? "<50% tasks done" : "In progress"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-4 border-t border-slate-100 pt-3">
        {[{color:"bg-emerald-500",label:"Success"},
          {color:"bg-amber-400",label:"In progress"},
          {color:"bg-red-400",label:"Missed"}
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <div className={cn("size-2.5 rounded-full", l.color)} />
            <span className="text-[10px] text-slate-500">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      {isThisMonth && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label:"Green", count: Object.values(calendarDays).filter(v => v === "green").length, color:"text-emerald-600" },
            { label:"Yellow", count: Object.values(calendarDays).filter(v => v === "yellow").length, color:"text-amber-600" },
            { label:"Red", count: Object.values(calendarDays).filter(v => v === "red").length, color:"text-red-500" },
          ].map(s => (
            <div key={s.label} className="rounded-lg bg-slate-50 p-2 text-center">
              <div className={cn("text-lg font-bold", s.color)}>{s.count}</div>
              <div className="text-[10px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
