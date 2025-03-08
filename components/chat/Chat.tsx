"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export function Chat() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    if (!loading && !user) {
      router.push("/sign-in");
      return;
    }

    // Fetch chats only when we have a user
    if (user) {
      fetchChats();
    }
  }, [user, loading, router]);

  const fetchChats = () => {
    setIsLoading(true);
    // Implement your data fetching logic here
    // For example:
    fetch("/api/chats")
      .then((res) => res.json())
      .then((data) => {
        setChats(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching chats:", error);
        setIsLoading(false);
      });
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse">Loading...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Your Conversations</h1>

        {isLoading ? (
          <div className="animate-pulse">Loading chats...</div>
        ) : chats.length > 0 ? (
          <div className="grid gap-4">
            {chats.map((chat) => (
              <Card key={chat.id} className="cursor-pointer hover:bg-muted/50">
                <CardContent className="p-4">
                  <div className="font-medium">{chat.name || "Chat"}</div>
                  <div className="text-sm text-muted-foreground">
                    {chat.lastMessage?.text || "No messages yet"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No conversations yet</p>
            <button 
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
              onClick={() => {
                // Implement chat creation logic
                router.push("/community");
              }}
            >
              Find someone to chat with
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}