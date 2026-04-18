import { streamText } from "ai";
import { getChatModel } from "@/lib/ai/chat-model";
import { MOCK_BOTTLENECKS_CONTEXT } from "@/lib/mock/data";

export const maxDuration = 60;

const SYSTEM = `You are Phuko, a life-optimisation AI coach. A user has clicked on a metric that needs improvement.

Be specific, direct, and actionable. Reference the real bottlenecks in the user's data.
Format your response as a clean numbered list with 3–5 suggestions.
For each suggestion: one bold action (one sentence), then 1–2 sentences of why/how.
End with one "rule to create" that would prevent this from happening again.
Keep the whole response under 300 words.`;

export async function POST(req: Request) {
  try {
    const { metric, value, max } = (await req.json()) as { metric: string; value: number; max: number };
    const pct = Math.round((value / max) * 100);

    const prompt = `The user's ${metric} score is ${value}/${max} (${pct}%).

Here is their current data and known bottlenecks:
${MOCK_BOTTLENECKS_CONTEXT}

Give 3–5 specific, actionable suggestions to improve their ${metric} score.
Focus on schedule changes, habit adjustments, and one concrete rule to create.`;

    const result = streamText({
      model: getChatModel(),
      system: SYSTEM,
      prompt,
      temperature: 0.4,
    });

    return result.toTextStreamResponse();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Suggestion failed";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
