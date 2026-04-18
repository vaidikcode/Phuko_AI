"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { loadSessionUser } from "@/lib/client/user-session";
import { MOCK_METRICS } from "@/lib/mock/data";
import { ConsistencyGraph } from "@/components/dashboard/ConsistencyGraph";
import { VitalStats } from "@/components/dashboard/VitalStats";
import { PointsGrid } from "@/components/dashboard/PointsGrid";
import { RelationshipsPanel } from "@/components/dashboard/RelationshipsPanel";
import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { DataSourcesPanel } from "@/components/dashboard/DataSourcesPanel";
import { MetricModal } from "@/components/dashboard/MetricModal";

type ModalState = { metric: string; value: number; max: number } | null;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const user = typeof window !== "undefined" ? loadSessionUser() : null;
  const name = user?.displayName ?? "there";
  const [modal, setModal] = useState<ModalState>(null);

  const openModal = (metric: string, value: number, max: number) => setModal({ metric, value, max });

  return (
    <>
      <div className="flex h-full min-h-0 overflow-hidden">
        {/* Middle — main stats */}
        <div className="flex-1 min-w-0 overflow-y-auto px-6 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{greeting()}, {name}</h1>
              <p className="text-sm text-slate-500 mt-0.5">Here's your life dashboard for today.</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2">
              <Flame className="size-4 text-amber-500" />
              <span className="text-sm font-bold text-amber-700">{MOCK_METRICS.streakDays} day streak</span>
            </div>
          </div>

          <ConsistencyGraph />
          <VitalStats onMetricClick={openModal} />
          <PointsGrid onMetricClick={openModal} />
          <RelationshipsPanel onMetricClick={openModal} />
          <DataSourcesPanel />
          <div className="h-8" />
        </div>

        {/* Right — calendar */}
        <div className="w-72 shrink-0 border-l border-slate-200 bg-white overflow-y-auto px-4 py-6">
          <CalendarWidget />
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
