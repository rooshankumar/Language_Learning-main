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

const initialState: ChatState = {
  messages: [],
  isTyping: false,
  isConnected: false
};

export function useChat() {
  const [state, setState] = useState<ChatState>(initialState);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<ChatUser[]>([]);
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

  return {
    ...state,
    users,
    error,
    sendMessage,
    loadChatHistory,
    joinChat,
    setTyping,
    getUserById
  };
}