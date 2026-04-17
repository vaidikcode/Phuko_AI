import { eq, and, gte, lte, inArray, or, isNull, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  calendarEvents,
  calendarEventLogs,
  type CalendarEvent,
  type NewCalendarEvent,
  type CalendarEventLog,
  type EventStatus,
  type EventType,
  type RecurrenceRule,
} from "@/lib/db/schema";

export interface ListRange {
  from: Date;
  to: Date;
  status?: EventStatus[];
  type?: EventType[];
}

// ── Recurrence expander ───────────────────────────────────────────────────
function expandRecurrence(event: CalendarEvent, from: Date, to: Date): CalendarEvent[] {
  const rule = event.recurrence as RecurrenceRule | null;
  if (!rule) return [];

  const instances: CalendarEvent[] = [];
  const duration = event.endAt.getTime() - event.startAt.getTime();
  const intervalVal = rule.interval ?? 1;

  let cursor = new Date(event.startAt);
  let count = 0;
  const until = rule.until ? new Date(rule.until) : null;
  const maxCount = rule.count ?? 500;

  const advanceCursor = () => {
    if (rule.freq === "daily") {
      cursor = new Date(cursor.getTime() + intervalVal * 24 * 60 * 60 * 1000);
    } else if (rule.freq === "weekly") {
      cursor = new Date(cursor.getTime() + intervalVal * 7 * 24 * 60 * 60 * 1000);
    } else if (rule.freq === "monthly") {
      const d = new Date(cursor);
      d.setMonth(d.getMonth() + intervalVal);
      cursor = d;
    }
  };

  const bydays: string[] = rule.byday ?? [];
  const dayNames = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

  while (count < maxCount) {
    if (until && cursor > until) break;
    if (cursor > to) break;

    const shouldInclude =
      bydays.length === 0 || bydays.includes(dayNames[cursor.getDay()]);

    if (shouldInclude && cursor >= from && cursor <= to) {
      const instanceEnd = new Date(cursor.getTime() + duration);
      instances.push({
        ...event,
        id: `${event.id}_${cursor.getTime()}`,
        startAt: new Date(cursor),
        endAt: instanceEnd,
        recurrenceParentId: event.id,
      });
    }

    if (bydays.length > 0 && rule.freq === "weekly") {
      const nextDay = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
      if (nextDay.getDay() <= cursor.getDay()) {
        // Crossed week boundary — advance by interval weeks
        advanceCursor();
      } else {
        cursor = nextDay;
      }
    } else {
      advanceCursor();
    }
    count++;
  }

  return instances;
}

// ── CalendarStore ─────────────────────────────────────────────────────────
export class CalendarStore {
  private writeLog(
    eventId: string,
    action: CalendarEventLog["action"],
    actor: CalendarEventLog["actor"],
    diff?: Record<string, unknown>,
    note?: string
  ): void {
    void db.insert(calendarEventLogs).values({
      id: crypto.randomUUID(),
      eventId,
      at: new Date(),
      action,
      actor,
      diff: diff ?? null,
      note: note ?? null,
    });
  }

  async list(range: ListRange): Promise<CalendarEvent[]> {
    if (Number.isNaN(range.from.getTime()) || Number.isNaN(range.to.getTime())) {
      return [];
    }

    /** Non–recurrence-master rows: any event that overlaps [from, to] (start <= to && end >= from). */
    const notRecurrenceMaster = or(
      isNull(calendarEvents.recurrence),
      isNotNull(calendarEvents.recurrenceParentId)
    );
    const overlapsWindow = and(
      lte(calendarEvents.startAt, range.to),
      gte(calendarEvents.endAt, range.from),
      notRecurrenceMaster
    );

    /**
     * Recurrence series masters: still selected when series *starts* in range so expandRecurrence
     * can emit instances (masters often do not overlap the window on their stored endAt alone).
     */
    const recurrenceMasterInRange = and(
      isNotNull(calendarEvents.recurrence),
      isNull(calendarEvents.recurrenceParentId),
      gte(calendarEvents.startAt, range.from),
      lte(calendarEvents.startAt, range.to)
    );

    const windowPredicate = or(overlapsWindow, recurrenceMasterInRange);

    const conditions = [windowPredicate];

    if (range.status?.length) {
      conditions.push(inArray(calendarEvents.status, range.status));
    } else {
      conditions.push(inArray(calendarEvents.status, ["confirmed", "tentative"]));
    }

    if (range.type?.length) {
      conditions.push(inArray(calendarEvents.type, range.type));
    }

    const rows = await db.select().from(calendarEvents).where(and(...conditions));

    const masters = rows.filter((e) => e.recurrence && !e.recurrenceParentId);
    const regular = rows.filter((e) => !e.recurrence || e.recurrenceParentId);
    const expanded = masters.flatMap((m) => expandRecurrence(m, range.from, range.to));

    return [...regular, ...expanded].sort(
      (a, b) => a.startAt.getTime() - b.startAt.getTime()
    );
  }

  async get(id: string): Promise<CalendarEvent | undefined> {
    const rows = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
    return rows[0];
  }

  async create(
    input: Omit<NewCalendarEvent, "id" | "createdAt" | "updatedAt">,
    actor: CalendarEventLog["actor"] = "user"
  ): Promise<CalendarEvent> {
    const now = new Date();
    const id = crypto.randomUUID();
    const row: NewCalendarEvent = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(calendarEvents).values(row);
    this.writeLog(id, "created", actor, undefined, `Event "${input.title}" created`);
    return (await this.get(id))!;
  }

  async update(
    id: string,
    patch: Partial<Omit<NewCalendarEvent, "id" | "createdAt">>,
    actor: CalendarEventLog["actor"] = "user"
  ): Promise<CalendarEvent> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`CalendarEvent ${id} not found`);

    const now = new Date();
    const isReschedule =
      (patch.startAt !== undefined &&
        patch.startAt instanceof Date &&
        patch.startAt.getTime() !== existing.startAt.getTime()) ||
      (patch.endAt !== undefined &&
        patch.endAt instanceof Date &&
        patch.endAt.getTime() !== existing.endAt.getTime());
    const action = isReschedule ? "rescheduled" : "updated";

    await db
      .update(calendarEvents)
      .set({ ...patch, updatedAt: now })
      .where(eq(calendarEvents.id, id));

    const diff: Record<string, unknown> = {};
    for (const key of Object.keys(patch) as Array<keyof typeof patch>) {
      if (JSON.stringify(existing[key as keyof CalendarEvent]) !== JSON.stringify(patch[key])) {
        diff[key] = { from: existing[key as keyof CalendarEvent], to: patch[key] };
      }
    }
    this.writeLog(id, action, actor, diff);
    return (await this.get(id))!;
  }

  async delete(id: string, actor: CalendarEventLog["actor"] = "user"): Promise<void> {
    await this.update(id, { status: "cancelled" }, actor);
    this.writeLog(id, "cancelled", actor, undefined, "Event soft-deleted");
  }

  async complete(
    id: string,
    options?: { outcomeNotes?: string; actualStartAt?: Date; actualEndAt?: Date },
    actor: CalendarEventLog["actor"] = "user"
  ): Promise<CalendarEvent> {
    const now = new Date();
    const patch: Partial<NewCalendarEvent> = { completedAt: now };
    if (options?.outcomeNotes) patch.outcomeNotes = options.outcomeNotes;
    if (options?.actualStartAt) patch.actualStartAt = options.actualStartAt;
    if (options?.actualEndAt) patch.actualEndAt = options.actualEndAt;

    await db.update(calendarEvents).set({ ...patch, updatedAt: now }).where(eq(calendarEvents.id, id));
    this.writeLog(id, "completed", actor, undefined, options?.outcomeNotes);
    return (await this.get(id))!;
  }

  async annotate(id: string, note: string, actor: CalendarEventLog["actor"] = "user"): Promise<CalendarEvent> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`CalendarEvent ${id} not found`);

    const merged = existing.outcomeNotes
      ? `${existing.outcomeNotes}\n---\n${note}`
      : note;
    const now = new Date();
    await db.update(calendarEvents).set({ outcomeNotes: merged, updatedAt: now }).where(eq(calendarEvents.id, id));
    this.writeLog(id, "annotated", actor, undefined, note);
    return (await this.get(id))!;
  }

  async listLogs(eventId: string): Promise<CalendarEventLog[]> {
    return db.select().from(calendarEventLogs).where(eq(calendarEventLogs.eventId, eventId));
  }

  async findConflicts(windowStart: Date, windowEnd: Date): Promise<Array<[CalendarEvent, CalendarEvent]>> {
    const events = await this.list({ from: windowStart, to: windowEnd });
    const pairs: Array<[CalendarEvent, CalendarEvent]> = [];
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const a = events[i];
        const b = events[j];
        if (a.startAt < b.endAt && b.startAt < a.endAt) {
          pairs.push([a, b]);
        }
      }
    }
    return pairs;
  }

  async summarizeLoad(from: Date, to: Date): Promise<{
    totalMinutesByType: Record<string, number>;
    totalMinutesByEnergy: Record<string, number>;
    highPriorityCount: number;
    backToBackCount: number;
    totalEvents: number;
  }> {
    const events = await this.list({ from, to });
    const totalMinutesByType: Record<string, number> = {};
    const totalMinutesByEnergy: Record<string, number> = {};
    let highPriorityCount = 0;
    let backToBackCount = 0;

    const sorted = [...events].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

    for (let i = 0; i < sorted.length; i++) {
      const ev = sorted[i];
      const minutes = Math.round((ev.endAt.getTime() - ev.startAt.getTime()) / 60000);
      totalMinutesByType[ev.type] = (totalMinutesByType[ev.type] ?? 0) + minutes;
      totalMinutesByEnergy[ev.energyCost] = (totalMinutesByEnergy[ev.energyCost] ?? 0) + minutes;
      if (ev.priority >= 8) highPriorityCount++;

      if (i > 0) {
        const prev = sorted[i - 1];
        const gapMs = ev.startAt.getTime() - prev.endAt.getTime();
        if (gapMs <= 5 * 60 * 1000) backToBackCount++;
      }
    }

    return {
      totalMinutesByType,
      totalMinutesByEnergy,
      highPriorityCount,
      backToBackCount,
      totalEvents: events.length,
    };
  }
}

export const calendarStore = new CalendarStore();
