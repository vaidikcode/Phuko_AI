import "server-only";

/**
 * Calendar day on the **Node process local clock** (set `TZ` in production so "today" matches your life).
 * Used by the hourly agent job for a full-day window.
 */
export function serverLocalCalendarDayBounds(now = new Date()): { start: Date; end: Date } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
}

/** Parse ISO instants from chat request headers; returns undefined if invalid. */
export function parseDayBoundsFromHeaders(req: Request): { start: Date; end: Date } | undefined {
  const startRaw = req.headers.get("x-client-day-start-iso")?.trim();
  const endRaw = req.headers.get("x-client-day-end-iso")?.trim();
  if (!startRaw || !endRaw) return undefined;
  const start = new Date(startRaw);
  const end = new Date(endRaw);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
  if (end.getTime() < start.getTime()) return undefined;
  return { start, end };
}
