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
  age?: number;
  nativeLanguage?: string;
  learningLanguages?: string[];
  bio?: string;
  interests?: string[];
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
      console.log('Starting chat with user ID:', userId);
      const response = await fetch('/api/chat/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create chat');
      }

      const data = await response.json();
      router.push(`/chat/${data.chatId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive"
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
                <CardDescription>{user.age ? `${user.age} years old` : ''}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-sm">
            {user.nativeLanguage && (
              <div className="mb-2">
                <strong>Native:</strong> {user.nativeLanguage}
              </div>
            )}
            {user.learningLanguages?.length > 0 && (
              <div className="mb-2">
                <strong>Learning:</strong> {user.learningLanguages.join(', ')}
              </div>
            )}
            {user.languages?.length > 0 && (
              <div className="mb-2">
                <strong>Languages:</strong> {user.languages?.join(', ')}
              </div>
            )}
            {user.level && (
              <div className="mb-2">
                <strong>Level:</strong> {user.level}
              </div>
            )}
            {user.bio && (
              <div className="mb-3">
                <strong>Bio:</strong> {user.bio.length > 100 ? `${user.bio.substring(0, 100)}...` : user.bio}
              </div>
            )}
            {user.interests?.length > 0 && (
              <div className="mb-2">
                <strong>Interests:</strong> {user.interests.join(', ')}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => startChat(user._id.toString())}
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