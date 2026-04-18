"use client";

import { Star, TrendingUp, TrendingDown, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { MOCK_POINTS, MOCK_METRICS, MOCK_RELATIONSHIPS } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

const DAILY_FEEDBACK = {
  date: "April 17, 2026",
  overallScore: 68,
  summary: "Solid knowledge day, but money and health tasks were deprioritised again. Your focus blocks were interrupted by 3 unplanned Slack messages — worth creating a DND rule for deep work hours.",
  wins: [
    "Completed 2 deep work sessions (product spec, research)",
    "Consistent learning — 45 min reading block completed",
    "Mentor call with Dev — relationship score up 6pts",
  ],
  misses: [
    "Skipped workout (4th time this week → health score declining)",
    "Investor deck postponed again — money score down 15pts",
    "No family contact logged (5-day gap)",
  ],
  suggestions: [
    { icon:"💪", text:"Schedule a 30-min walk tomorrow morning before standup to break the exercise streak." },
    { icon:"💰", text:"Block 60 min tomorrow at 11am exclusively for Investor Deck — move Dev Sync 30 min earlier." },
    { icon:"❤️", text:"Send one message to family today. Even a quick check-in resets the relationship clock." },
  ],
};

const WEEK_SCORES = [72, 68, 85, 55, 78, 63, 68];
const WEEK_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function FeedbackPage() {
  const today = new Date();
  const dayIdx = (today.getDay() + 6) % 7; // Mon=0

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Daily Feedback</h1>
          <p className="text-sm text-slate-500 mt-0.5">Yesterday · {DAILY_FEEDBACK.date}</p>
        </div>

        {/* Overall score */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg width="80" height="80" className="-rotate-90">
                <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle cx="40" cy="40" r="32" fill="none"
                  stroke={DAILY_FEEDBACK.overallScore >= 70 ? "#10b981" : DAILY_FEEDBACK.overallScore >= 50 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="8"
                  strokeDasharray={`${(DAILY_FEEDBACK.overallScore / 100) * 2 * Math.PI * 32} ${2 * Math.PI * 32}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-slate-900">{DAILY_FEEDBACK.overallScore}</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Star className="size-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-semibold text-slate-900">Overall day score</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{DAILY_FEEDBACK.summary}</p>
            </div>
          </div>
        </div>

        {/* Week bar chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">This week</h3>
          <div className="flex items-end gap-2 h-20">
            {WEEK_SCORES.map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-full rounded-t-sm",
                    i === dayIdx ? "bg-emerald-600 ring-2 ring-emerald-300" : s >= 70 ? "bg-emerald-400" : s >= 50 ? "bg-amber-400" : "bg-red-400"
                  )}
                  style={{ height: `${s}%` }}
                />
                <span className="text-[10px] text-slate-400">{WEEK_DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wins & Misses */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-900 mb-3">
              <CheckCircle2 className="size-4" /> Wins
            </h3>
            <ul className="space-y-2">
              {DAILY_FEEDBACK.wins.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-emerald-800">
                  <div className="mt-0.5 size-3.5 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center">
                    <div className="size-1.5 rounded-full bg-white" />
                  </div>
                  {w}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-red-900 mb-3">
              <XCircle className="size-4" /> Misses
            </h3>
            <ul className="space-y-2">
              {DAILY_FEEDBACK.misses.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-red-800">
                  <div className="mt-0.5 size-3.5 shrink-0 rounded-full bg-red-400 flex items-center justify-center">
                    <div className="size-1.5 rounded-full bg-white" />
                  </div>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
            <AlertCircle className="size-4 text-slate-500" /> Phuko recommends
          </h3>
          <div className="space-y-3">
            {DAILY_FEEDBACK.suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <span className="text-lg shrink-0 mt-0.5">{s.icon}</span>
                <p className="text-sm text-slate-700 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Metric snapshot */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Metric snapshot</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(MOCK_POINTS).map(([k, v]) => (
              <div key={k} className="rounded-xl border border-slate-100 bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className="flex-1">
                  <div className="text-xs font-semibold capitalize text-slate-700">{k}</div>
                  <div className="text-sm font-bold text-slate-900">{v.value}/{v.max}</div>
                </div>
                {v.trend === "up"
                  ? <TrendingUp className="size-4 text-emerald-500" />
                  : <TrendingDown className="size-4 text-red-400" />
                }
              </div>
            ))}
          </div>
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
