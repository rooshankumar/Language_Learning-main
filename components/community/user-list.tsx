"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { createChatWithUser } from '@/hooks/use-chat'; // Import updated function

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

  const handleChatClick = async (user: User) => {
    if (!user || (!user._id && !user.id)) {
      toast({
        title: "Error",
        description: "Cannot start chat: User information is missing",
        variant: "destructive",
      });
      return;
    }
    
    // Extract the user ID, prioritizing _id (MongoDB ID)
    const userId = user._id || user.id;
    // Ensure we have a string representation
    const userIdString = typeof userId === 'object' ? userId.toString() : String(userId);
    
    if (!userIdString || userIdString === 'undefined') {
      toast({
        title: "Error",
        description: "User ID is missing or invalid",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Starting chat with user:', user.name, 'ID:', userIdString);
      
      const chatId = await createChatWithUser(userIdString);
      if (chatId) {
        router.push(`/chat/${chatId}`);
      } else {
        throw new Error("Failed to create chat - no chat ID returned");
      }
    } catch (error: any) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start chat",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
              onClick={() => handleChatClick(user)}
              variant="secondary" 
              className="w-full"
              disabled={loading}
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