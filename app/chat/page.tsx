'use client';

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AppShell } from "@/components/app-shell"
import { useSession } from 'next-auth/react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { redirect } from 'next/navigation';

export default function ChatPage() {
  const { data: session } = useSession();

  // Redirect to sign-in if not authenticated
  if (!session) {
    redirect('/sign-in');
  }

  return (
    <AppShell>
      <ChatInterface />
    </AppShell>
  )
}

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