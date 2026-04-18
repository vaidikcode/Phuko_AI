"use client";

import { useEffect, useState } from "react";
import { Zap, Clock, CheckCircle2, AlertTriangle, Globe, MessageSquare, FileText } from "lucide-react";
import { MOCK_METRICS, MOCK_SOURCE_EVENTS } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

const CURRENT_ACTIVITY = {
  scheduled: { title: "Deep Work: Product Spec", type: "focus", source: "notion" },
  detected:  { title: "Twitter / X — Feed browsing", type: "distraction" },
  alignment: 22, // percent aligned
};

const BROWSER_ACTIVITY = [
  { site: "twitter.com",    duration: "14 min", category: "distraction", icon: "🐦" },
  { site: "notion.so",      duration: "8 min",  category: "work",        icon: "📋" },
  { site: "github.com",     duration: "6 min",  category: "work",        icon: "💻" },
  { site: "youtube.com",    duration: "5 min",  category: "distraction", icon: "📺" },
];

const SOURCE_ICONS: Record<string, React.ElementType> = {
  notion: FileText,
  slack: MessageSquare,
  "google-docs": FileText,
  browser: Globe,
};

function usePomodoroTimer(initialMinutes: number) {
  const [seconds, setSeconds] = useState(initialMinutes * 60);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => setSeconds(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(iv);
  }, [running]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return { display: `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`, running, toggle: () => setRunning(r => !r), pct: (seconds / (initialMinutes * 60)) * 100 };
}

export default function ActivityPage() {
  const timer = usePomodoroTimer(47); // 47 min remaining on 90-min block
  const upcomingToday = MOCK_SOURCE_EVENTS.filter(e => e.date === "2026-04-18").slice(0, 3);

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Activity Mode</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time focus tracking</p>
        </div>

        {/* Current focus */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Active Block</span>
              </div>
              <h2 className="text-lg font-bold text-emerald-900">{CURRENT_ACTIVITY.scheduled.title}</h2>
              <p className="text-sm text-emerald-700 mt-0.5">From Notion · Deep work</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-mono font-bold text-emerald-800">{timer.display}</div>
              <div className="text-xs text-emerald-600 mt-1">remaining</div>
            </div>
          </div>

          {/* Timer bar */}
          <div className="mt-4 h-2 w-full rounded-full bg-emerald-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
              style={{ width: `${100 - timer.pct}%` }}
            />
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={timer.toggle}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              {timer.running ? "Pause" : "Resume"}
            </button>
            <button type="button" className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
              Mark done
            </button>
          </div>
        </div>

        {/* Alignment */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-900">Focus alignment</span>
            <span className="ml-auto text-xs font-bold text-amber-700">{CURRENT_ACTIVITY.alignment}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-amber-200">
            <div className="h-full rounded-full bg-amber-500" style={{ width: `${CURRENT_ACTIVITY.alignment}%` }} />
          </div>
          <div className="mt-3 text-xs text-amber-800">
            <span className="font-semibold">Detected:</span> {CURRENT_ACTIVITY.detected.title} — browser history shows social media browsing during scheduled deep work block.
          </div>
        </div>

        {/* Browser activity */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Last 30 min — browser activity</h3>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {BROWSER_ACTIVITY.map((a, i) => (
              <div key={a.site} className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t border-slate-100")}>
                <span className="text-lg">{a.icon}</span>
                <span className="flex-1 text-sm text-slate-700">{a.site}</span>
                <span className="text-xs text-slate-400">{a.duration}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  a.category === "work" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                )}>
                  {a.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Upcoming today</h3>
          <div className="space-y-2">
            {upcomingToday.map(ev => {
              const Icon = SOURCE_ICONS[ev.source] ?? Globe;
              return (
                <div key={ev.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100">
                    <Icon className="size-4 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800">{ev.title}</div>
                    <div className="text-xs text-slate-400">{ev.time} · {ev.duration}min</div>
                  </div>
                  <span className="text-[10px] text-slate-400 capitalize">{ev.source}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
