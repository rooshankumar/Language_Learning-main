
// This is a Server Component (no 'use client' directive)
import { Suspense } from "react";
import { ChatWrapper } from "@/components/chat/ChatWrapper";

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading chats...</div>}>
      <ChatWrapper />
    </Suspense>
  );
}
