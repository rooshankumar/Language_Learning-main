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
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { joinChat, useChat } from "@/hooks/use-chat";
import { Message } from "@/hooks/use-chat";

export default function ChatPage() {
  const params = useParams();
  const chatId = params?.chatId as string;
  const { data: session } = useSession();
  const { getChatPartner } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<any>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!chatId || !session?.user?.id) return;

    const joinChatRoom = async () => {
      try {
        setIsJoining(true);
        await joinChat(chatId, session.user.id);
        
        // Fetch chat partner
        const partnerData = await getChatPartner(chatId);
        if (partnerData) {
          setPartner(partnerData);
        }
      } catch (error) {
        console.error("Failed to join chat:", error);
      } finally {
        setIsJoining(false);
      }
    };

    joinChatRoom();
  }, [chatId, session?.user?.id, getChatPartner]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        {isJoining ? (
          <p>Loading chat...</p>
        ) : partner ? (
          <h1 className="text-xl font-bold">{partner.name}</h1>
        ) : (
          <p>Chat not found</p>
        )}
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length > 0 ? (
          messages.map((message) => (
            <div 
              key={message._id}
              className={`mb-4 ${
                message.sender === session?.user?.id 
                  ? "text-right" 
                  : "text-left"
              }`}
            >
              <div 
                className={`inline-block p-3 rounded-lg ${
                  message.sender === session?.user?.id 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-200"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No messages yet</p>
        )}
      </div>
      
      <div className="p-4 border-t">
        <form className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
