
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/app-shell';
import ChatInterface from '@/components/chat/chat-interface';
import useChat from '@/hooks/use-chat';
import { Loader2 } from 'lucide-react';

export default function Page() {
  const { chatId } = useParams();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatData, setChatData] = useState<any>(null);
  const [chatPartner, setChatPartner] = useState<any>(null);

  const {
    messages,
    isConnected,
    isTyping,
    sendMessage,
    loadChatHistory,
    joinChat,
    setTyping
  } = useChat();

  // Fetch chat data
  const fetchChatData = useCallback(async () => {
    try {
      if (!chatId || !session?.user?.id) return;
      
      setLoading(true);
      const response = await fetch(`/api/chat/${chatId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch chat: ${response.statusText}`);
      }
      
      const data = await response.json();
      setChatData(data);
      
      // Set chat partner (the other participant)
      if (data && data.participants) {
        const partnerId = data.participants.find(
          (id: string) => id !== session.user.id
        );
        
        if (partnerId) {
          await fetchChatPartner(partnerId);
        }
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching chat data:', err);
      setError(err.message || 'Failed to load chat');
      setLoading(false);
    }
  }, [chatId, session?.user?.id]);

  // Fetch chat partner info
  const fetchChatPartner = async (partnerId: string) => {
    try {
      const response = await fetch(`/api/users/${partnerId}`);
      
      if (response.ok) {
        const userData = await response.json();
        setChatPartner(userData);
      }
    } catch (err) {
      console.error('Error fetching chat partner:', err);
    }
  };

  // Initialize socket connection and load chat history
  useEffect(() => {
    if (!session?.user?.id || !chatId) return;
    
    const initializeChat = async () => {
      try {
        // Load chat data first
        await fetchChatData();
        
        // Then load message history
        await loadChatHistory(chatId as string);
        
        // Join the chat room to receive new messages
        const unsubscribe = joinChat(chatId as string);
        
        return () => {
          if (unsubscribe) unsubscribe();
        };
      } catch (err: any) {
        console.error('Error initializing chat:', err);
        setError(err.message || 'Failed to initialize chat');
      }
    };
    
    initializeChat();
  }, [chatId, session?.user?.id, loadChatHistory, joinChat, fetchChatData]);

  // Handle typing indicator
  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (chatId) {
        setTyping(chatId as string, isTyping);
      }
    },
    [chatId, setTyping]
  );

  // Send message handler
  const handleSendMessage = useCallback(
    (content: string) => {
      if (!isConnected || !chatId) {
        setError('Cannot send message: Socket not connected');
        return;
      }
      
      try {
        sendMessage(content, chatId as string);
        // Reset typing indicator
        handleTyping(false);
      } catch (err: any) {
        console.error('Error sending message:', err);
        setError(err.message || 'Failed to send message');
      }
    },
    [chatId, isConnected, sendMessage, handleTyping]
  );

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-500">Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="h-full">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          chatPartner={chatPartner}
          isTyping={isTyping}
        />
      </div>
    </AppShell>
  );
}
