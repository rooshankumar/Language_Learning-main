
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ChatInterface from '@/components/chat/chat-interface';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import useChat from '@/hooks/use-chat';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
}

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const chatId = params.chatId as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<any | null>(null);
  const [recipient, setRecipient] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    isConnected,
    isTyping,
    sendMessage,
    loadChatHistory,
    joinChat,
    setTyping
  } = useChat();

  // Load chat details and messages
  useEffect(() => {
    if (!chatId || !session?.user?.id) return;
    
    const fetchChatData = async () => {
      setLoading(true);
      try {
        // Fetch chat details
        const chatResponse = await fetch(`/api/chat/${chatId}`);
        if (!chatResponse.ok) {
          throw new Error('Failed to load chat');
        }
        const chatData = await chatResponse.json();
        setChat(chatData.chat);
        
        // Determine recipient (the other user in the chat)
        const otherParticipant = chatData.chat.participants.find(
          (p: any) => p._id !== session.user.id
        );
        
        if (otherParticipant) {
          setRecipient(otherParticipant);
        }
        
        // Load chat messages
        await loadChatHistory(chatId);
        
        // Join the chat room for real-time updates
        joinChat(chatId);
      } catch (err: any) {
        console.error('Error loading chat:', err);
        setError(err.message || 'Failed to load chat');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChatData();
    
    // Cleanup function
    return () => {
      // Any cleanup needed
    };
  }, [chatId, session, loadChatHistory, joinChat]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle sending messages
  const handleSendMessage = (content: string) => {
    if (!chatId || !isConnected) return false;
    return sendMessage(content, chatId);
  };

  // Handle typing indicators
  const handleTyping = (isTyping: boolean) => {
    if (!chatId) return;
    setTyping(chatId, isTyping);
  };

  // Go back to chat list
  const goBack = () => {
    router.push('/chat');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b p-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Go back</span>
          </Button>
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex-1 p-4 overflow-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <Button onClick={goBack}>Return to Chat List</Button>
      </div>
    );
  }

  // Render the chat interface
  return (
    <div className="flex flex-col h-full">
      {/* Chat header with recipient info */}
      <div className="border-b p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Go back</span>
        </Button>
        
        {recipient && (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={recipient.avatar || '/placeholder-user.jpg'} alt={recipient.name} />
              <AvatarFallback>{recipient.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{recipient.name || 'User'}</div>
              <div className="text-xs text-muted-foreground">
                {recipient.isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 p-4 overflow-auto">
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`flex gap-2 mb-4 ${
              message.sender.id === session?.user?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.sender.id !== session?.user?.id && (
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={message.sender.avatar || '/placeholder-user.jpg'} 
                  alt={message.sender.name} 
                />
                <AvatarFallback>{message.sender.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            )}
            
            <div 
              className={`rounded-lg p-3 max-w-[80%] ${
                message.sender.id === session?.user?.id 
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-muted'
              }`}
            >
              <div className="text-sm">{message.content}</div>
              <div className="text-xs mt-1 opacity-70">
                {format(new Date(message.timestamp), 'p')}
              </div>
            </div>
            
            {message.sender.id === session?.user?.id && (
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={session.user.image || '/placeholder-user.jpg'} 
                  alt={session.user.name || 'You'} 
                />
                <AvatarFallback>{session.user.name?.charAt(0) || 'Y'}</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        
        {/* Typing indicators */}
        {Object.entries(isTyping).map(([username, typing]) => 
          typing && (
            <div key={username} className="text-sm text-muted-foreground mb-2">
              {username} is typing...
            </div>
          )
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat input */}
      <ChatInterface 
        onSendMessage={handleSendMessage} 
        onTyping={handleTyping}
        isLoading={!isConnected}
      />
    </div>
  );
}
