"use client";

import { useState, useEffect } from "react";
import { Check, Plus, Trash2, Loader2, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

const PRIORITY_OPTIONS = [
  { id:"health",    label:"Health",        emoji:"💪" },
  { id:"work",      label:"Work",          emoji:"💼" },
  { id:"knowledge", label:"Knowledge",     emoji:"📚" },
  { id:"money",     label:"Money",         emoji:"💰" },
  { id:"relations", label:"Relationships", emoji:"❤️" },
];

const DEFAULT_RULES = [
  "No meetings before 10 am",
  "Protect 2 hours for deep work daily",
  "Exercise at least 5× per week",
  "1 hour of reading / learning per day",
  "No screens 30 min before sleep",
];

const SOURCES = [
  { id:"notion",      label:"Notion",        abbr:"N", color:"bg-gray-800"   },
  { id:"slack",       label:"Slack",         abbr:"S", color:"bg-violet-600" },
  { id:"google-docs", label:"Google Docs",   abbr:"G", color:"bg-blue-500"   },
  { id:"browser",     label:"Browser Hist.", abbr:"B", color:"bg-orange-500" },
];

export function RulesSetup({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>(1);

  // Step 1 state
  const [priorities, setPriorities] = useState<string[]>(["health","work","knowledge"]);
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("23:00");
  const [deepWorkHours, setDeepWorkHours] = useState("2");

  // Step 2 state
  const [rules, setRules] = useState<string[]>(DEFAULT_RULES);
  const [newRule, setNewRule] = useState("");

  // Step 3 state
  const [connectPhase, setConnectPhase] = useState<"idle"|"connecting"|"done">("idle");
  const [connectedCount, setConnectedCount] = useState(0);

  useEffect(() => {
    if (step !== 3 || connectPhase !== "idle") return;
    setConnectPhase("connecting");
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setConnectedCount(i);
      if (i >= SOURCES.length) {
        clearInterval(iv);
        setConnectPhase("done");
      }
    }, 600);
    return () => clearInterval(iv);
  }, [step, connectPhase]);

  const togglePriority = (id: string) =>
    setPriorities(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const addRule = () => {
    const r = newRule.trim();
    if (r) { setRules(prev => [...prev, r]); setNewRule(""); }
  };

  const removeRule = (i: number) => setRules(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-100 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Zap className="size-4" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Phuko</div>
              <div className="text-lg font-semibold text-slate-900">Set up your OS</div>
            </div>
            <div className="ml-auto flex gap-1.5">
              {([1,2,3] as Step[]).map(s => (
                <div
                  key={s}
                  className={cn(
                    "size-2 rounded-full transition-colors",
                    s === step ? "bg-emerald-600" : s < step ? "bg-emerald-300" : "bg-slate-200"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-8 py-7">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900">What matters most to you?</h2>
                <p className="mt-1 text-sm text-slate-500">Select your top priorities. Phuko will optimise your schedule around these.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePriority(p.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                      priorities.includes(p.id)
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-400/50"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <span>{p.emoji}</span>
                    {p.label}
                    {priorities.includes(p.id) && <Check className="size-3.5" />}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label:"Wake time",        value:wakeTime,      set:setWakeTime },
                  { label:"Sleep time",       value:sleepTime,     set:setSleepTime },
                  { label:"Deep work (hrs)",  value:deepWorkHours, set:setDeepWorkHours, type:"number" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                    <input
                      type={f.type ?? "time"}
                      value={f.value}
                      onChange={e => f.set(e.target.value)}
                      min={f.type === "number" ? "1" : undefined}
                      max={f.type === "number" ? "8" : undefined}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/25"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Your ground rules</h2>
                <p className="mt-1 text-sm text-slate-500">Rules Phuko will protect when planning your schedule. Edit or add your own.</p>
              </div>
              <ul className="space-y-2">
                {rules.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <div className="mt-0.5 size-4 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center">
                      <div className="size-1.5 rounded-full bg-emerald-600" />
                    </div>
                    <span className="flex-1 text-sm text-slate-700">{r}</span>
                    <button type="button" onClick={() => removeRule(i)} className="text-slate-300 hover:text-red-400 transition-colors">
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRule}
                  onChange={e => setNewRule(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addRule()}
                  placeholder="Add a rule…"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/25"
                />
                <button
                  type="button"
                  onClick={addRule}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Connect your data sources</h2>
                <p className="mt-1 text-sm text-slate-500">Phuko pulls events from your tools to build your full picture.</p>
              </div>
              <ul className="space-y-3">
                {SOURCES.map((s, i) => {
                  const done = connectedCount > i;
                  const active = connectedCount === i && connectPhase === "connecting";
                  return (
                    <li key={s.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white", s.color)}>
                        {s.abbr}
                      </div>
                      <span className="flex-1 text-sm font-medium text-slate-800">{s.label}</span>
                      {done ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <Check className="size-3.5" /> Connected
                        </span>
                      ) : active ? (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Loader2 className="size-3.5 animate-spin" /> Connecting…
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">Waiting…</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {connectPhase === "done" && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-800">
                  All sources connected — 11 events imported
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-8 py-5 flex justify-between items-center">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => (s - 1) as Step)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Back
            </button>
          ) : <div />}
          <button
            type="button"
            disabled={step === 3 && connectPhase !== "done"}
            onClick={() => {
              if (step < 3) { setStep(s => (s + 1) as Step); }
              else { onComplete(); }
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all",
              step === 3 && connectPhase !== "done"
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            {step === 3 ? "Enter Dashboard" : "Next"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
