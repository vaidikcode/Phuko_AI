"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MessageSquare, CalendarDays, BookOpen, Wrench, ChevronDown, ChevronUp, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const NAV = [
  { href: "/", label: "Coach", icon: MessageSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/rules", label: "Rules", icon: BookOpen },
  { href: "/tools", label: "Tools", icon: Wrench },
];

export function Sidebar() {
  const pathname = usePathname();
  const [jobsOpen, setJobsOpen] = useState(false);
  const [jobBusy, setJobBusy] = useState<"hourly" | "daily" | null>(null);

  async function runJob(kind: "hourly" | "daily") {
    setJobBusy(kind);
    try {
      await fetch(`/api/runs/${kind}`, { method: "POST" });
    } finally {
      setJobBusy(null);
    }
  }

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="px-4 py-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Phuko</div>
        <div className="text-lg font-semibold text-slate-900">Schedule OS</div>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="size-4 shrink-0 opacity-80" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-100 p-2">
        <button
          type="button"
          onClick={() => setJobsOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        >
          <span>Background jobs</span>
          {jobsOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
        {jobsOpen && (
          <div className="mt-1 space-y-1 px-1 pb-2">
            <p className="px-1 text-[10px] leading-snug text-slate-400">
              Hourly job scans the <strong>whole local day</strong> for bottlenecks vs rules; daily reflects on the prior
              day. Trigger manually if you need a refresh.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-full justify-start gap-1 text-[11px] font-normal text-slate-600"
              disabled={jobBusy !== null}
              onClick={() => void runJob("hourly")}
            >
              <Play className="size-3" />
              {jobBusy === "hourly" ? "Running…" : "Run day scan (hourly)"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-full justify-start gap-1 text-[11px] font-normal text-slate-600"
              disabled={jobBusy !== null}
              onClick={() => void runJob("daily")}
            >
              <Play className="size-3" />
              {jobBusy === "daily" ? "Running…" : "Run daily job"}
            </Button>
          </div>
        )}
        <div className="px-2 py-2 text-[10px] text-slate-400">LLM: {process.env.NEXT_PUBLIC_LLM_PROVIDER ?? "gemini"}</div>
      </div>
    </aside>
  );
}
