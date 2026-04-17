import "server-only";

import { db } from "@/lib/db/client";
import { runs, suggestions, type NewRun, type NewSuggestion } from "@/lib/db";
import { memoryStore } from "@/lib/memory";
import { buildToolRegistry } from "@/lib/tools/registry";
import { getLLM } from "@/lib/llm";
import { buildAgentGraph } from "./graph";
import type { AgentState } from "./state";
import type { BaseMessage } from "@langchain/core/messages";
import { eq } from "drizzle-orm";
import { serverLocalCalendarDayBounds } from "@/lib/schedule/day-bounds";

interface RunResult {
  runId: string;
  summary: string;
  proposalCount: number;
  status: "success" | "error";
  error?: string;
}

async function executeRun(
  kind: "hourly" | "daily",
  windowStart: Date,
  windowEnd: Date
): Promise<RunResult> {
  const runId = crypto.randomUUID();
  const now = new Date();

  // Create run record
  const newRun: NewRun = {
    id: runId,
    kind,
    status: "running",
    startedAt: now,
  };
  await db.insert(runs).values(newRun);

  try {
    const tools = buildToolRegistry();
    const llmProvider = getLLM();

    const graph = buildAgentGraph(tools, llmProvider);

    const initialState: Partial<AgentState> = {
      kind,
      windowStart,
      windowEnd,
      runId,
      messages: [],
      rules: [],
      priorDaily: null,
      lastHourly: null,
      collected: {},
      proposals: [],
      summary: "",
    };

    const finalState = (await graph.invoke(initialState)) as unknown as AgentState;

    // Serialize messages for storage
    const transcript = (finalState.messages ?? []).map((m: BaseMessage) => ({
      type: m._getType(),
      content: m.content,
    }));

    // Collect tool call records
    const toolCallsRaw = (finalState.messages ?? []).flatMap((m: BaseMessage) => {
      const tc = (m as { tool_calls?: Array<{ name: string; args: unknown; id?: string }> }).tool_calls;
      return tc ? tc.map((c) => ({ name: c.name, args: c.args, id: c.id })) : [];
    });

    // Persist proposals as suggestions
    const proposalRows: NewSuggestion[] = (finalState.proposals ?? []).map((p) => ({
      id: crypto.randomUUID(),
      runId,
      kind: p.kind,
      payload: p.payload,
      status: "pending" as const,
      autoApply: p.autoApply ?? false,
      createdAt: new Date(),
    }));

    if (proposalRows.length > 0) {
      await db.insert(suggestions).values(proposalRows);
    }

    // Persist memory
    await memoryStore.save({
      scope: kind,
      windowStart,
      windowEnd,
      summary: finalState.summary || `${kind} analysis complete.`,
      events: (finalState.collected?.fetch_window_events as Record<string, unknown>[]) ?? [],
      runId,
    });

    // Close run
    await db
      .update(runs)
      .set({
        status: "success",
        finishedAt: new Date(),
        transcript: transcript,
        toolCalls: toolCallsRaw,
      })
      .where(eq(runs.id, runId));

    return {
      runId,
      summary: finalState.summary,
      proposalCount: proposalRows.length,
      status: "success",
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[runner] ${kind} run ${runId} failed:`, err);

    await db
      .update(runs)
      .set({ status: "error", finishedAt: new Date(), error: errMsg })
      .where(eq(runs.id, runId));

    return { runId, summary: "", proposalCount: 0, status: "error", error: errMsg };
  }
}

export async function runHourly(): Promise<RunResult> {
  const { start: windowStart, end: windowEnd } = serverLocalCalendarDayBounds();

  console.log(
    `[runner] Starting hourly run (full local calendar day): ${windowStart.toISOString()} → ${windowEnd.toISOString()}`
  );
  return executeRun("hourly", windowStart, windowEnd);
}

export async function runDaily(): Promise<RunResult> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const windowStart = new Date(yesterday);
  const windowEnd = new Date(yesterday);
  windowEnd.setHours(23, 59, 59, 999);

  console.log(`[runner] Starting daily run: ${windowStart.toISOString()} → ${windowEnd.toISOString()}`);
  return executeRun("daily", windowStart, windowEnd);
}
