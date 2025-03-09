'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import chatService, { Message, createChat } from '@/lib/chat-service';
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

export async function createChatWithUser(userId: string): Promise<string | null> {
  try {
    if (!userId || userId.trim() === '') {
      throw new Error('Valid user ID is required');
    }

    console.log('Creating chat with user ID:', userId);

    // Use the helper function from chat-service.ts instead for consistent error handling
    const result = await createChat(userId);

    if (!result.success) {
      console.error('Chat creation failed:', result.error);
      console.error('Chat creation failure details:', result.data);

      // Show more detailed error message
      if (result.error.includes('JSON')) {
        throw new Error(`Server returned invalid data: ${result.error}`);
      } else {
        throw new Error(result.error || 'Failed to create chat');
      }
    }

    if (!result.chatId) {
      console.error('No chat ID returned from createChat function');
      console.error('Response data:', result.data);
      throw new Error('No chat ID returned from the server');
    }

    console.log('Successfully created/found chat with ID:', result.chatId);
    return result.chatId;
  } catch (error: any) {
    console.error('Error in createChatWithUser:', error.message || String(error));
    console.error('Error stack:', error.stack);
    // Provide more specific error message to the UI
    throw new Error(`Failed to create chat: ${error.message || 'Unknown error'}`);
  }
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

      // Check connection status periodically
      const checkConnection = setInterval(() => {
        setIsConnected(service.isConnected());
      }, 5000);

      setIsConnected(service.isConnected());
      socketInitialized.current = true;

      // Set up cleanup
      return () => {
        clearInterval(checkConnection);
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

    // Fetch updated user profiles
    const fetchUserProfiles = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch updated user profiles');
        }
        const data = await response.json();
        // Update online users with latest profile data
        if (data.users && Array.isArray(data.users)) {
          const onlineUserIds = onlineUsers;
          const updatedOnlineUsers = onlineUserIds.filter(id => 
            data.users.some(user => user.id === id || user._id === id)
          );
          setOnlineUsers(updatedOnlineUsers);
        }
      } catch (error) {
        console.error('Error fetching user profiles:', error);
      }
    };

    // Fetch initial data and then set up interval for refreshing
    fetchUserProfiles();
    const profileRefreshInterval = setInterval(fetchUserProfiles, 60000); // Refresh every minute

    return () => {
      unsubscribe();
      clearInterval(profileRefreshInterval);
    };
  }, []);

  // Handle typing indicators
  useEffect(() => {
    if (!currentChatId.current) return;

    const unsubscribe = chatService.subscribeToTypingIndicator(
      currentChatId.current,
      (data) => {
        setIsTyping(prev => ({
          ...prev,
          [data.username]: data.isTyping
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
  const joinChat = useCallback(async (chatId: string) => {
    if (!chatId) {
      console.error('Cannot join chat: Invalid chat ID');
      setError('Invalid chat ID');
      return false;
    }

    try {
      // Update connection status before attempting to join
      setIsConnected(chatService.isConnected());

      // If not connected, try to reset the service
      if (!chatService.isConnected() && socketInitialized.current) {
        console.warn('⚠️ Socket disconnected, attempting to reconnect before joining chat');
        chatService.reset();

        // Brief delay to allow reset to take effect
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsConnected(chatService.isConnected());
      }

      currentChatId.current = chatId;
      const joined = await chatService.joinChat(chatId);

      // Update connection status after join attempt
      setIsConnected(chatService.isConnected());

      // Reset typing indicators when joining a new chat
      setIsTyping({});

      if (!joined) {
        setError('Failed to join chat. Please try again.');
      } else {
        setError(null);
      }

      return joined;
    } catch (err: any) {
      console.error('Error joining chat:', err);
      setError(err.message || 'Failed to join chat');
      return false;
    }
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

  // Compare message sender with current user
  const isCurrentUser = (message: any) => {
    // Handle both string comparison and ObjectId comparison
    const senderId = message.sender?._id || message.sender?.id;
    const userId = session?.user?.id;

    return senderId === userId;
  };

  return {
    messages,
    isConnected: isConnected && socketInitialized.current,
    isTyping,
    onlineUsers,
    error,
    sendMessage,
    loadChatHistory,
    joinChat,
    setTyping,
    isCurrentUser
  };
}