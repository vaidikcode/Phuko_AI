import "server-only";

import { like } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { calendarEvents, type EventType } from "@/lib/db/schema";
import { calendarStore } from "@/lib/calendar/store";
import { getDemoSourceEvents, type SourceId } from "@/lib/mock/data";

const DEMO_EXTERNAL_PREFIX = "phuko-demo-";

function localStart(dateYmd: string, hhmm: string): Date {
  const [y, mo, d] = dateYmd.split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);
  return new Date(y, mo - 1, d, hh, mm, 0, 0);
}

function sourceLabel(s: SourceId): string {
  switch (s) {
    case "notion":
      return "Notion";
    case "slack":
      return "Slack";
    case "google-docs":
      return "Google Docs";
    case "browser":
      return "Browser";
    default:
      return s;
  }
}

function inferType(ev: { source: SourceId; tags: string[] }): EventType {
  if (ev.tags.includes("health")) return "health";
  if (ev.source === "google-docs") return "deep_work";
  if (ev.source === "browser") return "learning";
  return "meeting";
}

function energyFor(duration: number): "low" | "medium" | "high" {
  if (duration >= 75) return "high";
  if (duration >= 40) return "medium";
  return "low";
}

/**
 * Inserts demo events into `calendar_events` once per database (tracked via `external_id` prefix).
 * Called from instrumentation after migrations so the main Calendar matches dashboard demo data.
 */
export async function seedDemoCalendarEvents(): Promise<{ inserted: number; skipped: boolean }> {
  const existing = await db
    .select({ id: calendarEvents.id })
    .from(calendarEvents)
    .where(like(calendarEvents.externalId, `${DEMO_EXTERNAL_PREFIX}%`))
    .limit(1);

  if (existing.length > 0) {
    return { inserted: 0, skipped: true };
  }

  const rows = getDemoSourceEvents();
  let inserted = 0;

  for (const ev of rows) {
    const startAt = localStart(ev.date, ev.time);
    const endAt = new Date(startAt.getTime() + ev.duration * 60 * 1000);
    const label = sourceLabel(ev.source);

    await calendarStore.create(
      {
        title: ev.title,
        description: `Connected: ${label}`,
        startAt,
        endAt,
        allDay: false,
        status: "confirmed",
        type: inferType(ev),
        energyCost: energyFor(ev.duration),
        priority: ev.tags.includes("work") ? 7 : 5,
        tags: [...ev.tags, ev.source],
        source: "agent",
        externalId: `${DEMO_EXTERNAL_PREFIX}${ev.id}`,
        justification: `Synced from ${label}`,
      },
      "agent"
    );
    inserted += 1;
  }

  return { inserted, skipped: false };
}
