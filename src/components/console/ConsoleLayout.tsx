"use client";

import { useState, useCallback } from "react";
import { Flame } from "lucide-react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { RulesRail } from "./RulesRail";
import { Thread } from "./Thread";
import { TodayRail } from "./TodayRail";
import { MOCK_METRICS } from "@/lib/mock/data";

export function ConsoleLayout() {
  const today = new Date().toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // Shared `send` function — Thread provides it; sidebar consumes it
  const [sendFn, setSendFn] = useState<((text: string) => void) | null>(null);

  const handleSendReady = useCallback((fn: (text: string) => void) => {
    setSendFn(() => fn);
  }, []);

  return (
    <QueryProvider>
      <div className="flex h-full min-h-0 flex-col bg-surface-base">
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-surface-border bg-white px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-2 rounded-full bg-brand-600 animate-pulse" />
            <span className="text-sm font-semibold text-ink">{today}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1">
            <Flame className="size-3.5 text-brand-600" />
            <span className="text-xs font-semibold text-brand-700">
              {MOCK_METRICS.streakDays} day streak
            </span>
          </div>
        </div>

        {/* 3-column body */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left: Actions + Sources + Rules */}
          <div className="w-56 shrink-0 border-r border-surface-border bg-white flex flex-col overflow-hidden">
            <RulesRail onSend={sendFn ?? undefined} />
          </div>

          {/* Center: Thread */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface-base">
            <Thread onSendReady={handleSendReady} />
          </div>

          {/* Right: Today */}
          <div className="w-72 shrink-0 border-l border-surface-border bg-white flex flex-col overflow-hidden">
            <TodayRail />
          </div>
        </div>
      </div>
    </QueryProvider>
  );
}
