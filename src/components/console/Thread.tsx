"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
  isTextUIPart,
  isToolUIPart,
  isReasoningUIPart,
  getToolName,
  type UIMessage,
  type DynamicToolUIPart,
} from "ai";
import { useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Send, Zap } from "lucide-react";
import { dispatchWidget, type ToolPart } from "./widgetDispatch";
import type { CalEvent } from "@/components/calendar/types";
import { EventCard } from "./widgets/EventCard";
import { SlotPicker } from "./widgets/SlotPicker";

function clientLocalDayBoundsIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return {
    start: new Date(`${y}-${m}-${day}T00:00:00`).toISOString(),
    end: new Date(`${y}-${m}-${day}T23:59:59.999`).toISOString(),
  };
}

function isDynamicToolPart(part: UIMessage["parts"][number]): part is DynamicToolUIPart {
  return part.type === "dynamic-tool";
}

function safeToolName(part: UIMessage["parts"][number]): string {
  if (!isToolUIPart(part) && !isDynamicToolPart(part)) return "tool";
  try {
    return getToolName(part as never);
  } catch {
    return "tool";
  }
}

function formatErr(e: unknown): string {
  if (e instanceof Error) return e.message || "Something went wrong.";
  if (typeof e === "string") return e;
  return "A network or stream error occurred.";
}

/** Render assistant text with basic markdown-like formatting */
function FormattedText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\n+/);
  return (
    <div className="space-y-2 text-sm text-ink leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const allBullets = lines.length > 0 && lines.every((l) => /^[-*•]\s/.test(l));
        const allNumbered = lines.length > 0 && lines.every((l) => /^\d+\.\s/.test(l));
        if (allBullets) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1 marker:text-brand-600">
              {lines.map((l, j) => (
                <li key={j} className="pl-0.5">{l.replace(/^[-*•]\s+/, "")}</li>
              ))}
            </ul>
          );
        }
        if (allNumbered) {
          return (
            <ol key={i} className="list-decimal pl-5 space-y-1 marker:font-semibold marker:text-brand-600">
              {lines.map((l, j) => (
                <li key={j} className="pl-0.5">{l.replace(/^\d+\.\s+/, "")}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">{block}</p>
        );
      })}
    </div>
  );
}

export function Thread({
  onSendReady,
}: {
  /** Called once with a stable `send` function so the parent can wire sidebar actions */
  onSendReady?: (send: (text: string) => void) => void;
}) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [reschedulingEvent, setReschedulingEvent] = useState<CalEvent | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const transport = new DefaultChatTransport({
    api: "/api/chat",
    headers: () => {
      const { start, end } = clientLocalDayBoundsIso();
      return {
        "X-Client-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
        "X-Client-Now-Iso": new Date().toISOString(),
        "X-Client-Day-Start-Iso": start,
        "X-Client-Day-End-Iso": end,
      };
    },
  });

  const { messages, sendMessage, addToolResult: rawAddToolResult, status, stop, error, setMessages } = useChat({
    transport,
    onFinish: () => {
      void queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      void queryClient.invalidateQueries({ queryKey: ["rules"] });
      void queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
  });

  const busy = status === "streaming" || status === "submitted";

  const send = useCallback(
    (msg: string) => {
      if (!msg.trim() || busy) return;
      void sendMessage({ text: msg.trim() });
    },
    [busy, sendMessage]
  );

  // Surface `send` to parent on first render so the sidebar can trigger prompts
  const notifiedParent = useRef(false);
  useEffect(() => {
    if (!notifiedParent.current && onSendReady) {
      notifiedParent.current = true;
      onSendReady(send);
    }
  }, [send, onSendReady]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // Adapt AI SDK v5 object-based addToolResult to our simpler (id, name, output) signature
  const addToolResult = (toolCallId: string, toolName: string, output: unknown) => {
    rawAddToolResult({
      tool: toolName as never,
      toolCallId,
      output,
    });
  };

  const widgetCtx = {
    sendMessage: send,
    addToolResult,
    onEventReschedule: (ev: CalEvent) => setReschedulingEvent(ev),
  };

  const clearAndNew = () => {
    setMessages([]);
    setText("");
    setReschedulingEvent(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-base">
      {/* Error bar */}
      {error != null && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          {formatErr(error)}
        </div>
      )}

      {/* Thread scroll area */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 pb-8">
          {messages.length === 0 && busy && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-subtle">
              <Loader2 className="size-4 animate-spin text-brand-600" />
              Thinking…
            </div>
          )}

          {messages.length === 0 && !busy && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center animate-fade-up">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
                <Zap className="size-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Console ready</p>
                <p className="text-xs text-ink-faint mt-1">
                  Pick an action from the sidebar or type below
                </p>
              </div>
            </div>
          )}

          {messages.map((m) => {
            const isUser = m.role === "user";
            const parts = Array.isArray(m.parts) ? m.parts : [];

            return (
              <div key={m.id} className={cn("flex flex-col gap-2 animate-fade-up", isUser ? "items-end" : "items-start w-full max-w-2xl")}>
                {isUser && (
                  <div className="max-w-[85%] rounded-2xl bg-brand-600 px-4 py-2.5 text-white text-sm shadow-sm">
                    {parts.filter(isTextUIPart).map((p, i) => (
                      <p key={i} className="whitespace-pre-wrap leading-relaxed">{p.text}</p>
                    ))}
                  </div>
                )}

                {!isUser && (
                  <div className="w-full space-y-2">
                    {parts.map((part, i) => {
                      // Text blocks
                      if (isTextUIPart(part) && part.text.trim()) {
                        return (
                          <div key={`txt-${i}`} className="rounded-xl bg-white border border-surface-border px-4 py-3 shadow-sm">
                            <FormattedText text={part.text} />
                          </div>
                        );
                      }

                      // Reasoning (collapsed)
                      if (isReasoningUIPart(part)) {
                        return (
                          <details
                            key={`re-${i}`}
                            className="rounded-lg border border-surface-border bg-surface-base px-3 py-2 text-xs text-ink-subtle"
                          >
                            <summary className="cursor-pointer select-none font-medium text-ink-faint">
                              Reasoning
                            </summary>
                            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink-faint">
                              {part.text}
                            </pre>
                          </details>
                        );
                      }

                      // Tool parts → widget dispatch
                      if (isToolUIPart(part) || isDynamicToolPart(part)) {
                        const name = safeToolName(part);
                        const p = part as DynamicToolUIPart;
                        const toolPart: ToolPart = {
                          type: `tool-${name}`,
                          toolCallId: "toolCallId" in part ? (part.toolCallId as string) : undefined,
                          state: p.state,
                          input: "input" in p ? p.input : undefined,
                          output: "output" in p ? p.output : undefined,
                        };

                        // HITL / loading shimmer states
                        if (
                          p.state === "approval-requested" ||
                          p.state === "input-streaming"
                        ) {
                          // For HITL tools, dispatch immediately to show approval widget
                          const widget = dispatchWidget(toolPart, widgetCtx);
                          if (widget) {
                            return <div key={`tool-${i}`} className="animate-fade-up">{widget}</div>;
                          }
                          return (
                            <div key={`tool-${i}`} className="flex items-center gap-2 rounded-lg border border-surface-border bg-white px-3 py-2">
                              <Loader2 className="size-3 animate-spin text-brand-600 shrink-0" />
                              <span className="text-xs text-ink-subtle font-mono">{name.replace(/_/g, " ")}</span>
                            </div>
                          );
                        }

                        const widget = dispatchWidget(toolPart, widgetCtx);
                        if (widget) {
                          return <div key={`tool-${i}`} className="animate-fade-up">{widget}</div>;
                        }

                        // Fallback: skip raw JSON dump for collector tools, show minimal for others
                        if (p.state === "output-available") {
                          return (
                            <div key={`tool-${i}`} className="flex items-center gap-2 rounded-lg border border-surface-border bg-white px-3 py-2">
                              <span className="inline-block size-1.5 rounded-full bg-brand-600/50 shrink-0" />
                              <span className="text-xs text-ink-subtle font-mono">{name.replace(/_/g, " ")}</span>
                              <span className="text-xs text-ink-faint">done</span>
                            </div>
                          );
                        }
                        return null;
                      }

                      return null;
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {busy && (
            <div className="flex items-center gap-2 text-xs text-ink-subtle">
              <Loader2 className="size-4 animate-spin text-brand-600" />
              Working…
            </div>
          )}

          {/* Inline SlotPicker if user tapped Reschedule on an EventCard */}
          {reschedulingEvent && (
            <div className="rounded-xl border border-surface-border bg-white p-3 animate-fade-up">
              <SlotPicker
                eventId={reschedulingEvent.id}
                eventTitle={reschedulingEvent.title}
                candidates={[]}
                onSelect={(slot) => {
                  send(`Move event "${reschedulingEvent.title}" (${reschedulingEvent.id}) to ${slot.startIso} – ${slot.endIso}.`);
                  setReschedulingEvent(null);
                }}
              />
              <button
                type="button"
                className="mt-2 text-xs text-ink-faint underline hover:text-brand-600 transition-colors"
                onClick={() => send(`Suggest free slots to reschedule "${reschedulingEvent.title}" (${reschedulingEvent.id}) today.`)}
              >
                Ask for slot suggestions
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-surface-border bg-white p-3">
        <div className="mx-auto flex max-w-2xl gap-2 items-end">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask anything about your schedule…"
            className="min-h-[44px] flex-1 resize-none"
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(text);
                setText("");
              }
            }}
          />
          <div className="flex flex-col gap-1.5 shrink-0">
            {busy ? (
              <Button variant="outline" size="sm" onClick={() => stop()}>
                Stop
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={!text.trim()}
                onClick={() => {
                  send(text);
                  setText("");
                }}
              >
                <Send className="size-3.5" />
              </Button>
            )}
            {messages.length > 0 && !busy && (
              <Button variant="ghost" size="sm" className="text-ink-faint text-xs" onClick={clearAndNew}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
