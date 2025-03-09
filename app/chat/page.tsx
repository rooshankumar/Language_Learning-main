
"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AppShell } from "@/components/app-shell"

export default function ChatPage() {
  return (
    <AppShell>
      <div className="container py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Conversations</h1>
          <p className="text-muted-foreground">Practice with language partners or chat with AI assistants</p>
        </div>

        <div className="flex items-center space-x-4 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search conversations..."
              className="pl-8"
            />
          </div>
          <Button variant="outline">Filters</Button>
          <Button>New Chat</Button>
        </div>
        
        {/* Rest of chat content here */}
        <div className="grid gap-4">
          {/* Chat content */}
          <p>Your chat conversations will appear here.</p>
        </div>
      </div>
    </AppShell>
  )
}
'use client';

import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/app-shell';
import ChatList from '@/components/chat/chat-list';

export default function ChatsPage() {
  const { data: session, status } = useSession();

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Messages</h1>
          <p className="text-sm text-muted-foreground">Chat with language partners</p>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ChatList />
        </div>
      </div>
    </AppShell>
  );
}
