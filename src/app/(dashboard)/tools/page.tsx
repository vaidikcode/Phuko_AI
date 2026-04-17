import { buildToolRegistry } from "@/lib/tools/registry";
import { ToolsPageClient } from "./ToolsPageClient";

export default function ToolsPage() {
  const tools = buildToolRegistry().map((t) => ({
    name: t.name,
    description: t.description,
  }));

  return <ToolsPageClient tools={tools} />;
}
