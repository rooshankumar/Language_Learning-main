'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Send, Paperclip, Smile } from 'lucide-react';
import { format } from 'date-fns';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ChatInterfaceProps {
  onSendMessage: (message: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export function ChatInterface({ onSendMessage, onTyping, disabled = false }: ChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing indicator
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        if (onTyping) onTyping(false);
      }
    };
  }, [onTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    // Handle typing indicator
    if (onTyping) {
      onTyping(true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setIsLoading(true);
      onSendMessage(message.trim());
      setMessage('');

      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
        if (onTyping) onTyping(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessage(prev => prev + emoji.native);
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 relative">
        <Input
          ref={inputRef}
          placeholder="Type a message..."
          value={message}
          onChange={handleInputChange}
          disabled={isLoading || disabled}
          className="pr-20"
        />
        <div className="absolute right-2 bottom-0 flex items-center h-full">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={isLoading || disabled}
              >
                <Smile className="h-5 w-5" />
                <span className="sr-only">Emoji</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Picker 
                data={data} 
                onEmojiSelect={handleEmojiSelect}
                theme="light"
                emojiSize={20}
                emojiButtonSize={28}
              />
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={isLoading || disabled}
          >
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach file</span>
          </Button>
        </div>
      </div>
      <Button
        type="submit"
        disabled={!message.trim() || isLoading || disabled}
        size="icon"
        className="rounded-full"
      >
        <Send className="h-5 w-5" />
        <span className="sr-only">Send</span>
      </Button>
    </form>
  );
}