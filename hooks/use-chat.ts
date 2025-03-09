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

export async function createChatWithUser(userId: string) {
  try {
    const response = await fetch(`/api/chat/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create chat");
    }

    return await response.json();
  } catch (error) {
    console.error("Chat creation failed:", error);
    throw error;
  }
}

export async function joinChat(chatId: string, userId: string) {
  try {
    const response = await fetch(`/api/chat/${chatId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to join chat");
    }

    return await response.json();
  } catch (error) {
    console.error("Error joining chat:", error);
    throw error;
  }
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
    try {
      if (!session?.user?.id) {
        console.error('Cannot fetch chat partner: User not authenticated');
        return null;
      }

      console.log(`📩 Fetching partner for chat: ${chatId}`);
      
      // Retry mechanism for more resilience
      const maxRetries = 2;
      let retries = 0;
      let response;
      
      while (retries <= maxRetries) {
        try {
          response = await fetch(`/api/chat/${chatId}/partner`);
          break; // Exit the loop if fetch succeeds
        } catch (fetchError) {
          retries++;
          console.warn(`Retry ${retries}/${maxRetries} for partner fetch`);
          if (retries > maxRetries) throw fetchError;
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!response?.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Failed to fetch chat partner with status ${response.status}:`, errorData);
        throw new Error(`Failed to fetch chat partner: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || (!data.name && !data._id)) {
        console.error('❌ Invalid partner data received:', data);
        return null;
      }
      
      console.log('✅ Chat partner fetched successfully:', data.name || data._id);
      return {
        _id: data._id,
        name: data.name || data.displayName || "Unknown User",
        profilePic: data.profilePic || data.image || null,
        email: data.email || null
      };
    } catch (error) {
      console.error('🚨 Error fetching chat partner:', error);
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