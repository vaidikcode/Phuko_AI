/**
 * Data collector tools — fetch_window_events reads from the local CalendarStore.
 * Remaining collectors return sample data; replace bodies with real MCP/API calls when ready.
 * The tool names, schemas, and return shapes stay stable.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { calendarStore } from "@/lib/calendar/store";

const windowSchema = z.object({
  windowStart: z.string().describe("ISO 8601 start of the window"),
  windowEnd: z.string().describe("ISO 8601 end of the window"),
});

export const fetchWindowEventsTool = tool(
  async ({ windowStart, windowEnd }) => {
    const events = await calendarStore.list({
      from: new Date(windowStart),
      to: new Date(windowEnd),
    });
    return JSON.stringify(events);
  },
  {
    name: "fetch_window_events",
    description:
      "Fetch calendar events from the local calendar store within the given time window. Returns real event objects with type, energyCost, priority, completion status, and outcome notes.",
    schema: windowSchema,
  }
);

export const fetchEmailsLastHourTool = tool(
  async ({ windowStart, windowEnd }) => {
    // TODO: replace with real Gmail/Outlook MCP
    void windowStart;
    void windowEnd;
    const sample = [
      {
        id: "email-001",
        from: "boss@company.com",
        subject: "Q3 planning — urgent review",
        receivedAt: windowStart,
        urgency: "high",
        read: false,
      },
      {
        id: "email-002",
        from: "newsletter@substack.com",
        subject: "5 morning habits of top founders",
        receivedAt: windowStart,
        urgency: "low",
        read: false,
      },
    ];
    return JSON.stringify(sample);
  },
  {
    name: "fetch_emails_last_hour",
    description:
      "Fetch emails received in the given time window. Returns sender, subject, urgency signal, and read status.",
    schema: windowSchema,
  }
);

export const fetchSlackLastHourTool = tool(
  async ({ windowStart, windowEnd }) => {
    // TODO: replace with real Slack MCP
    void windowStart;
    void windowEnd;
    const sample = [
      {
        channel: "#product",
        messageCount: 47,
        mentionCount: 3,
        urgentKeywords: ["blocked", "need approval"],
      },
      {
        channel: "#general",
        messageCount: 12,
        mentionCount: 0,
        urgentKeywords: [],
      },
    ];
    return JSON.stringify(sample);
  },
  {
    name: "fetch_slack_last_hour",
    description:
      "Fetch Slack activity stats for the given time window: message counts, mentions, and urgent keyword flags.",
    schema: windowSchema,
  }
);

export const fetchHealthStatsTool = tool(
  async ({ windowStart, windowEnd }) => {
    // TODO: replace with real health/wearable MCP
    void windowStart;
    void windowEnd;
    const sample = {
      heartRateAvg: 72,
      heartRateMax: 98,
      steps: 820,
      stressLevel: "moderate",
      sleepHoursLastNight: 6.5,
      caffeineIntake: 1,
    };
    return JSON.stringify(sample);
  },
  {
    name: "fetch_health_stats",
    description:
      "Fetch health and biometric stats for the given time window: heart rate, steps, stress, sleep, and caffeine.",
    schema: windowSchema,
  }
);

export const collectorTools = [
  fetchWindowEventsTool,
  fetchEmailsLastHourTool,
  fetchSlackLastHourTool,
  fetchHealthStatsTool,
];
