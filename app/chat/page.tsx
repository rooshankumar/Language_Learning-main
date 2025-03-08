"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ChatUI } from "@/components/chat/chat-ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";


// Use dynamic import with no SSR to prevent Firebase Auth errors during build
const ChatPage = dynamic(() => import('@/components/chat/chat-page'), {
  ssr: false,
  loading: () => null,
});

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPage />
    </Suspense>
  );
}


export default function ChatPage2() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedUserId = searchParams.get("userId");
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch users for chat list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // This would be replaced with a real API call to get conversations
        // For now, let's fetch a few sample users from the community
        const response = await fetch('/api/user/community');
        
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        
        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (status === "authenticated") {
      fetchUsers();
    }
  }, [status]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
    }
  }, [status, router]);
  
  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle user selection
  const selectUser = (userId: string) => {
    router.push(`/chat?userId=${userId}`);
  };
  
  // Show loading state while checking authentication
  if (status === "loading") {
    return null;
  }
  
  // Don't render anything if not authenticated (will redirect)
  if (status === "unauthenticated") {
    return null;
  }
  
  return (
    <AppShell>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Chat list sidebar */}
        <div className={`border-r w-full md:w-80 flex flex-col ${selectedUserId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search conversations..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers.length > 0 ? (
              <div>
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    className={`w-full p-4 flex items-center space-x-3 hover:bg-muted transition-colors ${
                      selectedUserId === user.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => selectUser(user.id)}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={user.image || "/placeholder-user.jpg"} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {user.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></span>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden text-left">
                      <div className="font-medium truncate">{user.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {user.lastMessage ? user.lastMessage : 'Start a new conversation'}
                      </div>
                    </div>
                    {user.lastSeen && (
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true })}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-1">No conversations found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery ? 'Try a different search term' : 'Start a new conversation from the community page'}
                </p>
                <Button onClick={() => router.push("/community")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Find Users
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Chat area */}
        <div className={`flex-1 ${!selectedUserId ? 'hidden md:flex' : 'flex'}`}>
          {selectedUserId ? (
            <ChatUI partnerId={selectedUserId} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
              <p className="text-muted-foreground max-w-md mb-8">
                Select a conversation from the list or start a new one by finding users in the community.
              </p>
              <Button onClick={() => router.push("/community")}>
                <Plus className="h-4 w-4 mr-2" />
                Find Language Partners
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}