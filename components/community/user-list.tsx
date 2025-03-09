
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

type User = {
  _id: string
  name: string
  email: string
  image?: string
  languages?: string[]
  level?: string
  streakCount?: number
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/community/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to load community members",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const startChat = async (userId: string) => {
    try {
      const response = await fetch('/api/chat/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiverId: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const { chatId } = await response.json();
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-6">Loading community members...</div>;
  }

  if (users.length === 0) {
    return <div className="text-center p-6">No other users found in the community.</div>;
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {users.map((user) => (
        <Card key={user._id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.image || '/placeholder-user.jpg'} alt={user.name} />
                <AvatarFallback>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-sm">
            {user.languages?.length ? (
              <div className="mb-2">
                <strong>Languages:</strong> {user.languages.join(', ')}
              </div>
            ) : null}
            {user.level ? (
              <div className="mb-2">
                <strong>Level:</strong> {user.level}
              </div>
            ) : null}
            {user.streakCount ? (
              <div>
                <strong>Streak:</strong> {user.streakCount} days
              </div>
            ) : null}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => startChat(user._id)}
              variant="secondary" 
              className="w-full"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Conversation
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
