export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Run DB migrations on startup
  const { runMigrations } = await import("@/lib/db/migrate");
  await runMigrations();

  const { seedDemoCalendarEvents } = await import("@/lib/calendar/seed-demo-events");
  await seedDemoCalendarEvents().catch((err) => console.error("[seed] calendar demo events:", err));

  // Start cron scheduler (HMR-safe singleton)
  const { start } = await import("@/lib/cron/scheduler");
  start();
}
