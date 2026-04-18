"use client";

import {
  Star, TrendingUp, TrendingDown, CheckCircle2, XCircle,
  Activity, CircleDollarSign, HeartHandshake, Zap, Flame,
  CalendarDays, BarChart2, AlertCircle,
} from "lucide-react";
import { MOCK_POINTS, MOCK_METRICS, MOCK_RELATIONSHIPS } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

/* ── Data ─────────────────────────────────────────────────────────────────── */
const DAILY_FEEDBACK = {
  date: "April 17, 2026",
  overallScore: 68,
  summary:
    "Solid knowledge day, but money and health tasks were deprioritised again. Your focus blocks were interrupted by 3 unplanned Slack messages — worth creating a DND rule for deep work hours.",
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
    { Icon: Activity,        color: "bg-nb-blue",   text: "text-white", text2: "text-white/80", label: "Health fix",  body: "Schedule a 30-min walk tomorrow morning before standup to break the exercise streak." },
    { Icon: CircleDollarSign,color: "bg-nb-green",  text: "text-black", text2: "text-black/70", label: "Money fix",   body: "Block 60 min tomorrow at 11am exclusively for Investor Deck — move Dev Sync 30 min earlier." },
    { Icon: HeartHandshake,  color: "bg-nb-purple", text: "text-black", text2: "text-black/70", label: "People fix",  body: "Send one message to family today. Even a quick check-in resets the relationship clock." },
  ],
};

const WEEK_SCORES = [72, 68, 85, 55, 78, 63, 68];
const WEEK_DAYS   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const METRIC_META: Record<string, { bg: string; text: string; icon: typeof Activity }> = {
  health:    { bg: "bg-nb-coral",  text: "text-white", icon: Activity },
  knowledge: { bg: "bg-nb-purple", text: "text-black", icon: BarChart2 },
  money:     { bg: "bg-nb-green",  text: "text-black", icon: CircleDollarSign },
  work:      { bg: "bg-nb-blue",   text: "text-white", icon: Zap },
};

/* ── Marquee ──────────────────────────────────────────────────────────────── */
function Marquee({ items, bg = "bg-black text-white" }: { items: string[]; bg?: string }) {
  const repeated = [...items, ...items, ...items, ...items];
  return (
    <div className={cn("overflow-hidden border-y-[3px] border-black py-3.5", bg)}>
      <div className="flex animate-marquee whitespace-nowrap w-max">
        {repeated.map((t, i) => (
          <span key={i} className="inline-block mx-8 text-xl font-black uppercase tracking-widest">
            {t} <span className="text-nb-yellow">★</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Score ring ───────────────────────────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const R    = 82;
  const circ = 2 * Math.PI * R;
  const dash = circ * (score / 100);
  return (
    <div className="relative flex items-center justify-center" style={{ width: 196, height: 196 }}>
      <svg width={196} height={196} className="-rotate-90 absolute inset-0">
        <circle cx={98} cy={98} r={R} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={14} />
        <circle
          cx={98} cy={98} r={R}
          fill="none"
          stroke="#FFD93D"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center">
        <span className="font-black text-[3.5rem] leading-none text-black">{score}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-black/50">/ 100</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function FeedbackPage() {
  const today  = new Date();
  const dayIdx = (today.getDay() + 6) % 7;
  const maxBar = Math.max(...WEEK_SCORES);

  return (
    <div className="min-h-full overflow-y-auto bg-nb-cream selection:bg-black selection:text-nb-yellow">

      {/* ── STICKY STATUS BAR ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b-[3px] border-black bg-black px-5 py-2.5">
        <div className="flex items-center gap-3">
          <Star className="size-3.5 fill-nb-yellow text-nb-yellow" />
          <span className="text-xs font-black uppercase tracking-widest text-white">Daily Feedback</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border-[2px] border-nb-yellow/40 bg-nb-yellow/10 px-3 py-0.5">
            <Flame className="size-3.5 text-nb-yellow" />
            <span className="text-xs font-black text-nb-yellow">{MOCK_METRICS.streakDays} day streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-white/50" />
            <span className="text-xs font-bold text-white/50">{DAILY_FEEDBACK.date}</span>
          </div>
        </div>
      </div>

      {/* ── HERO: score + week chart ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] border-b-[3px] border-black">

        {/* Score ring — yellow background */}
        <div className="flex flex-col items-center justify-center gap-4 bg-nb-yellow border-r-[3px] border-black px-10 py-10">
          <div className="text-xs font-black uppercase tracking-widest text-black/50 mb-2">Overall day score</div>
          <ScoreRing score={DAILY_FEEDBACK.overallScore} />
          <div className={cn(
            "rounded-2xl border-[3px] border-black px-5 py-2 shadow-nb-sm font-black text-sm uppercase tracking-wide",
            DAILY_FEEDBACK.overallScore >= 70 ? "bg-nb-green text-black" :
            DAILY_FEEDBACK.overallScore >= 50 ? "bg-white text-black"  : "bg-nb-coral text-white"
          )}>
            {DAILY_FEEDBACK.overallScore >= 70 ? "Strong day" :
             DAILY_FEEDBACK.overallScore >= 50 ? "Moderate"   : "Below average"}
          </div>
        </div>

        {/* Summary + week bars */}
        <div className="flex flex-col">
          {/* Summary */}
          <div className="flex-1 bg-white px-8 py-8 border-b-[3px] border-black">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="size-4 text-black" />
              <span className="text-xs font-black uppercase tracking-widest text-black/60">Summary</span>
            </div>
            <p className="text-lg font-bold text-black leading-relaxed max-w-xl">
              {DAILY_FEEDBACK.summary}
            </p>
          </div>

          {/* Week bars */}
          <div className="bg-nb-cream px-8 py-6">
            <div className="text-xs font-black uppercase tracking-widest text-black/50 mb-4">This week</div>
            <div className="flex items-end gap-2 h-20">
              {WEEK_SCORES.map((s, i) => {
                const isToday = i === dayIdx;
                const barColor = isToday ? "bg-nb-blue border-[2px] border-black shadow-nb-sm"
                  : s >= 70 ? "bg-nb-green border-[2px] border-black"
                  : s >= 50 ? "bg-nb-yellow border-[2px] border-black"
                  : "bg-nb-coral border-[2px] border-black";
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="w-full flex flex-col items-center">
                      {isToday && (
                        <span className="text-[9px] font-black text-nb-blue mb-1">{s}</span>
                      )}
                      <div
                        className={cn("w-full rounded-t-xl transition-all", barColor)}
                        style={{ height: `${(s / maxBar) * 68}px` }}
                      />
                    </div>
                    <span className={cn(
                      "text-[10px] font-black uppercase",
                      isToday ? "text-nb-blue" : "text-black/40"
                    )}>{WEEK_DAYS[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── MARQUEE ───────────────────────────────────────────────────────── */}
      <Marquee
        items={["Wins logged", "Misses flagged", "Athena recommends", "Metrics tracked", "Streak active"]}
        bg="bg-black text-white"
      />

      {/* ── WINS / MISSES ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border-b-[3px] border-black">

        {/* WINS — green */}
        <div className="border-r-[3px] border-black bg-nb-green p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex size-10 items-center justify-center rounded-xl border-[3px] border-black bg-black shadow-nb-sm">
              <CheckCircle2 className="size-5 text-nb-green" />
            </div>
            <span className="text-xl font-black text-black uppercase tracking-tight">Wins</span>
            <span className="ml-auto rounded-full border-[2px] border-black bg-black text-nb-green text-xs font-black px-2.5 py-0.5">
              {DAILY_FEEDBACK.wins.length}
            </span>
          </div>
          <ul className="space-y-3">
            {DAILY_FEEDBACK.wins.map((w, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-[2px] border-black bg-black shadow-nb-sm">
                  <span className="text-[9px] font-black text-nb-green">{i + 1}</span>
                </div>
                <p className="text-sm font-bold text-black leading-snug">{w}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* MISSES — coral */}
        <div className="bg-nb-coral p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex size-10 items-center justify-center rounded-xl border-[3px] border-black bg-black shadow-nb-sm">
              <XCircle className="size-5 text-nb-coral" />
            </div>
            <span className="text-xl font-black text-white uppercase tracking-tight">Misses</span>
            <span className="ml-auto rounded-full border-[2px] border-white/40 bg-black/20 text-white text-xs font-black px-2.5 py-0.5">
              {DAILY_FEEDBACK.misses.length}
            </span>
          </div>
          <ul className="space-y-3">
            {DAILY_FEEDBACK.misses.map((m, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-[2px] border-white/40 bg-black/20 shadow-nb-sm">
                  <span className="text-[9px] font-black text-white">{i + 1}</span>
                </div>
                <p className="text-sm font-bold text-white leading-snug">{m}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── RECOMMENDATIONS ───────────────────────────────────────────────── */}
      <div className="px-5 py-8 border-b-[3px] border-black bg-nb-cream">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="size-5 text-black" />
          <h3 className="text-xl font-black text-black uppercase tracking-tight">Athena recommends</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {DAILY_FEEDBACK.suggestions.map((s, i) => (
            <div
              key={i}
              className={cn(
                "rounded-2xl border-[3px] border-black p-6 shadow-nb transition-all",
                "hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-nb-md",
                s.color
              )}
            >
              <div className={cn(
                "mb-4 flex size-12 items-center justify-center rounded-xl border-[2px] border-black bg-black/15"
              )}>
                <s.Icon className={cn("size-6", s.text)} />
              </div>
              <div className={cn("text-xs font-black uppercase tracking-widest mb-2 opacity-60", s.text)}>
                {s.label}
              </div>
              <p className={cn("text-sm font-bold leading-relaxed", s.text2 ?? s.text)}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── MARQUEE 2 ─────────────────────────────────────────────────────── */}
      <Marquee
        items={["Health metrics", "Knowledge score", "Money score", "Work score", "Relationships"]}
        bg="bg-nb-yellow text-black"
      />

      {/* ── METRIC SNAPSHOT ───────────────────────────────────────────────── */}
      <div className="px-5 py-8">
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 className="size-5 text-black" />
          <h3 className="text-xl font-black text-black uppercase tracking-tight">Metric snapshot</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(MOCK_POINTS).map(([k, v]) => {
            const m = METRIC_META[k];
            const pct = Math.round((v.value / v.max) * 100);
            return (
              <div
                key={k}
                className={cn(
                  "rounded-2xl border-[3px] border-black p-5 shadow-nb transition-all",
                  "hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-nb-md",
                  m.bg
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("flex size-9 items-center justify-center rounded-xl border-[2px] border-black bg-black/15")}>
                    <m.icon className={cn("size-4", m.text)} />
                  </div>
                  {v.trend === "up"
                    ? <TrendingUp className={cn("size-4", m.text)} />
                    : <TrendingDown className={cn("size-4 opacity-60", m.text)} />
                  }
                </div>
                <div className={cn("text-xs font-black uppercase tracking-widest opacity-60 mb-1", m.text)}>{k}</div>
                <div className={cn("text-3xl font-black leading-none mb-1", m.text)}>{pct}%</div>
                <div className={cn("text-[11px] font-bold opacity-50", m.text)}>{v.value} / {v.max}</div>
                <div className="mt-3 h-2 w-full rounded-full border-[1px] border-black/20 bg-black/10 overflow-hidden">
                  <div className="h-full rounded-full bg-black/25 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className={cn("mt-2 text-xs font-black", v.delta > 0 ? "" : "opacity-60", m.text)}>
                  {v.delta > 0 ? "+" : ""}{v.delta} pts
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FOOTER STRIP ──────────────────────────────────────────────────── */}
      <div className="border-t-[3px] border-black bg-black px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flame className="size-4 text-nb-yellow" />
          <span className="text-xs font-black text-white">
            {MOCK_METRICS.streakDays} day streak · {MOCK_RELATIONSHIPS.length} relationships monitored
          </span>
        </div>
        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Athena AI</span>
      </div>
    </div>
  );
}
