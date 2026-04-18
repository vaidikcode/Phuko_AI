import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatInterface autoStart />
    </div>
  );
}
