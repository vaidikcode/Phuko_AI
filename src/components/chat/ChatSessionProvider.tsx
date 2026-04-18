"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

type ChatSessionValue = ReturnType<typeof useChat>;

const ChatSessionContext = createContext<ChatSessionValue | null>(null);

/** Browser-local calendar day as ISO range (matches "today" for the user). */
function clientLocalDayBoundsIso(): { start: string; end: string } {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const start = new Date(`${y}-${m}-${day}T00:00:00`);
  const end = new Date(`${y}-${m}-${day}T23:59:59.999`);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function ChatSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
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
      }),
    []
  );

  const chat = useChat({
    transport,
    onFinish: () => {
      void queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      void queryClient.invalidateQueries({ queryKey: ["rules"] });
      void queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
  });

  return <ChatSessionContext.Provider value={chat}>{children}</ChatSessionContext.Provider>;
}

export function useChatSession(): ChatSessionValue {
  const ctx = useContext(ChatSessionContext);
  if (ctx == null) {
    throw new Error("useChatSession must be used within ChatSessionProvider");
  }
  return ctx;
}
