
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/hooks/use-chat';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface UserListProps {
  users: {
    _id: string;
    name: string;
    image?: string;
    profilePic?: string;
  }[];
}

export default function UserList({ users }: UserListProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { createChatWithUser } = useChat();
  const router = useRouter();

  const handleChatClick = async (partnerId: string) => {
    try {
      setLoading(partnerId);
      setError(null);
      
      const chat = await createChatWithUser(partnerId);
      console.log('✅ Chat created or retrieved:', chat);
      
      // Navigate to the chat screen
      router.push(`/chat/${chat._id}`);
    } catch (err: any) {
      console.error('❌ Error creating chat:', err);
      setError(err.message || 'Failed to create chat');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Start a new conversation</h2>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-3">
        {users.map((user) => (
          <Card key={user._id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={user.profilePic || user.image} alt={user.name} />
                  <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                </div>
              </div>
              
              <Button 
                onClick={() => handleChatClick(user._id)} 
                disabled={loading === user._id}
                size="sm"
              >
                {loading === user._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Message'
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

