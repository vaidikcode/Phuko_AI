import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { StructuredTool } from "@langchain/core/tools";
import type { AgentState } from "./state";
import { memoryStore } from "@/lib/memory";
import { ruleStore } from "@/lib/rules";
import { collectorTools } from "@/lib/tools/collectors";
import { calendarStore } from "@/lib/calendar/store";

// ── loadContext ──────────────────────────────────────────────────────────────

export async function loadContext(state: AgentState): Promise<Partial<AgentState>> {
  const [rules, priorDaily, lastHourly] = await Promise.all([
    ruleStore.listEnabled(),
    memoryStore.getYesterdayDaily(),
    memoryStore.getLastHourly(),
  ]);

  // Attach event logs for events in the current window so the agent can detect
  // patterns like repeated cancellations without having to call list_event_logs manually
  const windowEvents = await calendarStore.list({
    from: state.windowStart,
    to: state.windowEnd,
    status: ["confirmed", "tentative", "cancelled"],
  });

  const logPrefetchCap = state.kind === "hourly" ? 120 : 24;

  const eventLogsMap: Record<string, unknown[]> = {};
  await Promise.all(
    windowEvents.slice(0, logPrefetchCap).map(async (ev) => {
      try {
        const logs = await calendarStore.listLogs(ev.recurrenceParentId ?? ev.id);
        if (logs.length > 0) eventLogsMap[ev.id] = logs;
      } catch { /* skip */ }
    })
  );

  // Merge into collected so the system prompt can reference it
  const collected = {
    ...(state.collected ?? {}),
    event_logs_for_window: eventLogsMap,
  };

  return { rules, priorDaily: priorDaily ?? null, lastHourly: lastHourly ?? null, collected };
}

// ── collect ──────────────────────────────────────────────────────────────────

export async function collect(state: AgentState): Promise<Partial<AgentState>> {
  const windowStart = state.windowStart.toISOString();
  const windowEnd = state.windowEnd.toISOString();

  const results: Record<string, unknown> = {};

  for (const t of collectorTools) {
    try {
      const raw = await t.invoke({ windowStart, windowEnd });
      results[t.name] = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (err) {
      results[t.name] = { error: String(err) };
    }
  }

  // Pre-warm the load snapshot so it's available in the system prompt
  try {
    const loadSnapshot = await calendarStore.summarizeLoad(state.windowStart, state.windowEnd);
    results["load_snapshot"] = loadSnapshot;
  } catch {
    results["load_snapshot"] = { error: "unavailable" };
  }

  try {
    const pairs = await calendarStore.findConflicts(state.windowStart, state.windowEnd);
    results["conflicts_snapshot"] = {
      pairCount: pairs.length,
      pairs: pairs.slice(0, 40).map(([a, b]) => ({
        a: { id: a.id, title: a.title, start: a.startAt.toISOString(), end: a.endAt.toISOString() },
        b: { id: b.id, title: b.title, start: b.startAt.toISOString(), end: b.endAt.toISOString() },
      })),
    };
  } catch {
    results["conflicts_snapshot"] = { error: "unavailable" };
  }

  return { collected: results };
}

// ── buildSystemPrompt ─────────────────────────────────────────────────────────

export function buildSystemPrompt(state: AgentState): string {
  const rulesText =
    state.rules.length === 0
      ? "No active rules yet."
      : state.rules
          .map((r) => `[Priority ${r.priority}] ${r.title}: ${r.body}`)
          .join("\n");

  const priorDailyText = state.priorDaily
    ? `Yesterday's daily summary: ${state.priorDaily.summary}`
    : "No prior daily memory available.";

  const lastHourlyText = state.lastHourly
    ? `Last hourly summary: ${state.lastHourly.summary}`
    : "No prior hourly memory available.";

  const loadSnapshot = state.collected?.["load_snapshot"];
  const loadSnapshotText = loadSnapshot
    ? `\`\`\`json\n${JSON.stringify(loadSnapshot, null, 2)}\n\`\`\``
    : "No load snapshot available.";

  const collectedText = JSON.stringify(
    Object.fromEntries(Object.entries(state.collected ?? {}).filter(([k]) => k !== "load_snapshot")),
    null,
    2
  );

  return `You are **Phuko — schedule repair & leverage**. You are not a generic chatbot. You work from **real calendar data** (below + tools) to **find bottlenecks**, **check active rules**, **suggest concrete calendar fixes** (moves, buffers, focus blocks, breaks), and **call tools** when a change is justified.

Analysis window: **${state.windowStart.toISOString()}** → **${state.windowEnd.toISOString()}** (run kind: **${state.kind}**). For **hourly** runs this window is the **full calendar day** so you always see the whole day’s context.

## Continuity
${priorDailyText}
${lastHourlyText}

## Active rules (must influence your diagnosis)
${rulesText}

## Load snapshot (minutes, back-to-back, priorities)
${loadSnapshotText}

## Collected signals (events, email/slack/health placeholders, conflicts snapshot, event logs)
\`\`\`json
${collectedText}
\`\`\`

## What to look for (tie each finding to data)
- **Overlaps / double-booked time** — \`conflicts_snapshot\` or \`find_conflicts\`; say which event should move.
- **Overload** — too many meetings or deep_work minutes vs recovery; cite \`load_snapshot\` / event list.
- **Rule clashes** — events that contradict an active rule; quote the rule title and the conflicting event.
- **Churn** — cancellations/reschedules in \`event_logs_for_window\`; unstable blocks need simplification.
- **Gaps** — long wasteful holes vs “no focus time”; suggest **specific** blocks (title, type, energy, duration) with tools.
- **Energy / priority mismatch** — e.g. low-priority meetings eating peak hours.

## Your loop
1. **Ground** — You already have a full-day payload for hourly; still use tools if you need fresher detail (\`list_events\`, \`get_event\`, \`list_event_logs\`, etc.).
2. **Diagnose** — 2–5 crisp bullets: bottleneck → evidence (times, IDs, counts).
3. **Act** — Prefer **small, reversible** edits: \`update_event\`, \`create_event\` (buffers, focus, breaks), \`delete_event\` (soft cancel) when appropriate; \`annotate_event\` / \`complete_event\` for outcomes.
4. **Rules** — If you see a **stable pattern** that should become policy (e.g. “no meetings before 10”, “Friday afternoon = heads-down”), use \`create_rule\` or mention exact rule text for a future \`create_rule\` call.
5. **Summarize** — End with 2–4 sentences the next hourly run can reuse (what changed, what’s still at risk).

Tone: direct, calm, **action-first**. No vague wellness tips — only schedule- and rule-grounded recommendations.`;
}

// ── buildReason (factory — needs tools bound) ─────────────────────────────────

export function makeReasonNode(tools: StructuredTool[], getLLM: () => import("@langchain/core/language_models/chat_models").BaseChatModel) {
  return async function reason(state: AgentState): Promise<Partial<AgentState>> {
    const baseModel = getLLM();
    const model = (baseModel as typeof baseModel & { bindTools: (t: StructuredTool[]) => typeof baseModel }).bindTools(tools);

    const systemMsg = new SystemMessage(buildSystemPrompt(state));

    const userMsg = new HumanMessage(
      state.kind === "hourly"
        ? `Scheduled **hourly** pass: you have the **entire calendar day** in context (${state.windowStart.toISOString()} → ${state.windowEnd.toISOString()}). Find bottlenecks vs rules, suggest/implement concrete calendar fixes (buffers, reschedules, focus blocks), propose a **new rule** if a pattern deserves policy, then close with a tight summary for the next run.`
        : `Scheduled **daily** pass for ${state.windowStart.toISOString()} → ${state.windowEnd.toISOString()}: reflect on that day’s load, rules, and outcomes; note carry-over risks and optional rule updates.`
    );

    const existingMessages = state.messages ?? [];
    const newMessages = existingMessages.length === 0
      ? [systemMsg, userMsg]
      : existingMessages;

    const response = await model.invoke(newMessages);
    return { messages: [...newMessages, response] };
  };
}

// ── propose ───────────────────────────────────────────────────────────────────

export async function propose(state: AgentState): Promise<Partial<AgentState>> {
  // Extract tool calls from messages and convert calendar mutations to Suggestion proposals
  const proposals: AgentState["proposals"] = [];

  for (const msg of state.messages) {
    const toolCalls = (msg as { tool_calls?: Array<{ name: string; args: Record<string, unknown>; id?: string }> }).tool_calls;
    if (!toolCalls) continue;

    for (const tc of toolCalls) {
      const name = tc.name as string;
      if (name === "create_event") {
        proposals.push({
          runId: state.runId,
          kind: "calendar.create",
          payload: tc.args as Record<string, unknown>,
          status: "pending",
          autoApply: false,
        });
      } else if (name === "delete_event") {
        proposals.push({
          runId: state.runId,
          kind: "calendar.delete",
          payload: tc.args as Record<string, unknown>,
          status: "pending",
          autoApply: false,
        });
      } else if (name === "update_event") {
        proposals.push({
          runId: state.runId,
          kind: "calendar.reschedule",
          payload: tc.args as Record<string, unknown>,
          status: "pending",
          autoApply: false,
        });
      } else if (name === "create_rule") {
        proposals.push({
          runId: state.runId,
          kind: "rule.add",
          payload: tc.args as Record<string, unknown>,
          status: "pending",
          autoApply: false,
        });
      }
    }
  }

  return { proposals };
}

// ── summarize ─────────────────────────────────────────────────────────────────

export async function summarize(state: AgentState): Promise<Partial<AgentState>> {
  const lastMsg = state.messages.length > 0 ? state.messages[state.messages.length - 1] : null;
  const content = lastMsg
    ? typeof lastMsg.content === "string"
      ? lastMsg.content
      : JSON.stringify(lastMsg.content)
    : "";

  // Extract a clean summary — take first 400 chars of the final AI message
  const summary = content.slice(0, 400).trim() || `${state.kind} analysis complete.`;
  return { summary };
}
