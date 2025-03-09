
'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { useSession } from 'next-auth/react';
import { useChat } from '@/hooks/use-chat';
import { ChatInterface } from '@/components/chat/chat-interface';
import { Loader2 } from 'lucide-react';

interface ChatPartner {
  _id: string;
  name: string;
  image?: string;
  online?: boolean;
  lastSeen?: Date;
}

export default function ChatPage() {
  const pathname = usePathname();
  const chatId = pathname.split('/').pop();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatPartner, setChatPartner] = useState<ChatPartner | null>(null);
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
    if (!chatId || !session?.user) return;
    
    try {
      const response = await fetch(`/api/chat/${chatId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch chat');
      }
      
      const chatData = await response.json();
      
      // Find partner in the chat
      if (chatData.partnerDetails && chatData.partnerDetails.length > 0) {
        setChatPartner(chatData.partnerDetails[0]);
      }
      
      return chatData;
    } catch (error: any) {
      console.error('Error fetching chat data:', error);
      setError(error.message || 'Failed to fetch chat data');
      return null;
    }
  }, [chatId, session?.user]);

  // Typing indicator handler
  const handleTyping = useCallback((isTyping: boolean) => {
    if (chatId) {
      setTyping(chatId, isTyping);
    }
  }, [chatId, setTyping]);

  // Initialize chat
  useEffect(() => {
    let mounted = true;
    
    const initializeChat = async () => {
      if (!chatId || !session?.user) return;
      
      try {
        setLoading(true);
        
        // Join the chat room
        joinChat(chatId);
        
        // Load chat history
        await loadChatHistory(chatId);
        
        // Fetch chat data
        const chatData = await fetchChatData();
        
        if (!mounted) return;
        
        if (!chatData) {
          setError('Failed to load chat data');
        }
      } catch (error: any) {
        console.error('Error initializing chat:', error);
        if (mounted) {
          setError(error.message || 'Failed to initialize chat');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    initializeChat();
    
    return () => {
      mounted = false;
    };
  }, [chatId, session?.user, joinChat, loadChatHistory, fetchChatData]);

  // Send message handler
  const handleSendMessage = useCallback(
    (content: string) => {
      if (!isConnected || !chatId) {
        setError('Cannot send message: Socket not connected');
        return;
      }
      
      try {
        sendMessage(content, chatId);
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
          isTyping={isTyping[chatId || '']}
          onTyping={handleTyping}
        />
      </div>
    </AppShell>
  );
}
