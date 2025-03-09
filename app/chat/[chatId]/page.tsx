
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useChat } from '@/hooks/use-chat';
import { ChatInterface } from '@/components/chat/chat-interface';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const chatId = params?.chatId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any>(null);
  
  const { 
    messages, 
    sendMessage, 
    loadChatHistory, 
    joinChat, 
    setTyping,
    isTyping 
  } = useChat();

  // Load initial chat data
  useEffect(() => {
    if (!chatId || !session?.user?.id) return;
    
    const loadChat = async () => {
      setIsLoading(true);
      try {
        // Load chat messages
        await loadChatHistory(chatId);
        
        // Load chat details to get the other participant
        const response = await fetch(`/api/chat/${chatId}`);
        if (response.ok) {
          const chatData = await response.json();
          
          // Find the other participant (not the current user)
          const otherParticipantId = chatData.participants.find(
            (id: string) => id !== session.user.id
          );
          
          if (otherParticipantId) {
            // Get user details
            const userResponse = await fetch(`/api/community/users?ids=${otherParticipantId}`);
            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData.users && userData.users.length > 0) {
                setOtherUser(userData.users[0]);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChat();
    
    // Join the chat room for real-time updates
    const unsubscribe = joinChat(chatId);
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [chatId, session?.user?.id, loadChatHistory, joinChat]);

  const handleSendMessage = (content: string) => {
    if (!chatId) return;
    sendMessage(content, chatId);
  };

  const handleTyping = (isTyping: boolean) => {
    if (!chatId) return;
    setTyping(chatId, isTyping);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b">
        <div className="container py-2">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/chat')}
              variant="ghost"
              size="icon"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            
            {isLoading ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage 
                    src={otherUser?.profilePic || otherUser?.image || "/placeholder-user.jpg"} 
                    alt={otherUser?.name || "User"} 
                  />
                  <AvatarFallback>{otherUser?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{otherUser?.name || "Loading..."}</p>
                  {Object.keys(isTyping).some(key => isTyping[key]) && (
                    <p className="text-xs text-muted-foreground">Typing...</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="p-3">
                  <Skeleton className="h-4 w-28" />
                </CardHeader>
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p>No messages yet. Send a message to start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div 
                key={message._id || index} 
                className={`flex ${message.sender._id === session?.user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex gap-2 max-w-[80%]">
                  {message.sender._id !== session?.user?.id && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender.image || "/placeholder-user.jpg"} alt={message.sender.name} />
                      <AvatarFallback>{message.sender.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <Card className={`${message.sender._id === session?.user?.id ? 'bg-primary text-primary-foreground' : ''}`}>
                      <CardContent className="p-3">
                        <p>{message.text}</p>
                      </CardContent>
                    </Card>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="border-t p-4">
        <ChatInterface 
          onSendMessage={handleSendMessage} 
          onTyping={handleTyping}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
