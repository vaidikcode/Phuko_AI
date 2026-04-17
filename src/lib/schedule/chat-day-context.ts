import "server-only";

import type { CalendarEvent } from "@/lib/db/schema";
import { calendarStore } from "@/lib/calendar/store";
import { ruleStore } from "@/lib/rules";
import { memoryStore } from "@/lib/memory";
import { serverLocalCalendarDayBounds, parseDayBoundsFromHeaders } from "./day-bounds";

function iso(d: Date): string {
  return d.toISOString();
}

/** Compact JSON for prompts — avoid dumping huge blobs twice. */
function summarizeConflicts(pairs: Array<[CalendarEvent, CalendarEvent]>): unknown[] {
  return pairs.slice(0, 24).map(([a, b]) => ({
    a: { id: a.id, title: a.title, start: iso(a.startAt), end: iso(a.endAt) },
    b: { id: b.id, title: b.title, start: iso(b.startAt), end: iso(b.endAt) },
  }));
}

/**
 * Server-side snapshot of “today” for the chat model (rules, load, conflicts, events).
 * Uses client day bounds from headers when present; otherwise server-local calendar day.
 */
export async function buildChatDayContextBlock(req: Request): Promise<string> {
  const bounds = parseDayBoundsFromHeaders(req) ?? serverLocalCalendarDayBounds();
  const from = bounds.start;
  const to = bounds.end;

  const [events, load, conflictPairs, rules, lastHourly] = await Promise.all([
    calendarStore.list({
      from,
      to,
      status: ["confirmed", "tentative", "cancelled"],
    }),
    calendarStore.summarizeLoad(from, to),
    calendarStore.findConflicts(from, to),
    ruleStore.listEnabled(),
    memoryStore.getLastHourly(),
  ]);

  const rulesText =
    rules.length === 0
      ? "(none — you may propose first rules when patterns are clear.)"
      : rules.map((r) => `- [p${r.priority}] **${r.title}**: ${r.body}`).join("\n");

  const lastHourlyNote = lastHourly
    ? `Last automated hourly scan summary (may be partial): ${lastHourly.summary.slice(0, 600)}${lastHourly.summary.length > 600 ? "…" : ""}`
    : "No prior hourly scan summary in memory yet.";

  const eventsJson = JSON.stringify(
    events.map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      status: e.status,
      startAt: iso(e.startAt),
      endAt: iso(e.endAt),
      priority: e.priority,
      energyCost: e.energyCost,
      source: e.source,
    })),
    null,
    2
  );

  return [
    "## Today’s schedule snapshot (server — use tools to verify before edits)",
    `Window: **${iso(from)}** → **${iso(to)}**`,
    "",
    "### Active rules",
    rulesText,
    "",
    "### Load summary (today)",
    "```json",
    JSON.stringify(load, null, 2),
    "```",
    "",
    "### Overlaps / conflicts (today)",
    "```json",
    JSON.stringify(
      {
        pairCount: conflictPairs.length,
        pairs: summarizeConflicts(conflictPairs),
      },
      null,
      2
    ),
    "```",
    "",
    "### Events (today)",
    "```json",
    eventsJson,
    "```",
    "",
    "### Prior agent context",
    lastHourlyNote,
  ].join("\n");
}
