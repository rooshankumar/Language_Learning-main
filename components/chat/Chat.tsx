"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export function Chat() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    // Client-side data fetching
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

    if (user) {
      fetchChats();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return <div>Loading chat...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Conversations</h1>
      {chats.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No conversations yet</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            onClick={() => router.push("/community")}
          >
            Find people to chat with
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {chats.map((chat) => (
            <div key={chat._id} className="border p-4 rounded-lg">
              {/* Chat preview content */}
              <h3 className="font-medium">{chat.participants.map(p => p.displayName).join(", ")}</h3>
              <p className="text-gray-500 text-sm mt-1">
                {chat.lastMessage?.text || "No messages yet"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}