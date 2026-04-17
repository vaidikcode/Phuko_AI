import { ChatSessionProvider } from "@/components/chat/ChatSessionProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ChatSessionProvider>{children}</ChatSessionProvider>;
}
