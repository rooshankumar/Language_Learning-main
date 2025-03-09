'use client';

import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/lib/chat-service';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';

interface ChatState {
  messages: Message[];
  isTyping: boolean;
  isConnected: boolean;
}

interface ChatUser {
  _id: string;
  name: string;
  image?: string;
  profilePic?: string;
  online?: boolean;
  lastSeen?: Date;
}

interface Chat {
  _id: string;
  participants: string[];
  lastMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  partner?: ChatUser;
}

const initialState: ChatState = {
  messages: [],
  isTyping: false,
  isConnected: false
};

export function useChat() {
  const [state, setState] = useState<ChatState>(initialState);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  // Fetch user profiles
  useEffect(() => {
    const fetchUserProfiles = async () => {
      try {
        console.log("📌 Fetching user profiles...");
        const res = await fetch("/api/users");

        if (!res.ok) {
          console.error(`❌ Failed to fetch users: ${res.status}`);
          throw new Error("Failed to fetch users");
        }

        const data = await res.json();
        console.log(`✅ Retrieved ${data.length} user profiles`);
        setUsers(data);
        setError(null);
      } catch (err: any) {
        console.error("🚨 Failed to fetch user profiles:", err.message);
        setError(err.message || "Failed to fetch user profiles");
      }
    };

    if (session?.user) {
      fetchUserProfiles();
    }
  }, [session?.user]);

  // Initialize socket connection
  useEffect(() => {
    if (!session?.user) return;

    console.log('📌 Initializing socket connection...');
    const newSocket = io('/api/socket', {
      path: '/api/socketio',
      transports: ['websocket'],
      autoConnect: true,
      auth: {
        token: session?.user.id
      }
    });

    setSocket(newSocket);

    return () => {
      console.log('Disconnecting socket...');
      newSocket.disconnect();
    };
  }, [session?.user]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      console.log('🔌 Socket connected!');
      setState(prev => ({ ...prev, isConnected: true }));
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected!');
      setState(prev => ({ ...prev, isConnected: false }));
    });

    socket.on('message', (message: Message) => {
      console.log('📩 New message received:', message);
      // Play notification sound if message is not from current user
      if (message.senderId !== session?.user?.id) {
        const audio = new Audio('/assets/notification.mp3');
        audio.play().catch(err => console.log('Audio play error:', err));
      }

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, message]
      }));
    });

    socket.on('typing', (isTyping: boolean) => {
      setState(prev => ({ ...prev, isTyping }));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('message');
      socket.off('typing');
    };
  }, [socket, session?.user?.id]);

  const loadChatHistory = useCallback(async (chatId: string) => {
    if (!socket || !session?.user) return;

    try {
      console.log(`📌 Loading chat history for chat ${chatId}...`);
      const response = await fetch(`/api/chat/${chatId}/messages`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Failed to load chat history: ${response.status}`, errorData);
        throw new Error(errorData.error || 'Failed to load chat history');
      }

      const messages = await response.json();
      console.log(`✅ Retrieved ${messages.length} messages for chat ${chatId}`);
      setState(prev => ({ ...prev, messages }));
    } catch (error: any) {
      console.error('🚨 Error loading chat history:', error.message);
      setError(error.message || 'Failed to load chat history');
    }
  }, [socket, session?.user]);

  const sendMessage = useCallback((content: string, chatId: string) => {
    if (!socket || !session?.user || !content.trim()) return;

    const message: Partial<Message> = {
      chatId,
      senderId: session.user.id,
      content,
      createdAt: new Date().toISOString()
    };

    console.log('📤 Sending message:', message);
    socket.emit('message', message);

    // Optimistically add message to state
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message as Message]
    }));
  }, [socket, session?.user]);

  const joinChat = useCallback((chatId: string) => {
    if (!socket) return;
    console.log(`🔗 Joining chat room: ${chatId}`);
    socket.emit('joinChat', chatId);
  }, [socket]);

  const setTyping = useCallback((isTyping: boolean, chatId: string) => {
    if (!socket) return;
    socket.emit('typing', { isTyping, chatId });
  }, [socket]);

  const getUserById = useCallback((userId: string) => {
    return users.find(user => user._id === userId) || null;
  }, [users]);

  const createChatWithUser = useCallback(async (partnerId: string) => {
    if (!session?.user?.id || !partnerId) {
      console.error("🚨 Missing user ID or partner ID");
      throw new Error("User ID and partner ID are required");
    }

    try {
      console.log(`📌 Creating chat with partner ${partnerId}...`);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ 
          partnerId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Chat creation failed with status ${response.status}:`, errorData);
        throw new Error(errorData.error || "Failed to create chat");
      }

      const newChat = await response.json();
      console.log(`✅ Chat created successfully:`, newChat);
      
      // Update chats state with the new chat
      setChats(prevChats => [...prevChats, newChat]);
      
      return newChat;
    } catch (error: any) {
      console.error("🚨 Failed to create chat:", error.message);
      setError(error.message || "Failed to create chat");
      throw error;
    }
  }, [session?.user?.id]);

  return {
    ...state,
    users,
    chats,
    error,
    sendMessage,
    loadChatHistory,
    joinChat,
    setTyping,
    getUserById,
    createChatWithUser
  };

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export interface ChatPartner {
  _id: string;
  name: string;
  profilePic?: string;
  email?: string;
}

export interface Message {
  _id: string;
  chatId: string;
  content: string;
  sender: string;
  createdAt: Date;
}

export interface Chat {
  _id: string;
  participants: string[];
  lastMessage?: {
    content: string;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const useChat = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = useCallback(async () => {
    if (!session?.user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.warn('API returned non-array data:', data);
        setChats([]);
        return;
      }
      
      setChats(data);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chats');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const createChat = useCallback(async (targetUserId: string) => {
    if (!session?.user) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const chat = await response.json();
      
      // Update chats list with the new chat
      setChats(prevChats => {
        // Check if chat already exists in the list
        const chatExists = prevChats.some(c => c._id === chat._id);
        if (chatExists) return prevChats;
        return [...prevChats, chat];
      });

      return chat;
    } catch (err) {
      console.error('Failed to create chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to create chat');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const getChatPartner = useCallback(async (chatId: string): Promise<ChatPartner | null> => {
    if (!session?.user) {
      return null;
    }

    try {
      const response = await fetch(`/api/chat/${chatId}/partner`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Failed to fetch chat partner:', err);
      return null;
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      fetchChats();
    }
  }, [fetchChats, session]);

  return {
    chats,
    isLoading,
    error,
    fetchChats,
    createChat,
    getChatPartner
  };
};

}