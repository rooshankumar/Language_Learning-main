import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getUserChats, getChatWithUser, sendMessage, createChat } from '@/lib/chat-service';

export function useChat() {
  const { data: session } = useSession();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChats = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const result = await getUserChats(session.user.id);

      if (result.success) {
        setChats(result.chats);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error in fetchChats:', err);
      setError('Failed to fetch chats');
    } finally {
      setLoading(false);
    }
  };

  const getChatWith = async (userId) => {
    if (!session?.user?.id) return null;

    try {
      // Try to find existing chat
      const existingChat = await getChatWithUser(session.user.id, userId);

      if (existingChat.success && existingChat.chat) {
        return existingChat.chat;
      }

      // Create new chat if none exists
      const newChat = await createChat(session.user.id, userId);

      if (newChat.success) {
        return newChat.chat;
      }

      return null;
    } catch (err) {
      console.error('Error in getChatWith:', err);
      return null;
    }
  };

  const sendChatMessage = async (chatId, text) => {
    if (!session?.user?.id || !chatId || !text) return null;

    try {
      const result = await sendMessage(chatId, session.user.id, text);

      if (result.success) {
        // Refresh chats
        fetchChats();
        return result.message;
      }

      return null;
    } catch (err) {
      console.error('Error in sendChatMessage:', err);
      return null;
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchChats();
    }
  }, [session?.user?.id]);

  return {
    chats,
    loading,
    error,
    fetchChats,
    getChatWith,
    sendChatMessage
  };
}

export default useChat;

import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket, io } from 'socket.io-client';
import { useAuth } from '@/contexts/auth-context';
import { startChat, getUserChats, sendMessage as sendMongoMessage, getChatMessages } from '@/lib/chat-service';

// Define message type
export interface Message {
  id?: string;
  senderId: string;
  senderName?: string;
  recipientId: string;
  content: string;
  timestamp: string;
  read: boolean;
  chatId?: string;
  text?: string; // Added for compatibility with chat-window.tsx
}

// Define recipient profile type
export interface RecipientProfile {
  photoURL?: string;
  displayName?: string;
  isOnline?: boolean;
}

// Define chat hook return type
interface UseChatReturn {
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  recipientProfile?: RecipientProfile;
  createOrGetChat?: (recipientId: string) => Promise<string>;
}

export function useChat(chatId: string, recipientId: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<RecipientProfile | null>(null);
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  // Fetch recipient profile -  This needs to be rewritten for MongoDB
  useEffect(() => {
    if (!user || !recipientId) return;

    const fetchRecipientProfile = async () => {
      try {
        // MongoDB profile fetch logic needed here
        console.error("MongoDB recipient profile fetch not implemented");
      } catch (err) {
        console.error("Error fetching recipient profile:", err);
      }
    };

    fetchRecipientProfile();
  }, [recipientId, user]);

  // Send a message - This needs to be rewritten for MongoDB
  const sendMessage = useCallback(async (content: string) => {
    try {
      if (!user || !content.trim()) return;

      // MongoDB message sending logic needed here.  sendMongoMessage likely needs parameters
      console.error("MongoDB sendMessage not implemented");

    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    }
  }, [chatId, recipientId, user]);

  const createOrGetChat = useCallback(async (recipientId: string): Promise<string> => {
    try {
      if (!user) throw new Error('User must be authenticated');

      // MongoDB chat creation/retrieval logic needed here
      console.error("MongoDB createOrGetChat not implemented");
      return ""; // Placeholder

    } catch (err) {
      console.error('Error creating/getting chat:', err);
      throw err;
    }
  }, [user]);

  return {
    messages,
    sendMessage,
    loading,
    error,
    recipientProfile: recipientProfile || undefined,
    createOrGetChat
  };

}

// Helper function for community page to create a chat with another user - Needs MongoDB implementation
export async function createChat(userId: string, userName: string, recipientId: string): Promise<string> {
  try {
    // MongoDB chat creation logic needed here.
    console.error("MongoDB createChat not implemented");
    return ""; // Placeholder

  } catch (err) {
    console.error('Error creating chat:', err);
    throw err;
  }
}

interface UseChatSocketReturn {
  socket: Socket | null;
  connected: boolean;
  messages: Message[];
  sendMessage: (recipientId: string, content: string, chatId?: string) => void;
  markAsRead: (chatId: string) => void;
  setTyping: (recipientId: string, isTyping: boolean) => void;
  isUserTyping: Record<string, boolean>;
  loading: boolean;
  error: string | null;
}

export function useChatSocket(): UseChatSocketReturn {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isUserTyping, setIsUserTyping] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store typing timeout IDs
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Initialize Socket.io connection
  useEffect(() => {
    if (!user) return;

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080';
    const socketClient = io(SOCKET_URL);

    socketClient.on('connect', () => {
      console.log('Socket connected');
      // Authenticate with socket server
      socketClient.emit('authenticate', {
        uid: user.uid,
        displayName: user.displayName || 'User'
      });
    });

    socketClient.on('authenticated', () => {
      console.log('Socket authenticated');
      setConnected(true);
      setLoading(false);
    });

    socketClient.on('auth_error', (err) => {
      console.error('Socket authentication error:', err);
      setError('Authentication error with chat server');
      setLoading(false);
    });

    socketClient.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketClient.on('error', (err) => {
      console.error('Socket error:', err);
      setError(err.message || 'Error with chat connection');
    });

    socketClient.on('new_message', (message: Message) => {
      console.log('New message received:', message);
      setMessages(prevMessages => [...prevMessages, message]);
    });

    socketClient.on('message_sent', (message: Message) => {
      console.log('Message sent confirmation:', message);
      // This ensures we don't duplicate messages that might also come from Firestore
      setMessages(prevMessages => {
        // Check if we already have this message (by comparing content and timestamp)
        const exists = prevMessages.some(
          m => m.senderId === message.senderId && 
               m.content === message.content && 
               m.timestamp === message.timestamp
        );

        if (exists) return prevMessages;
        return [...prevMessages, message];
      });
    });

    socketClient.on('user_typing', ({ userId, isTyping }) => {
      setIsUserTyping(prev => ({
        ...prev,
        [userId]: isTyping
      }));

      // Clear typing indicator after 3 seconds if no updates
      if (isTyping && typingTimeouts.current[userId]) {
        clearTimeout(typingTimeouts.current[userId]);
      }

      if (isTyping) {
        typingTimeouts.current[userId] = setTimeout(() => {
          setIsUserTyping(prev => ({
            ...prev,
            [userId]: false
          }));
        }, 3000);
      }
    });

    setSocket(socketClient);

    // Cleanup on unmount
    return () => {
      Object.values(typingTimeouts.current).forEach(timeout => clearTimeout(timeout));
      socketClient.disconnect();
    };
  }, [user]);

  // Function to send a message
  const sendMessage = useCallback((recipientId: string, content: string, chatId?: string) => {
    if (!socket || !connected || !user) {
      setError('Cannot send message: not connected');
      return;
    }

    const timestamp = new Date().toISOString();

    socket.emit('send_message', {
      recipientId,
      content,
      timestamp,
      chatId
    });
  }, [socket, connected, user]);

  // Function to mark messages as read
  const markAsRead = useCallback((chatId: string) => {
    if (!socket || !connected || !user) return;

    socket.emit('mark_as_read', { chatId });
  }, [socket, connected, user]);

  // Function to indicate typing status
  const setTyping = useCallback((recipientId: string, isTyping: boolean) => {
    if (!socket || !connected || !user) return;

    socket.emit('typing', { recipientId, isTyping });
  }, [socket, connected, user]);

  return {
    socket,
    connected,
    messages,
    sendMessage,
    markAsRead,
    setTyping,
    isUserTyping,
    loading,
    error
  };
}