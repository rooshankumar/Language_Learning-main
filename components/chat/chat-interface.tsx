
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Smile } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';

interface ChatInterfaceProps {
  messages: any[];
  onSendMessage: (message: string) => void;
  chatPartner: {
    name: string;
    image: string;
    online?: boolean;
    lastSeen?: Date;
  } | null;
  isTyping: { [key: string]: boolean };
}

export function ChatInterface({ messages, onSendMessage, chatPartner, isTyping }: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const addEmoji = (emoji: any) => {
    setNewMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b p-3 flex items-center space-x-3">
        {chatPartner && (
          <>
            <Avatar>
              <img 
                src={chatPartner.image || '/placeholder-user.jpg'} 
                alt={chatPartner.name || 'User'} 
                className="h-10 w-10 rounded-full object-cover"
              />
            </Avatar>
            <div>
              <h3 className="font-medium">{chatPartner.name}</h3>
              <p className="text-xs text-muted-foreground">
                {chatPartner.online ? 'Online' : chatPartner.lastSeen ? `Last seen ${formatDistanceToNow(new Date(chatPartner.lastSeen))} ago` : 'Offline'}
              </p>
            </div>
          </>
        )}
      </div>
      
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div 
              key={message._id || index} 
              className={`flex ${message.sender._id === session?.user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`max-w-[70%] p-3 ${message.sender._id === session?.user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {message.sender._id !== session?.user?.id && (
                  <div className="flex items-center space-x-2 mb-1">
                    <img 
                      src={message.sender.profilePic || message.sender.image || '/placeholder-user.jpg'} 
                      alt={message.sender.name} 
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    <span className="text-xs font-medium">{message.sender.name}</span>
                  </div>
                )}
                <p>{message.content}</p>
                <p className="text-xs opacity-70 text-right mt-1">
                  {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : ''}
                </p>
              </Card>
            </div>
          ))}
          
          {/* Typing indicator */}
          {Object.entries(isTyping).map(([username, typing]) => 
            typing && (
              <div key={username} className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{username} is typing...</span>
                <div className="typing-animation">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Message Input */}
      <div className="border-t p-3">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="relative flex-1">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="min-h-[80px] resize-none"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute bottom-2 right-2"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-5 w-5" />
            </Button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2">
                <Picker data={data} onEmojiSelect={addEmoji} />
              </div>
            )}
          </div>
          <Button type="submit">Send</Button>
        </form>
      </div>
    </div>
  );
}

export default ChatInterface;
