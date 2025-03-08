"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ChatWindow } from './chat-window';
import { AppShell } from '../app-shell';
import { subscribeToChatMessages, markMessagesAsRead } from '@/lib/chat-service';

interface ChatDetailPageProps {
  chatId: string;
}

export default function ChatDetailPage({ chatId }: ChatDetailPageProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !chatId) return;

    // Subscribe to chat messages
    const unsubscribe = subscribeToChatMessages(chatId, (messages) => {
      setMessages(messages);
      setLoading(false);
    });

    // Mark messages as read when component mounts
    markMessagesAsRead(chatId, user.uid).catch(error => {
      console.error('Error marking messages as read:', error);
    });

    return () => {
      unsubscribe && unsubscribe();
    };
  }, [chatId, user]);

  if (!user) {
    return <div className="p-4">Please sign in to view messages</div>;
  }

  if (loading) {
    return <div className="p-4">Loading messages...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <AppShell>
      <ChatWindow
        chatId={chatId}
        recipientId={messages[0]?.recipientId === user.uid ? messages[0]?.senderId : messages[0]?.recipientId}
        messages={messages}
      />
    </AppShell>
  );
}