"use client";

import { useRef, useEffect, useState } from "react";
import {
  isTextUIPart,
  isToolUIPart,
  isReasoningUIPart,
  getToolName,
  type UIMessage,
  type DynamicToolUIPart,
} from "ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Loader2, Send } from "lucide-react";
import { useChatSession } from "@/components/chat/ChatSessionProvider";

/** useChat may surface non-Error failures (e.g. ProgressEvent); avoid showing "[object Event]". */
function formatUnknownError(e: unknown): string {
  if (e instanceof Error) return e.message || "Something went wrong.";
  if (typeof e === "string") return e;
  const tag = Object.prototype.toString.call(e);
  if (tag === "[object Event]" || tag === "[object ProgressEvent]" || tag === "[object ErrorEvent]") {
    return "A network or stream error occurred. Check your connection and try again.";
  }
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
    const m = (e as { message: string }).message;
    if (m) return m;
  }
  return "Something went wrong. Please try again.";
}

function isDynamicToolPart(part: UIMessage["parts"][number]): part is DynamicToolUIPart {
  return part.type === "dynamic-tool";
}

function parseToolResultError(output: unknown): string | null {
  if (output == null) return null;
  let obj: unknown = output;
  if (typeof output === "string") {
    try {
      obj = JSON.parse(output) as unknown;
    } catch {
      return null;
    }
  }
  if (typeof obj === "object" && obj !== null && "error" in obj && typeof (obj as { error: unknown }).error === "string") {
    return (obj as { error: string }).error;
  }
  return null;
}

function safeToolName(part: UIMessage["parts"][number]): string {
  if (!isToolUIPart(part) && !isDynamicToolPart(part)) return "tool";
  try {
    return getToolName(part as never);
  } catch {
    return "tool";
  }
}

function ToolBlock({ part }: { part: UIMessage["parts"][number] }) {
  const name = safeToolName(part);
  const openDefault =
    isToolUIPart(part) || isDynamicToolPart(part)
      ? part.state === "output-available" || part.state === "output-error"
      : false;
  const [open, setOpen] = useState(openDefault);

  if (!isToolUIPart(part) && !isDynamicToolPart(part)) return null;

  const p = part as DynamicToolUIPart | (typeof part & { state: string; input?: unknown; output?: unknown; errorText?: string });
  const toolErr = "output" in p ? parseToolResultError(p.output) : null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card
        className={cn(
          "overflow-hidden",
          toolErr ? "border-amber-300 bg-amber-50/50" : "border-emerald-200 bg-emerald-50/40"
        )}
      >
        <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-emerald-900 hover:bg-emerald-50">
          {open ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
          <span className="font-mono text-xs uppercase tracking-wide text-emerald-800">Tool</span>
          <span className="font-mono text-xs text-slate-700">{name}</span>
          <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
            {(typeof p.state === "string" ? p.state : "pending").replace(/-/g, " ")}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 border-t border-emerald-100 px-3 py-2 text-xs">
            {"input" in p && p.input !== undefined && (
              <div>
                <div className="mb-1 font-semibold text-slate-600">Input</div>
                <pre className="max-h-40 overflow-auto rounded-md bg-white p-2 font-mono text-[11px] text-slate-800 ring-1 ring-slate-200">
                  {typeof p.input === "string" ? p.input : JSON.stringify(p.input, null, 2)}
                </pre>
              </div>
            )}
            {"output" in p && p.output !== undefined && (
              <div>
                <div className="mb-1 font-semibold text-slate-600">Result</div>
                {toolErr ? (
                  <div className="mb-2 rounded-md border border-amber-200 bg-amber-100/80 px-2 py-1.5 text-[11px] font-medium text-amber-950">
                    Tool did not apply: {toolErr}
                  </div>
                ) : null}
                <pre className="max-h-60 overflow-auto rounded-md bg-white p-2 font-mono text-[11px] text-slate-800 ring-1 ring-slate-200">
                  {typeof p.output === "string" ? p.output : JSON.stringify(p.output, null, 2)}
                </pre>
              </div>
            )}
            {"errorText" in p && p.errorText && (
              <div className="rounded-md bg-red-50 p-2 font-mono text-red-800 ring-1 ring-red-200">{p.errorText}</div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const parts = Array.isArray(message.parts) ? message.parts : [];

  return (
    <div className={cn("flex w-full max-w-3xl flex-col gap-3", isUser ? "ml-auto items-end" : "items-start")}>
      {parts.map((part, i) => {
        if (isTextUIPart(part)) {
          return (
            <div
              key={`txt-${message.id}-${i}`}
              className={cn(
                "max-w-[min(720px,92%)] rounded-2xl px-4 py-3 text-sm shadow-sm ring-1",
                isUser ? "bg-emerald-600 text-white ring-emerald-700/20" : "bg-white text-slate-800 ring-slate-200"
              )}
            >
              <div className={cn("whitespace-pre-wrap leading-relaxed", isUser && "text-white")}>{part.text}</div>
            </div>
          );
        }
        if (!isUser && isReasoningUIPart(part)) {
          return (
            <details
              key={`re-${message.id}-${i}`}
              className="w-full max-w-[min(720px,100%)] rounded-lg border border-slate-200 bg-slate-100/90 px-3 py-2 text-left text-xs text-slate-700 shadow-sm"
            >
              <summary className="cursor-pointer select-none font-medium text-slate-500">Model reasoning</summary>
              <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-600">
                {part.text}
              </pre>
            </details>
          );
        }
        if (!isUser && (isToolUIPart(part) || isDynamicToolPart(part))) {
          return (
            <div key={`tool-${message.id}-${i}`} className="w-full max-w-[min(720px,100%)]">
              <ToolBlock part={part} />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

const AUTO_START_MSG =
  "Give me my morning brief. Analyse today's schedule, surface the top bottlenecks, and tell me the 3 most important things I should do today — be specific.";

export function ChatInterface({ autoStart = false }: { autoStart?: boolean }) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoFired = useRef(false);

  const { messages, sendMessage, status, stop, error, clearError } = useChatSession();

  // Auto-trigger briefing when chat first loads with no messages
  useEffect(() => {
    if (!autoStart || autoFired.current || messages.length > 0) return;
    const t = setTimeout(() => {
      if (autoFired.current) return;
      autoFired.current = true;
      void sendMessage({ text: AUTO_START_MSG });
    }, 600);
    return () => clearTimeout(t);
  }, [autoStart, messages.length, sendMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const busy = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">Phuko Coach</h1>
        <p className="text-sm text-slate-500">
          {autoStart
            ? "Your AI coach analyses your schedule, rules, and data sources to give you a personalised daily brief."
            : <>Describe what feels off — Phuko reads <strong>today</strong>, finds bottlenecks and rule clashes, and can fix your calendar directly.</>
          }
        </p>
      </div>

      {error != null && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-950">
          <div className="mx-auto flex max-w-3xl items-start justify-between gap-3">
            <p className="min-w-0 flex-1 leading-snug">{formatUnknownError(error)}</p>
            <Button type="button" variant="outline" size="sm" className="shrink-0 border-amber-300" onClick={() => clearError()}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Native overflow — Radix ScrollArea often collapses to 0 height inside flex parents, hiding the whole thread */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 pb-8">
          {messages.length === 0 && !busy && (
            <Card className="border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              {autoStart
                ? <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin text-emerald-600" /> Starting your briefing…</span>
                : <>Try: "Where is my schedule broken today?" or "Suggest a rule so this doesn&apos;t happen again."</>
              }
            </Card>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin text-emerald-600" />
              Working…
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <Separator />

      <form
        className="bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const t = text.trim();
          if (!t || busy) return;
          void sendMessage({ text: t });
          setText("");
        }}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-end">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message Phuko…"
            className="min-h-[52px] flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            disabled={busy}
          />
          <div className="flex gap-2 sm:flex-col">
            {busy ? (
              <Button type="button" variant="outline" onClick={() => stop()}>
                Stop
              </Button>
            ) : null}
            <Button type="submit" disabled={busy || !text.trim()} className="sm:w-full">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Send
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
