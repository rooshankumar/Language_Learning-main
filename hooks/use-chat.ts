
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import chatService, { Message } from '@/lib/chat-service';
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
      const service = chatService.initialize(
        session.user.id,
        session.user.name || 'Anonymous User'
      );
      
      setIsConnected(service.isConnected());
      socketInitialized.current = true;
      
      // Set up cleanup
      return () => {
        chatService.disconnect();
        socketInitialized.current = false;
      };
    } catch (error: any) {
      console.error('Error initializing chat service:', error);
      setError(error.message || 'Failed to connect to chat service');
    }
  }, [session?.user]);

  // Handle messages
  useEffect(() => {
    if (!currentChatId.current) return;
    
    const unsubscribe = chatService.subscribeToMessages(
      currentChatId.current,
      (message) => {
        setMessages((prevMessages) => {
          // Check if message already exists
          const exists = prevMessages.some(m => m._id === message._id);
          if (exists) return prevMessages;
          return [...prevMessages, message];
        });
      }
    );
    
    return unsubscribe;
  }, [currentChatId.current]);

  // Handle online users
  useEffect(() => {
    const unsubscribe = chatService.subscribeToOnlineUsers((users) => {
      setOnlineUsers(users);
    });
    
    return unsubscribe;
  }, []);

  // Handle typing indicators
  useEffect(() => {
    if (!currentChatId.current) return;
    
    const unsubscribe = chatService.subscribeToTypingIndicator(
      currentChatId.current,
      (data) => {
        setIsTyping(prev => ({
          ...prev,
          [currentChatId.current!]: data.isTyping
        }));
      }
    );
    
    return unsubscribe;
  }, [currentChatId.current]);

  // Load chat history
  const loadChatHistory = useCallback(async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/messages`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data);
    } catch (error: any) {
      console.error('Error loading chat history:', error);
      setError(error.message || 'Failed to load chat history');
      throw error;
    }
  }, []);

  // Join chat
  const joinChat = useCallback((chatId: string) => {
    currentChatId.current = chatId;
    chatService.joinChat(chatId);
  }, []);

  // Send message
  const sendMessage = useCallback((content: string, chatId: string) => {
    if (!content.trim()) return false;
    return chatService.sendMessage(chatId, content);
  }, []);

  // Set typing indicator
  const setTyping = useCallback((chatId: string, isTyping: boolean) => {
    chatService.sendTypingIndicator(chatId, isTyping);
  }, []);

  return {
    messages,
    isConnected: isConnected && socketInitialized.current,
    isTyping,
    onlineUsers,
    error,
    sendMessage,
    loadChatHistory,
    joinChat,
    setTyping
  };
}
