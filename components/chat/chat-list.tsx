'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { MessageSquare, User, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Chat {
  _id: string;
  participants: string[];
  lastMessage?: {
    content: string;
    sender: {
      _id: string;
      name: string;
    };
    createdAt: string;
  };
  updatedAt: string;
  createdAt: string;
}

interface ChatPartner {
  _id: string;
  name: string;
  email: string;
  image?: string;
  profilePic?: string;
  online?: boolean;
  lastSeen?: string;
}

function ChatPreview({ chat, currentUserId }: { chat: Chat; currentUserId: string }) {
  const [chatPartner, setChatPartner] = useState<ChatPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchChatPartner() {
      try {
        // Find the other participant (not the current user)
        const partnerId = chat.participants.find(id => id !== currentUserId);

        if (!partnerId) {
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/user/${partnerId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch chat partner');
        }

        const data = await response.json();
        setChatPartner(data);
      } catch (error) {
        console.error('Error fetching chat partner:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchChatPartner();
  }, [chat, currentUserId]);

  const handleClick = () => {
    router.push(`/chat/${chat._id}`);
  };

  if (loading) {
    return (
      <Card className="mb-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
        <CardHeader className="p-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (!chatPartner) {
    return null;
  }

  const isOnline = chatPartner.online || false;
  const lastMessageDate = chat.lastMessage?.createdAt ? new Date(chat.lastMessage.createdAt) : new Date(chat.updatedAt);
  const timeAgo = formatDistanceToNow(lastMessageDate, { addSuffix: true });

  const displayName = chatPartner.name || chatPartner.email.split('@')[0];
  const avatarUrl = chatPartner.image || chatPartner.profilePic;

  const lastMessagePreview = chat.lastMessage 
    ? `${chat.lastMessage.sender._id === currentUserId ? 'You: ' : ''}${chat.lastMessage.content}`
    : 'Start a conversation';

  return (
    <Card className="mb-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={handleClick}>
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-12 w-12">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={displayName} />
                ) : (
                  <AvatarFallback>
                    {displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              {isOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{displayName}</CardTitle>
              <CardDescription className="line-clamp-1 text-sm">
                {lastMessagePreview}
              </CardDescription>
            </div>
          </div>
          <div className="text-xs text-gray-500">{timeAgo}</div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function ChatList() {
  const { data: session } = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchChats() {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/chat');

        if (!response.ok) {
          throw new Error('Failed to fetch chats');
        }

        const data = await response.json();
        setChats(data);
      } catch (error: any) {
        console.error('Error fetching chats:', error);
        setError(error.message || 'Failed to load chats');
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchChats();
    }
  }, [session]);

  const handleNewChat = () => {
    router.push('/community');
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Chats</h2>
          <Button onClick={handleNewChat}>
            <Users className="mr-2 h-4 w-4" />
            Find Users
          </Button>
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i} className="mb-4">
            <CardHeader className="p-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Chats</h2>
          <Button onClick={handleNewChat}>
            <Users className="mr-2 h-4 w-4" />
            Find Users
          </Button>
        </div>
        <Card className="bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => setLoading(true)}>
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Chats</h2>
        <Button onClick={handleNewChat}>
          <Users className="mr-2 h-4 w-4" />
          Find Users
        </Button>
      </div>

      {chats.length === 0 ? (
        <Card className="text-center p-8">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>No conversations yet</CardTitle>
            <CardDescription>
              Start a chat with another learner to begin a conversation.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={handleNewChat}>
              <User className="mr-2 h-4 w-4" />
              Find Users
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div>
          {chats.map((chat) => (
            <ChatPreview 
              key={chat._id} 
              chat={chat} 
              currentUserId={session?.user?.id!} 
            />
          ))}
        </div>
      )}
    </div>
  );
}