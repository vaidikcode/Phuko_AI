import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { getChatModel } from "@/lib/ai/chat-model";
import { buildPhukoAiToolSet } from "@/lib/ai/phuko-tools";
import { buildChatDayContextBlock } from "@/lib/schedule/chat-day-context";

export const maxDuration = 120;

const SYSTEM = `You are **Phuko — schedule repair & leverage**. Your vibe: **fix the calendar**, **surface bottlenecks**, **respect active rules**, and recommend **concrete, tool-backed** changes—not generic life advice.

## What you do
1. **Ground** — A **“today” snapshot** is injected below (plus current time). Still call tools when you need fresher or narrower data (\`list_events\`, \`get_event\`, \`summarize_load\`, \`find_conflicts\`, \`list_event_logs\`).
2. **Diagnose** — Name bottlenecks (overlaps, overload, no recovery, rule clashes, churn, bad energy placement). Each bullet needs **evidence** (event id, time range, or metric).
3. **Improve** — Suggest **specific** calendar moves: buffers, focus blocks, breaks, reschedules, cancellations. Offer **activities / events** the user could add when gaps or burnout show up.
4. **Rules** — Compare the day to **active rules**. When something looks like a **repeatable policy** (e.g. “no meetings before 10”, “protect Friday PM”), say so and either use \`create_rule\` (if the user agrees or asks you to apply) or propose exact title + body for them to confirm.
5. **Act** — When the user wants fixes or a change is clearly scoped and safe, use **calendar CRUD** and **rule** tools, then summarize what changed.

## Tools — read
- \`list_events\`, \`get_event\`, \`summarize_load\`, \`find_conflicts\`, \`list_event_logs\`, \`fetch_window_events\`

## Tools — write
- \`create_event\`, \`update_event\`, \`delete_event\`, \`complete_event\`, \`annotate_event\`
- \`list_rules\`, \`create_rule\`, \`update_rule\`, \`delete_rule\`

## Illustrative collectors
- \`fetch_emails_last_hour\`, \`fetch_slack_last_hour\`, \`fetch_health_stats\` — lightweight signals unless the user says real data is wired.

## Guardrails
- For \`create_event\` / \`update_event\`, use **real instants**: ISO-8601 **with offset** when possible (e.g. \`2026-04-18T15:00:00+05:30\`). Bare \`YYYY-MM-DD\` is ambiguous; if you must use date-only, the server uses **09:00 local** that day.
- Parse tool JSON; if a result includes \`"error"\`, say the action did not apply and why.
- If the user only wants analysis, you may stop at diagnosis + suggestions without mutating data.`;

function buildNowContext(req: Request): string {
  const tz = req.headers.get("x-client-timezone")?.trim() ?? "";
  const clientIso = req.headers.get("x-client-now-iso")?.trim() ?? "";
  const serverUtc = new Date().toISOString();
  let wall = "";
  if (tz.length > 0) {
    try {
      wall = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      }).format(new Date());
    } catch {
      wall = "";
    }
  }
  const lines = [
    "## Current time (for scheduling and relative phrases)",
    `- Server received this request at (UTC): ${serverUtc}`,
  ];
  if (tz.length > 0) lines.push(`- Client IANA timezone: ${tz}`);
  if (wall.length > 0) lines.push(`- Current local wall time in that zone: ${wall}`);
  if (clientIso.length > 0) lines.push(`- Client clock when sending message (ISO): ${clientIso}`);
  lines.push(
    "Interpret \"today\", \"this afternoon\", \"tomorrow\", \"in an hour\", etc. using the client's timezone when provided; otherwise use UTC."
  );
  return lines.join("\n");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    const messages = body.messages ?? [];
    const tools = buildPhukoAiToolSet();

    const modelMessages = await convertToModelMessages(messages, { tools });

    const dayBlock = await buildChatDayContextBlock(req);

    const result = streamText({
      model: getChatModel(),
      system: `${SYSTEM}\n\n${buildNowContext(req)}\n\n${dayBlock}`,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(24),
      temperature: 0.25,
    });

    return result.toUIMessageStreamResponse();
  } catch (e) {
    const tag = typeof e === "object" && e !== null ? Object.prototype.toString.call(e) : "";
    const msg =
      e instanceof Error
        ? e.message
        : typeof e === "string"
          ? e
          : tag === "[object Event]" || tag === "[object ProgressEvent]"
            ? "Request failed (stream or network)."
            : "Chat failed";
    console.error("[api/chat]", e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
