'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from "lucide-react";
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/app-shell';
import ChatList from '@/components/chat/chat-list';
import { redirect } from 'next/navigation';

export default function ChatsPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    redirect('/sign-in');
  }

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

        <div className="grid gap-4">
          <ChatList />
        </div>
      </div>
    </AppShell>
  );
}