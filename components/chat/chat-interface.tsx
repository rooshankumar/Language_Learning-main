'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Message } from '@/lib/chat-service';
import { useSession } from 'next-auth/react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';


interface ChatPartner {
  _id: string;
  name: string;
  image?: string;
  online?: boolean;
  lastSeen?: Date;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  chatPartner: ChatPartner | null;
  isTyping?: boolean;
  onTyping?: (isTyping: boolean) => void;
}

export function ChatInterface({
  messages,
  onSendMessage,
  chatPartner,
  isTyping,
  onTyping
}: ChatInterfaceProps) {
  const { data: session } = useSession();
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [chatLoading, setChatLoading] = useState(false); // Added state for loading indicator
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Debounced typing indicator
  const handleTyping = useCallback(() => {
    if (onTyping) {
      onTyping(true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set a new timeout to stop the typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  }, [onTyping]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = () => {
    if (messageText.trim() === '') return;

    onSendMessage(messageText);
    setMessageText('');
    setShowEmojiPicker(false);
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    if (onTyping) onTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    handleTyping();
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessageText(prev => prev + emoji.native);
  };

  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleStartChat = async (userId: string) => {
    try {
      setChatLoading(true);

      // Add validation
      if (!userId || userId.trim() === '') {
        throw new Error('Invalid user ID provided');
      }

      console.log('Attempting to create chat with user:', userId);
      const chatId = await createChatWithUser(userId);

      if (chatId) {
        console.log('Successfully created chat, navigating to:', chatId);
        router.push(`/chat/${chatId}`);
      } else {
        console.error('No chat ID returned after successful creation');
        throw new Error('Failed to create or find chat - No chat ID returned');
      }
    } catch (error: any) {
      console.error('Error starting chat:', error);
      // Show a more detailed error message
      toast({
        title: 'Chat Error',
        description: `Could not start chat: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
        duration: 5000,
      });

      // Log additional details for debugging
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
    } finally {
      setChatLoading(false);
    }
  };


  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="p-4 border-b flex items-center space-x-4">
        <Avatar>
          <AvatarImage src={chatPartner?.image || ''} />
          <AvatarFallback>
            {chatPartner?.name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold">{chatPartner?.name || 'Unknown User'}</h2>
          <p className="text-sm text-muted-foreground">
            {chatPartner?.online ? 'Online' : chatPartner?.lastSeen ? `Last seen: ${formatTime(chatPartner.lastSeen)}` : 'Offline'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.sender._id === session?.user?.id;

            return (
              <div
                key={message._id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-end space-x-2">
                  {!isOwnMessage && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.sender.image || message.sender.profilePic || ''} />
                      <AvatarFallback>
                        {message.sender.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`px-4 py-2 rounded-lg max-w-xs sm:max-w-md ${
                      isOwnMessage
                        ? 'bg-primary text-white'
                        : 'bg-muted'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs opacity-70 text-right mt-1">
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="px-4 py-2 rounded-lg bg-muted max-w-fit">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <div className="p-4 border-t relative">
        {showEmojiPicker && (
          <div className="absolute bottom-16 right-4">
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme="light"
              previewPosition="none"
            />
          </div>
        )}
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={messageText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button type="submit" onClick={handleSendMessage} disabled={!messageText.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Dummy function - needs to be replaced with actual implementation
// Import the actual function instead of using a mock
import { createChatWithUser } from '@/hooks/use-chat';