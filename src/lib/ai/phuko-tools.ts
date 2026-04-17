import "server-only";
import { tool, type ToolSet } from "ai";
import type { StructuredTool } from "@langchain/core/tools";
import type { ZodTypeAny } from "zod";
import { buildToolRegistry } from "@/lib/tools/registry";

/**
 * Wrap LangChain StructuredTools as AI SDK tools so `streamText` + `useChat`
 * get first-class tool-call / tool-result streaming in the UI.
 */
export function buildPhukoAiToolSet(): ToolSet {
  const registry = buildToolRegistry();
  const out: ToolSet = {};

  for (const t of registry) {
    const st = t as StructuredTool & { schema?: ZodTypeAny };
    const name = st.name;
    const schema = st.schema;
    if (!name || !schema) continue;

    out[name] = tool({
      description: st.description,
      inputSchema: schema,
      execute: async (input) => {
        try {
          const raw = await st.invoke(input as never);
          if (typeof raw === "string") return raw;
          try {
            return JSON.stringify(raw);
          } catch {
            return String(raw);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return JSON.stringify({ error: msg, tool: name });
        }
      },
    });
  }

  return out;
}
