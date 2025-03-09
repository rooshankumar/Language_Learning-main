'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatInterface } from '@/components/chat/chat-interface';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useChat } from '@/hooks/use-chat';

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const { getChat } = useChat();
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChat() {
      try {
        const chatData = await getChat(chatId);
        setChat(chatData);
      } catch (error) {
        console.error("Error loading chat:", error);
      } finally {
        setLoading(false);
      }
    }

    loadChat();
  }, [chatId, getChat]);

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        <div className="py-2 px-4 border-b flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push('/chat')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold ml-2">
            {loading ? 'Loading...' : chat?.name || 'Chat'}
          </h1>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatInterface chatId={chatId} />
        </div>
      </div>
    </AppShell>
  );
}