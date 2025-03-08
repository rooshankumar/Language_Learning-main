
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function Chat() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    // Fetch chats using client-side fetch
    const fetchChats = async () => {
      try {
        const response = await fetch("/api/chats");
        if (response.ok) {
          const data = await response.json();
          setChats(data);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
  }, []);

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">Loading chats...</div>
      ) : chats.length > 0 ? (
        <div className="space-y-4">
          {chats.map((chat) => (
            <div key={chat.id} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" 
                 onClick={() => router.push(`/chat/${chat.id}`)}>
              <h3 className="font-medium">{chat.title || "Untitled Chat"}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(chat.updatedAt || chat.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No chats yet. Start a new conversation!</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            onClick={() => router.push("/chat/new")}
          >
            New Chat
          </button>
        </div>
      )}
    </div>
  );
}
