'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface ChatPartner {
  _id: string;
  name: string;
  image?: string;
  profilePic?: string;
}

interface Chat {
  _id: string;
  participants: string[];
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  updatedAt: string;
  partner?: ChatPartner;
}

export default function ChatList() {
  const router = useRouter();
  const { data: session } = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChatPartner(chatId: string) {
      try {
        console.log("📩 Fetching partner for chat:", chatId);
        const res = await fetch(`/api/chat/${chatId}/partner`);
        
        if (!res.ok) {
          console.error("❌ Failed to fetch partner:", res.status);
          return null; // Don't crash app if API fails
        }

        const data = await res.json();
        console.log("✅ Partner data received for chat:", chatId);
        return data;
      } catch (error) {
        console.error("🚨 Error in fetchChatPartner:", error);
        return null; // Return null instead of crashing
      }
    }

    async function fetchChats() {
      try {
        setLoading(true);
        console.log("📩 Fetching all chats...");
        const res = await fetch("/api/chat");
        
        if (!res.ok) {
          throw new Error(`Failed to fetch chats: ${res.status}`);
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          console.error("❌ Invalid chat data:", data);
          setChats([]);
          setLoading(false);
          return;
        }
        
        console.log(`✅ Retrieved ${data.length} chats`);
        
        // Process chats with better error handling
        const enhancedChats = await Promise.all(
          data.map(async (chat) => {
            try {
              const partner = await fetchChatPartner(chat._id);
              return { ...chat, partner };
            } catch (err) {
              console.error(`Failed to enhance chat ${chat._id}:`, err);
              // Return chat without partner data rather than failing completely
              return { ...chat, partner: null };
            }
          })
        );
        
        setChats(enhancedChats);
      } catch (error) {
        console.error("🚨 Failed to fetch chats:", error);
        setError("Failed to load your conversations");
        setChats([]);
      } finally {
        setLoading(false);
      }
    }

    fetchChats();

        // Get partner info for each chat
        const chatsWithPartner = await Promise.all(
          data.map(async (chat) => {
            const partner = await fetchChatPartner(chat._id);
            return { ...chat, partner };
          })
        );

        setChats(chatsWithPartner);
        setError(null);
      } catch (error: any) {
        console.error("Failed to fetch chats:", error);
        setError(error.message || "Failed to load chats");
        setChats([]);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchChats();
    }
  }, [session?.user]);

  const navigateToChat = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-2 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4 p-3 animate-pulse">
            <div className="rounded-full bg-gray-300 dark:bg-gray-700 h-12 w-12"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        <p>Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-blue-500 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        <p>No conversations yet</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center p-3 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 mr-4"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 mb-3">❌ {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-gray-500">
        <p className="mb-2">No conversations yet</p>
        <p className="text-sm">Start a new chat from the community page</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-1">
      {chats.map((chat) => (
        <div
          key={chat._id}
          className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
          onClick={() => navigateToChat(chat._id)}
        >
          <Avatar className="h-12 w-12 mr-4">
            <AvatarImage 
              src={chat.partner?.image || chat.partner?.profilePic || ""} 
              alt={chat.partner?.name || "User"} 
            />
            <AvatarFallback>
              {chat.partner?.name ? chat.partner.name.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <h3 className="font-medium truncate">
                {chat.partner?.name || "Unknown User"}
              </h3>
              {chat.lastMessage?.createdAt && (
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: true })}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">
              {chat.lastMessage?.content || "No messages yet"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}