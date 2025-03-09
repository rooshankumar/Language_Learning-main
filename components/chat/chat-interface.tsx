
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import useChat from '@/hooks/use-chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Send, Paperclip } from 'lucide-react';
import { format } from 'date-fns';

interface ChatInterfaceProps {
  chatId: string;
  recipientName?: string;
  recipientImage?: string;
}

export function ChatInterface({ chatId, recipientName, recipientImage }: ChatInterfaceProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [newMessage, setNewMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    isConnected, 
    isTyping, 
    sendMessage, 
    loadChatHistory, 
    joinChat, 
    setTyping, 
    error 
  } = useChat();

  // Effect to join the chat
  useEffect(() => {
    if (!chatId || !session?.user) return;
    
    const cleanup = joinChat(chatId);
    loadChatHistory(chatId);
    
    return cleanup;
  }, [chatId, session?.user, joinChat, loadChatHistory]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Chat Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error]);

  // Handle message input and typing indicator
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setTyping(chatId, e.target.value.length > 0);
  };

  // Send message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !chatId || !session?.user) return;
    
    setIsLoading(true);
    try {
      const sent = sendMessage(newMessage, chatId);
      if (sent) {
        setNewMessage('');
        setTyping(chatId, false);
      } else {
        toast({
          title: "Failed to send message",
          description: "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pressing Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!session?.user) {
    return <div className="flex items-center justify-center h-full">Please sign in to use chat</div>;
  }

  return (
    <Card className="flex flex-col h-full border-0 shadow-none">
      <CardHeader className="border-b">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={recipientImage || "/placeholder-user.jpg"} alt={recipientName} />
            <AvatarFallback>{recipientName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{recipientName || "Chat"}</CardTitle>
            {Object.values(isTyping).some(Boolean) && (
              <p className="text-sm text-muted-foreground">typing...</p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.sender._id === session.user.id;
            return (
              <div 
                key={message._id || index} 
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-start gap-2 max-w-[75%]">
                  {!isCurrentUser && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender.image || "/placeholder-user.jpg"} alt={message.sender.name} />
                      <AvatarFallback>{message.sender.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div>
                    <div 
                      className={`px-4 py-2 rounded-lg ${
                        isCurrentUser 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}
                    >
                      {message.text}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(message.createdAt), 'HH:mm')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      
      <CardFooter className="border-t p-4">
        <div className="flex w-full items-center space-x-2">
          <Button 
            size="icon" 
            variant="ghost" 
            className="rounded-full" 
            type="button"
            disabled={isLoading}
          >
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach file</span>
          </Button>
          
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading || !isConnected}
            className="flex-1"
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading || !isConnected}
            size="icon"
            className="rounded-full"
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default ChatInterface;
