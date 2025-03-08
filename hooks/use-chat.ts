import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Socket, io } from 'socket.io-client';
import { useAuth } from '@/contexts/auth-context';
import { getUserChats, getChatWithUser, sendMessage, createChat } from '@/lib/chat-service';

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
  chats?: any[];
  fetchChats?: () => Promise<void>;
  getChatWith?: (userId: string) => Promise<any>;
  sendChatMessage?: (chatId: string, text: string) => Promise<any>;
}

export function useChat(chatId?: string, recipientId?: string): UseChatReturn {
  const { data: session } = useSession();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<RecipientProfile | null>(null);
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

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

  const getChatWith = async (userId: string) => {
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

  const sendChatMessage = async (chatId: string, text: string) => {
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

  // Fetch recipient profile - This needs to be rewritten for MongoDB
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
      if (!user || !content.trim() || !chatId) return;

      // MongoDB message sending logic needed here.
      console.error("MongoDB sendMessage not implemented");

    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    }
  }, [chatId, recipientId, user]);

  const createOrGetChat = useCallback(async (recipientId: string): Promise<string> => {
    try {
      if (!user) throw new Error('User must be authenticated');
      if (!session?.user?.id) throw new Error('Session user ID is required');

      const chat = await getChatWith(recipientId);
      return chat?._id || "";

    } catch (err) {
      console.error('Error creating/getting chat:', err);
      throw err;
    }
  }, [user, session]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchChats();
    }
  }, [session?.user?.id]);

  return {
    chats,
    messages,
    sendMessage,
    loading,
    error,
    recipientProfile: recipientProfile || undefined,
    createOrGetChat,
    fetchChats,
    getChatWith,
    sendChatMessage
  };
}

// Helper function for community page to create a chat with another user
export async function createChatWithUser(userId: string, recipientId: string): Promise<string> {
  try {
    const newChat = await createChat(userId, recipientId);
    if (newChat.success) {
      return newChat.chat._id;
    }
    throw new Error('Failed to create chat');
  } catch (err) {
    console.error('Error creating chat:', err);
    throw err;
  }
}

export default useChat;