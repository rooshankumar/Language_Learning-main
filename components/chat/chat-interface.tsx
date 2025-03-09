
'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Send, Paperclip, Smile } from 'lucide-react';
import { format } from 'date-fns';

interface ChatInterfaceProps {
  onSendMessage: (message: string) => boolean;
  onTyping?: (isTyping: boolean) => void;
  isLoading?: boolean;
}

export default function ChatInterface({ 
  onSendMessage, 
  onTyping,
  isLoading = false 
}: ChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [isTypingActive, setIsTypingActive] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  
  // Handle typing indicator
  useEffect(() => {
    if (message && !isTypingActive) {
      setIsTypingActive(true);
      onTyping?.(true);
    }
    
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingActive) {
        setIsTypingActive(false);
        onTyping?.(false);
      }
    }, 2000);
    
    // Cleanup on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTypingActive, onTyping]);
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    try {
      const success = onSendMessage(message.trim());
      if (success) {
        setMessage('');
        setShowEmojiPicker(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while sending your message.",
        variant: "destructive",
      });
    }
  };
  
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Here you would implement file upload
    toast({
      title: "Feature Coming Soon",
      description: "File sharing will be available soon!",
    });
  };
  
  const handleEmojiSelect = (emoji: any) => {
    setMessage(prev => prev + emoji.native);
    // Don't hide picker after selection to allow multiple selections
  };

  return (
    <Card className="border-t rounded-none shadow-none">
      <CardFooter className="p-3">
        <form onSubmit={handleSubmit} className="flex w-full gap-2 items-end">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            multiple
          />
          
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={handleFileClick}
            disabled={isLoading}
          >
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach file</span>
          </Button>
          
          <div className="relative flex-1">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full pr-10"
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-5 w-5" />
              <span className="sr-only">Emoji</span>
            </Button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 z-10">
                <Picker 
                  data={data} 
                  onEmojiSelect={handleEmojiSelect} 
                  theme={theme === 'dark' ? 'dark' : 'light'}
                  previewPosition="none"
                />
              </div>
            )}
          </div>
          
          <Button
            type="submit"
            disabled={isLoading || !message.trim()}
            size="icon"
            className="rounded-full"
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
