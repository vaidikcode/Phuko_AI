import "server-only";

declare global {
  // eslint-disable-next-line no-var
  var __phukoCronStarted: boolean | undefined;
  // eslint-disable-next-line no-var
  var __phukoCronTimer: ReturnType<typeof setInterval> | undefined;
}

/** How often we check wall-clock (was cron `0 * * * *` / `5 0 * * *`). */
const TICK_MS = 15_000;

function hourKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}`;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

let lastHourlyKey: string | null = null;
let lastDailyKey: string | null = null;

export function start() {
  if (globalThis.__phukoCronStarted) return;
  globalThis.__phukoCronStarted = true;

  if (process.env.CRON_ENABLED !== "true") {
    console.log("[cron] CRON_ENABLED != true — cron disabled");
    return;
  }

  const tick = () => {
    const now = new Date();

    // Hourly — top of every hour: full **local calendar day** schedule scan (see agent/runner runHourly)
    if (now.getMinutes() === 0) {
      const key = hourKey(now);
      if (lastHourlyKey !== key) {
        lastHourlyKey = key;
        void (async () => {
          console.log("[cron] Triggering hourly run…");
          const { runHourly } = await import("@/lib/agent/runner");
          await runHourly().catch((err) =>
            console.error("[cron] Hourly run failed:", err)
          );
        })();
      }
    }

    // Daily — 00:05 local (equivalent to `5 0 * * *`)
    if (now.getHours() === 0 && now.getMinutes() === 5) {
      const key = dayKey(now);
      if (lastDailyKey !== key) {
        lastDailyKey = key;
        void (async () => {
          console.log("[cron] Triggering daily run…");
          const { runDaily } = await import("@/lib/agent/runner");
          await runDaily().catch((err) =>
            console.error("[cron] Daily run failed:", err)
          );
        })();
      }
    }
  };

  tick();
  globalThis.__phukoCronTimer = setInterval(tick, TICK_MS);
  console.log(
    `[cron] Scheduled: hourly at :00, daily at 00:05 (tick every ${TICK_MS / 1000}s)`
  );
}
