// Fixed mock data — no Math.random() to avoid hydration mismatches

// 30-day consistency scores (%)
const SCORES = [45,62,38,71,85,55,42,78,90,68,52,83,65,47,72,88,60,75,49,91,58,70,44,82,66,53,77,87,63,74];
const TOTALS = [ 4, 6, 5, 7, 8, 5, 4, 6, 9, 7, 5, 8, 6, 5, 7, 8, 6, 7, 5, 9, 6, 7, 5, 8, 6, 5, 7, 8, 6, 7];

export function getMockConsistency() {
  return SCORES.map((score, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const tasksTotal = TOTALS[i];
    return {
      date: d.toISOString().split("T")[0],
      score,
      tasksTotal,
      tasksCompleted: Math.round((score / 100) * tasksTotal),
    };
  });
}

export const MOCK_METRICS = {
  energy: 72,
  attentionScore: 68,
  nextEvent: { title: "Deep Work: Product Spec", minutesAway: 83, type: "focus" },
  streakDays: 7,
};

export const MOCK_POINTS = {
  health:    { value: 340, max: 500, delta: +12, trend: "up"   as const },
  knowledge: { value: 520, max: 700, delta: +28, trend: "up"   as const },
  money:     { value: 280, max: 500, delta: -15, trend: "down" as const },
  work:      { value: 650, max: 700, delta:  +5, trend: "up"   as const },
};

export type RelStatus = "strong" | "warm" | "needs-attention";
export const MOCK_RELATIONSHIPS = [
  { id:"r1", label:"Investor — Rahul", status:"warm"            as RelStatus, lastContact:"2 days ago", score:74 },
  { id:"r2", label:"Family",           status:"needs-attention" as RelStatus, lastContact:"5 days ago", score:42 },
  { id:"r3", label:"Crush — Priya",    status:"warm"            as RelStatus, lastContact:"1 day ago",  score:68 },
  { id:"r4", label:"Mentor — Dev",     status:"strong"          as RelStatus, lastContact:"today",      score:91 },
  { id:"r5", label:"Partner — Alex",   status:"needs-attention" as RelStatus, lastContact:"3 days ago", score:55 },
];

// Fixed calendar statuses — last 60 days
const CAL_PATTERN: Array<"green"|"yellow"|"red"> = [
  "green","green","yellow","red","green","green","yellow","green","red","yellow",
  "green","green","green","red","yellow","green","yellow","green","green","red",
  "green","green","yellow","green","green","yellow","green","red","green","green",
];

export function getMockCalendarDays(): Record<string, "green"|"yellow"|"red"> {
  const data: Record<string, "green"|"yellow"|"red"> = {};
  const today = new Date();
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    data[d.toISOString().split("T")[0]] = CAL_PATTERN[i % CAL_PATTERN.length];
  }
  data[today.toISOString().split("T")[0]] = "yellow"; // today in-progress
  return data;
}

export type SourceId = "notion" | "slack" | "google-docs" | "browser";

/** Local calendar YYYY-MM-DD (not UTC) for the given date. */
export function localCalendarYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type DemoEventRow = {
  id: string;
  source: SourceId;
  title: string;
  /** Days from local today (0 = today). */
  dayOffset: number;
  time: string;
  duration: number;
  tags: string[];
};

const DEMO_EVENT_ROWS: DemoEventRow[] = [
  { id: "ne1", source: "notion", title: "Product Roadmap Review", dayOffset: 0, time: "10:00", duration: 60, tags: ["work", "planning"] },
  { id: "ne2", source: "notion", title: "OKR Progress Check", dayOffset: 1, time: "14:00", duration: 45, tags: ["work", "review"] },
  { id: "ne3", source: "notion", title: "Investor Deck Update", dayOffset: 2, time: "11:00", duration: 90, tags: ["money", "work"] },
  { id: "se1", source: "slack", title: "Team Standup", dayOffset: 0, time: "09:30", duration: 15, tags: ["work"] },
  { id: "se2", source: "slack", title: "Dev Sync", dayOffset: 0, time: "16:00", duration: 30, tags: ["work"] },
  { id: "se3", source: "slack", title: "Q2 Planning Kickoff", dayOffset: 3, time: "13:00", duration: 60, tags: ["work", "planning"] },
  { id: "ge1", source: "google-docs", title: "Write Pitch Deck Draft", dayOffset: 0, time: "15:00", duration: 90, tags: ["money", "knowledge"] },
  { id: "ge2", source: "google-docs", title: "Review Technical Spec", dayOffset: 1, time: "10:00", duration: 60, tags: ["knowledge", "work"] },
  { id: "bh1", source: "browser", title: "Research: VC landscape", dayOffset: -1, time: "20:00", duration: 45, tags: ["money", "knowledge"] },
  { id: "bh2", source: "browser", title: "Reading: Deep Work (resumed)", dayOffset: -1, time: "21:00", duration: 30, tags: ["knowledge"] },
  { id: "bh3", source: "browser", title: "Workout planning session", dayOffset: 0, time: "07:00", duration: 20, tags: ["health"] },
];

/** Demo events with `date` anchored to the user’s local calendar (same rows Phuko seeds into the DB). */
export function getDemoSourceEvents(): Array<DemoEventRow & { date: string }> {
  const base = new Date();
  return DEMO_EVENT_ROWS.map((row) => {
    const d = new Date(base);
    d.setDate(d.getDate() + row.dayOffset);
    return { ...row, date: localCalendarYmd(d) };
  });
}

export const MOCK_DATA_SOURCES = [
  { id:"notion",      label:"Notion",        abbr:"N", color:"bg-gray-800",   lastSync:"4 min ago", eventCount:3, status:"connected" as const },
  { id:"slack",       label:"Slack",         abbr:"S", color:"bg-violet-600", lastSync:"1 min ago", eventCount:3, status:"connected" as const },
  { id:"google-docs", label:"Google Docs",   abbr:"G", color:"bg-blue-500",   lastSync:"7 min ago", eventCount:2, status:"connected" as const },
  { id:"browser",     label:"Browser Hist.", abbr:"B", color:"bg-orange-500", lastSync:"just now",  eventCount:3, status:"connected" as const },
];

export const MOCK_BOTTLENECKS_CONTEXT = `
User profile: 7-day streak. Energy 72/100. Attention 68/100 (below optimal — 3 back-to-back meetings depleted focus).

Lowest score: Money (280/500). Weakest relationship: Family (42/100, no contact in 5 days).

Today's schedule issues:
- 3 meetings 9:30–16:00 with no buffers
- Deep Work block at 15:00 placed after back-to-back meetings — attention already spent
- No exercise block today (4 missed workouts in last 7 days → health declining)
- Investor Deck (Notion) conflicts with Dev Sync (Slack) on Apr 20 at 16:00

7-day patterns:
- Money tasks consistently deprioritised (1 of 4 completed)
- No family contact logged in 5 days
- 2 hr+ evening social-media browsing detected via browser
- Knowledge tasks largely completed (reading, research)
`.trim();
