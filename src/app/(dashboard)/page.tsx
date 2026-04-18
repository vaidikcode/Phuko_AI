"use client";

import { useState } from "react";
import {
  Flame, Zap, Brain, Clock,
  TrendingUp, Activity, BarChart2, Users,
  ArrowRight,
} from "lucide-react";
import { loadSessionUser } from "@/lib/client/user-session";
import { MOCK_METRICS, MOCK_POINTS } from "@/lib/mock/data";
import { ConsistencyGraph } from "@/components/dashboard/ConsistencyGraph";
import { VitalStats } from "@/components/dashboard/VitalStats";
import { PointsGrid } from "@/components/dashboard/PointsGrid";
import { RelationshipsPanel } from "@/components/dashboard/RelationshipsPanel";
import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { DataSourcesPanel } from "@/components/dashboard/DataSourcesPanel";
import { MetricModal } from "@/components/dashboard/MetricModal";
import { cn } from "@/lib/utils";
import Link from "next/link";

type ModalState = { metric: string; value: number; max: number } | null;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function LiveDot({ color = "bg-nb-green" }: { color?: string }) {
  return (
    <span className="relative flex size-2.5">
      <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", color)} />
      <span className={cn("relative inline-flex size-2.5 rounded-full border-[1.5px] border-black", color)} />
    </span>
  );
}

function Marquee({ items, bg = "bg-black text-white" }: { items: string[]; bg?: string }) {
  const repeated = [...items, ...items, ...items, ...items];
  return (
    <div className={cn("overflow-hidden border-y-[3px] border-black py-3", bg)}>
      <div className="flex animate-marquee whitespace-nowrap w-max">
        {repeated.map((t, i) => (
          <span key={i} className="inline-block mx-8 text-lg font-black uppercase tracking-widest">
            {t} <span className="text-nb-yellow">★</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* Quick-action chip ── */
function ActionChip({
  icon: Icon, label, href, color, iconColor,
}: {
  icon: typeof Zap; label: string; href: string; color: string; iconColor: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-xl border-[3px] border-black px-4 py-3 shadow-nb-sm font-black text-sm transition-all",
        "hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-nb",
        "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        color
      )}
    >
      <Icon className={cn("size-4 shrink-0", iconColor)} />
      <span>{label}</span>
      <ArrowRight className={cn("size-3.5 ml-auto", iconColor, "opacity-50")} />
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const user = typeof window !== "undefined" ? loadSessionUser() : null;
  const name = user?.displayName?.split(" ")[0] ?? "there";
  const [modal, setModal] = useState<ModalState>(null);

  const openModal = (metric: string, value: number, max: number) => setModal({ metric, value, max });

  const totalLifeScore = Math.round(
    Object.values(MOCK_POINTS).reduce((sum, p) => sum + (p.value / p.max) * 100, 0) /
      Object.keys(MOCK_POINTS).length
  );

  return (
    <>
      <div className="flex h-full min-h-0 overflow-hidden">
        {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 overflow-y-auto bg-nb-cream">

          {/* HERO ──────────────────────────────────────────────────────────── */}
          <div className="border-b-[3px] border-black">
            {/* Top bar */}
            <div className="flex items-center justify-between bg-black px-5 py-2.5">
              <div className="flex items-center gap-2">
                <LiveDot color="bg-nb-green" />
                <span className="text-xs font-black uppercase tracking-widest text-white">Schedule OS</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border-[2px] border-nb-yellow/40 bg-nb-yellow/10 px-3 py-0.5">
                <Flame className="size-3.5 text-nb-yellow" />
                <span className="text-xs font-black text-nb-yellow">{MOCK_METRICS.streakDays} day streak</span>
              </div>
            </div>

            {/* Hero content: 2-col */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] bg-nb-blue">
              {/* Left: greeting */}
              <div className="relative overflow-hidden px-8 py-10 dot-pattern-white">
                <Zap className="absolute -bottom-6 -right-6 size-40 text-white/5 rotate-12" />
                <div className="inline-flex items-center gap-2 rounded-full border-[3px] border-black bg-nb-yellow px-4 py-1.5 shadow-nb-sm mb-5">
                  <LiveDot color="bg-black" />
                  <span className="text-xs font-black uppercase tracking-widest text-black">Live overview</span>
                </div>
                <h1 className="text-5xl font-black text-white leading-[1.0] uppercase tracking-tight mb-3">
                  {greeting()},<br />
                  <span className="text-nb-yellow">{name}.</span>
                </h1>
                <p className="text-base font-bold text-white/60 mb-8 max-w-sm">
                  {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })} —
                  your day is loaded and ready.
                </p>

                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-2 max-w-sm">
                  <ActionChip icon={Activity}  href="/activity"  label="Activity"  color="bg-nb-coral   text-white" iconColor="text-white" />
                  <ActionChip icon={BarChart2} href="/feedback"  label="Feedback"  color="bg-nb-green   text-black" iconColor="text-black" />
                  <ActionChip icon={Zap}       href="/console"   label="Console"   color="bg-white      text-black" iconColor="text-black" />
                  <ActionChip icon={Users}     href="/calendar"  label="Calendar"  color="bg-nb-purple  text-black" iconColor="text-black" />
                </div>
              </div>

              {/* Right: stat tiles */}
              <div className="flex flex-col border-l-[3px] border-black min-w-[200px]">
                {/* Energy */}
                <div className="flex-1 flex flex-col justify-between bg-nb-yellow border-b-[3px] border-black px-5 py-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/50">Energy</span>
                    <Zap className="size-4 text-black/40" />
                  </div>
                  <div className="text-5xl font-black text-black leading-none">{MOCK_METRICS.energy}</div>
                  <div className="text-xs font-bold text-black/50 mt-1">/ 100</div>
                  <div className="mt-2 h-2 w-full rounded-full bg-black/10 overflow-hidden">
                    <div className="h-full rounded-full bg-black/30" style={{ width: `${MOCK_METRICS.energy}%` }} />
                  </div>
                </div>

                {/* Attention */}
                <div className="flex-1 flex flex-col justify-between bg-nb-purple border-b-[3px] border-black px-5 py-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/50">Attention</span>
                    <Brain className="size-4 text-black/40" />
                  </div>
                  <div className="text-5xl font-black text-black leading-none">{MOCK_METRICS.attentionScore}</div>
                  <div className="text-xs font-bold text-black/50 mt-1">/ 100</div>
                  <div className="mt-2 h-2 w-full rounded-full bg-black/10 overflow-hidden">
                    <div className="h-full rounded-full bg-black/30" style={{ width: `${MOCK_METRICS.attentionScore}%` }} />
                  </div>
                </div>

                {/* Life score */}
                <div className="flex-1 flex flex-col justify-between bg-nb-green px-5 py-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/50">Life score</span>
                    <TrendingUp className="size-4 text-black/40" />
                  </div>
                  <div className="text-5xl font-black text-black leading-none">{totalLifeScore}%</div>
                  <div className="text-xs font-bold text-black/50 mt-1">avg across all</div>
                  <div className="mt-2 h-2 w-full rounded-full bg-black/10 overflow-hidden">
                    <div className="h-full rounded-full bg-black/30" style={{ width: `${totalLifeScore}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MARQUEE ───────────────────────────────────────────────────────── */}
          <Marquee
            items={["Consistency tracked", "Vitals monitored", "Life scores updated", "Relationships synced", "Sources connected"]}
            bg="bg-black text-white"
          />

          {/* PANELS ─────────────────────────────────────────────────────────── */}
          <div className="px-5 py-5 space-y-5">
            {/* Next event strip */}
            <div className="flex items-center gap-4 rounded-2xl border-[3px] border-black bg-white px-5 py-4 shadow-nb">
              <div className="flex size-10 items-center justify-center rounded-xl border-[2px] border-black bg-nb-blue shadow-nb-sm shrink-0">
                <Clock className="size-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black uppercase tracking-widest text-black/40">Up next</div>
                <div className="font-black text-black truncate">{MOCK_METRICS.nextEvent.title}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="size-2 rounded-full bg-nb-green animate-pulse" />
                <span className="text-sm font-black text-black">{MOCK_METRICS.nextEvent.minutesAway} min</span>
              </div>
            </div>

            <ConsistencyGraph />
            <VitalStats onMetricClick={openModal} />
            <PointsGrid onMetricClick={openModal} />
            <RelationshipsPanel onMetricClick={openModal} />
            <DataSourcesPanel />
            <div className="h-6" />
          </div>
        </div>

        {/* ── RIGHT SIDEBAR — Calendar ──────────────────────────────────────── */}
        <div className="w-72 shrink-0 overflow-y-auto border-l-[3px] border-black bg-white">
          <div className="border-b-[3px] border-black bg-nb-yellow px-4 py-3">
            <span className="text-sm font-black text-black uppercase tracking-tight">Calendar</span>
          </div>
          <div className="p-4">
            <CalendarWidget />
          </div>
        </div>
      </div>

      {modal && (
        <MetricModal
          metric={modal.metric}
          value={modal.value}
          max={modal.max}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
