
'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/lib/chat-service';
import MessageBubble from './message-bubble';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  typingUsers?: { [username: string]: boolean };
}

export default function MessageList({ 
  messages, 
  isLoading = false,
  typingUsers = {}
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <div className="animate-pulse flex space-x-2">
          <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
          <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
          <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
        </div>
        <p className="text-gray-500 mt-2">Loading messages...</p>
      </div>
    );
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex h-full justify-center items-center">
        <p className="text-gray-500">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  // Get typing users as array
  const currentlyTypingUsers = Object.entries(typingUsers)
    .filter(([_, isTyping]) => isTyping)
    .map(([username]) => username);

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-4">
      <div className="flex-1">
        {messages.map((message) => (
          <MessageBubble key={message._id} message={message} />
        ))}
        
        {/* Typing indicators */}
        {currentlyTypingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500 ml-2 mb-2">
            <div className="animate-pulse flex space-x-1">
              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
            </div>
            <span>
              {currentlyTypingUsers.join(', ')} {currentlyTypingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
