
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import chatService, { Message, Chat, createChat } from '@/lib/chat-service';
import { useSession } from 'next-auth/react';

export interface ChatHookReturn {
  messages: Message[];
  isConnected: boolean;
  isTyping: { [key: string]: boolean };
  onlineUsers: string[];
  error: string | null;
  sendMessage: (content: string, chatId: string) => boolean;
  loadChatHistory: (chatId: string) => Promise<void>;
  joinChat: (chatId: string) => void;
  setTyping: (chatId: string, isTyping: boolean) => void;
}

export function useChat(): ChatHookReturn {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState<{ [key: string]: boolean }>({});
  
  const socketInitialized = useRef(false);
  const currentChatId = useRef<string | null>(null);

  // Initialize the socket connection
  useEffect(() => {
    if (!session?.user || socketInitialized.current) return;

    try {
      chatService.initialize(
        session.user.id,
        session.user.name || 'Anonymous User'
      );
      
      setIsConnected(true);
      socketInitialized.current = true;

      // Subscribe to online users
      const unsubscribeOnlineUsers = chatService.subscribeToOnlineUsers((users) => {
        setOnlineUsers(users);
      });

      return () => {
        unsubscribeOnlineUsers();
        chatService.disconnect();
        socketInitialized.current = false;
      };
    } catch (error: any) {
      console.error('Error initializing chat:', error);
      setError(error.message || 'Failed to connect to chat service');
    }
  }, [session]);

  // Join a chat room
  const joinChat = useCallback((chatId: string) => {
    if (!isConnected) {
      setError('Cannot join chat: not connected');
      return;
    }
    
    currentChatId.current = chatId;
    chatService.joinChat(chatId);
    
    // Subscribe to messages for this chat
    const unsubscribeMessages = chatService.subscribeToMessages(chatId, (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    // Subscribe to typing indicators for this chat
    const unsubscribeTyping = chatService.subscribeToTypingIndicator(chatId, (data) => {
      setIsTyping(prev => ({
        ...prev,
        [data.username]: data.isTyping
      }));
    });
    
    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [isConnected]);

  // Send a message
  const sendMessage = useCallback((content: string, chatId: string) => {
    if (!isConnected) {
      setError('Cannot send message: not connected');
      return false;
    }

    return chatService.sendMessage(chatId, content);
  }, [isConnected]);

  // Send typing indicator
  const setTyping = useCallback((chatId: string, isTyping: boolean) => {
    if (!isConnected) return;
    chatService.sendTypingIndicator(chatId, isTyping);
  }, [isConnected]);

  // Load chat history
  const loadChatHistory = useCallback(async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/messages`);
      if (!response.ok) {
        throw new Error('Failed to load chat history');
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error: any) {
      console.error('Error loading chat history:', error);
      setError(error.message || 'Failed to load chat history');
    }
  }, []);

  return {
    messages,
    isConnected,
    isTyping,
    onlineUsers,
    error,
    sendMessage,
    loadChatHistory,
    joinChat,
    setTyping
  };
}

export default useChat;

// Helper function for community page to create a chat with another user
export async function createChatWithUser(recipientId: string): Promise<string> {
  try {
    const result = await createChat('', recipientId);
    if (result.success && result.chat) {
      return result.chat._id;
    }
    throw new Error(result.error || 'Failed to create chat');
  } catch (err: any) {
    console.error('Error creating chat:', err);
    throw err;
  }
}
