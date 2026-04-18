"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Plus,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Check,
  X,
  TrendingUp,
  CalendarDays,
  AlertTriangle,
  BarChart3,
  Search,
  RefreshCw,
  FileText,
  MessageSquare,
  Globe,
  ChevronDown,
  ChevronUp,
  Zap,
  Unplug,
  PlugZap,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_DATA_SOURCES, type SourceId } from "@/lib/mock/data";
import { useSourceConnections } from "@/lib/client/source-connections";

interface Rule {
  id: string;
  title: string;
  body: string;
  priority: number;
  enabled: boolean;
  source: "user" | "agent";
  tags?: string[];
}

async function fetchRules(): Promise<Rule[]> {
  const res = await fetch("/api/rules");
  if (!res.ok) return [];
  return res.json();
}

/* ── Quick-action chips ─────────────────────────────────────────────────── */
const QUICK: Array<{
  icon: React.ElementType;
  label: string;
  prompt: string;
  color: string;
}> = [
  {
    icon: TrendingUp,
    label: "Find bottlenecks",
    prompt:
      "Analyse today's schedule: find bottlenecks, rule violations, and conflicts. Use render_day_timeline and find_conflicts widgets.",
    color: "text-brand-600",
  },
  {
    icon: CalendarDays,
    label: "Today's timeline",
    prompt: "Show me today's full timeline using render_day_timeline.",
    color: "text-sky-600",
  },
  {
    icon: AlertTriangle,
    label: "Spot conflicts",
    prompt: "Find all scheduling conflicts today and show them as conflict cards.",
    color: "text-amber-600",
  },
  {
    icon: BarChart3,
    label: "Workload check",
    prompt: "Show my workload summary for today using render_load.",
    color: "text-violet-600",
  },
  {
    icon: ShieldCheck,
    label: "Audit rules",
    prompt: "List my active rules and check if today's calendar violates any of them.",
    color: "text-emerald-600",
  },
  {
    icon: Search,
    label: "Find free slot",
    prompt:
      "Find free slots in my schedule today where I could add a 1-hour deep work session.",
    color: "text-rose-600",
  },
  {
    icon: RefreshCw,
    label: "Sync all signals",
    prompt:
      "Fetch signals from all connected sources: emails, Slack, and health stats.",
    color: "text-orange-500",
  },
  {
    icon: Zap,
    label: "Full briefing",
    prompt:
      "Give me a full briefing: today's timeline, bottlenecks, conflicts, rule violations, and top 3 actionable fixes.",
    color: "text-brand-700",
  },
];

const SRC_ICON: Record<string, React.ElementType> = {
  notion: FileText,
  slack: MessageSquare,
  "google-docs": FileText,
  browser: Globe,
};

/* ── Priority indicator ─────────────────────────────────────────────────── */
function PriorityBar({ priority }: { priority: number }) {
  const filled = priority >= 8 ? 3 : priority >= 5 ? 2 : 1;
  return (
    <span className="flex gap-0.5 shrink-0 items-center" title={`Priority ${priority}`}>
      {[1, 2, 3].map((s) => (
        <span
          key={s}
          className={cn(
            "inline-block h-1.5 w-2.5 rounded-sm",
            s <= filled ? "bg-brand-600" : "bg-surface-border"
          )}
        />
      ))}
    </span>
  );
}

/* ── Rule row ───────────────────────────────────────────────────────────── */
interface RuleRowProps {
  rule: Rule;
  onToggle: (id: string, enabled: boolean) => void;
  onSave: (id: string, patch: { title: string; body: string }) => void;
}

function RuleRow({ rule, onToggle, onSave }: RuleRowProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(rule.title);
  const [body, setBody] = useState(rule.body);

  const save = () => {
    onSave(rule.id, { title, body });
    setEditing(false);
  };
  const cancel = () => {
    setTitle(rule.title);
    setBody(rule.body);
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-2 transition-all",
        rule.enabled
          ? "border-surface-border bg-white hover:border-brand-200"
          : "border-surface-border/50 bg-surface-base opacity-50"
      )}
    >
      {editing ? (
        <div className="space-y-1.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-surface-border bg-surface-base px-2 py-1 text-[11px] text-ink focus:outline-none focus:ring-1 focus:ring-brand-600/30"
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[44px] resize-y text-[11px]"
          />
          <div className="flex gap-1">
            <Button size="sm" className="h-5 rounded px-2 text-[10px]" onClick={save}>
              <Check className="size-2.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 rounded px-2 text-[10px]"
              onClick={cancel}
            >
              <X className="size-2.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-1.5">
          <PriorityBar priority={rule.priority} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-ink leading-tight truncate">
              {rule.title}
            </p>
            <p className="text-[10px] text-ink-subtle leading-snug mt-0.5 line-clamp-2">
              {rule.body}
            </p>
            {rule.source === "agent" && (
              <span className="mt-1 inline-block text-[9px] font-semibold text-brand-600 bg-brand-50 rounded px-1">
                AI
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              className="text-ink-faint hover:text-ink p-0.5 rounded"
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-2.5" />
            </button>
            <button
              type="button"
              className={cn(
                "p-0.5 rounded transition-colors",
                rule.enabled ? "text-brand-600" : "text-ink-faint hover:text-ink"
              )}
              onClick={() => onToggle(rule.id, !rule.enabled)}
            >
              {rule.enabled ? (
                <ToggleRight className="size-3.5" />
              ) : (
                <ToggleLeft className="size-3.5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Section header ─────────────────────────────────────────────────────── */
function SectionHeader({
  label,
  open,
  onToggle,
  right,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  right?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between px-3 py-2 border-b border-surface-border bg-surface-base hover:bg-surface-base/80 transition-colors"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {right}
        {open ? (
          <ChevronUp className="size-3 text-ink-faint" />
        ) : (
          <ChevronDown className="size-3 text-ink-faint" />
        )}
      </div>
    </button>
  );
}

/* ── Main export ────────────────────────────────────────────────────────── */
export function RulesRail({
  onSend,
}: {
  onSend?: (text: string) => void;
}) {
  const queryClient = useQueryClient();
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["rules"],
    queryFn: fetchRules,
    staleTime: 30_000,
  });

  const [actionsOpen, setActionsOpen] = useState(true);
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(true);
  const { connections, revoke, reconnect } = useSourceConnections();
  const [revokeConfirm, setRevokeConfirm] = useState<SourceId | null>(null);

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  const toggle = async (id: string, enabled: boolean) => {
    await fetch(`/api/rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    void queryClient.invalidateQueries({ queryKey: ["rules"] });
  };

  const save = async (id: string, patch: { title: string; body: string }) => {
    await fetch(`/api/rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    void queryClient.invalidateQueries({ queryKey: ["rules"] });
  };

  const addRule = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), body: newBody.trim(), source: "user" }),
    });
    setNewTitle("");
    setNewBody("");
    setAdding(false);
    void queryClient.invalidateQueries({ queryKey: ["rules"] });
  };

  const enabled = rules.filter((r) => r.enabled);
  const disabled = rules.filter((r) => !r.enabled);

  return (
    <div className="flex h-full flex-col overflow-y-auto text-[12px]">

      {/* ── Quick actions ── */}
      <SectionHeader
        label="Actions"
        open={actionsOpen}
        onToggle={() => setActionsOpen((v) => !v)}
      />
      {actionsOpen && (
        <div className="p-2 space-y-1">
          {QUICK.map(({ icon: Icon, label, prompt, color }) => (
            <button
              key={label}
              type="button"
              disabled={!onSend}
              onClick={() => onSend?.(prompt)}
              className="group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-base disabled:opacity-40"
            >
              <Icon className={cn("size-3.5 shrink-0", color)} />
              <span className="text-[11px] font-medium text-ink">{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Connected sources ── */}
      <SectionHeader
        label="Sources"
        open={sourcesOpen}
        onToggle={() => setSourcesOpen((v) => !v)}
      />
      {sourcesOpen && (
        <div className="p-2 space-y-1">
          {MOCK_DATA_SOURCES.map((src) => {
            const connected = connections[src.id as SourceId] ?? true;
            const confirming = revokeConfirm === src.id;
            return (
              <div
                key={src.id}
                className={cn(
                  "group flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors",
                  connected ? "hover:bg-surface-base" : "opacity-60"
                )}
              >
                <div
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded text-[9px] font-bold transition-all",
                    connected ? src.color : "bg-surface-border text-ink-faint"
                  )}
                >
                  {src.abbr}
                </div>
                <span className={cn("flex-1 truncate text-[11px] font-medium", connected ? "text-ink" : "text-ink-faint line-through")}>
                  {src.label}
                </span>

                {connected ? (
                  <>
                    <span className="flex items-center gap-1 text-[10px] text-ink-faint shrink-0 group-hover:hidden">
                      <span className="size-1.5 rounded-full bg-brand-500 inline-block" />
                      {src.eventCount}
                    </span>
                    {confirming ? (
                      <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => { revoke(src.id as SourceId); setRevokeConfirm(null); }}
                          className="text-[10px] font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded px-1.5 py-0.5 transition-colors"
                        >
                          Yes, revoke
                        </button>
                        <button
                          type="button"
                          onClick={() => setRevokeConfirm(null)}
                          className="text-[10px] text-ink-faint hover:text-ink p-0.5 rounded"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRevokeConfirm(src.id as SourceId)}
                        className="hidden group-hover:flex items-center gap-1 text-[10px] text-ink-faint hover:text-red-500 transition-colors shrink-0"
                        title="Revoke access"
                      >
                        <Unplug className="size-3" />
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => reconnect(src.id as SourceId)}
                    className="flex items-center gap-1 text-[10px] font-medium text-brand-600 hover:text-brand-700 transition-colors shrink-0"
                    title="Reconnect"
                  >
                    <PlugZap className="size-3" />
                    Connect
                  </button>
                )}
              </div>
            );
          })}
          <button
            type="button"
            disabled={!onSend}
            onClick={() => onSend?.("Fetch signals from all connected sources: emails, Slack, and health stats.")}
            className="flex items-center gap-1.5 mt-1 px-2 text-[11px] font-medium text-brand-600 hover:text-brand-700 transition-colors disabled:opacity-40"
          >
            <RefreshCw className="size-3" />
            Sync all
          </button>
        </div>
      )}

      {/* ── Rules ── */}
      <SectionHeader
        label={`Rules · ${enabled.length} active`}
        open={rulesOpen}
        onToggle={() => setRulesOpen((v) => !v)}
        right={
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setRulesOpen(true);
              setAdding((v) => !v);
            }}
            className="rounded p-0.5 text-ink-faint hover:text-brand-600 hover:bg-brand-50 transition-colors"
            title="Add rule"
          >
            <Plus className="size-3" />
          </button>
        }
      />
      {rulesOpen && (
        <div className="flex-1 p-2 space-y-1.5">
          {isLoading && (
            <p className="text-[10px] text-ink-faint px-1 py-2">Loading…</p>
          )}

          {adding && (
            <div className="rounded-lg border-2 border-dashed border-brand-200 bg-brand-50/50 p-2 space-y-1.5">
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Rule title…"
                className="w-full rounded border border-surface-border bg-white px-2 py-1 text-[11px] text-ink focus:outline-none focus:ring-1 focus:ring-brand-600/30"
              />
              <Textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Describe the rule…"
                className="min-h-[40px] resize-y text-[11px]"
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className="h-5 rounded px-2 text-[10px]"
                  onClick={() => void addRule()}
                >
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 rounded px-2 text-[10px]"
                  onClick={() => setAdding(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {enabled.length === 0 && !isLoading && !adding && (
            <p className="text-[10px] text-ink-faint px-1 py-2 leading-relaxed">
              No active rules. Add one or ask the agent.
            </p>
          )}

          <div className="space-y-1">
            {enabled.map((r) => (
              <div key={r.id} className="group">
                <RuleRow
                  rule={r}
                  onToggle={(id, en) => void toggle(id, en)}
                  onSave={(id, p) => void save(id, p)}
                />
              </div>
            ))}
          </div>

          {disabled.length > 0 && (
            <>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-ink-faint px-1 pt-2">
                Disabled
              </p>
              <div className="space-y-1">
                {disabled.map((r) => (
                  <div key={r.id} className="group">
                    <RuleRow
                      rule={r}
                      onToggle={(id, en) => void toggle(id, en)}
                      onSave={(id, p) => void save(id, p)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
