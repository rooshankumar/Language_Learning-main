
'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import type { Message } from '@/lib/chat-service';
import { useSession } from 'next-auth/react';
import '@/styles/chat.css';

interface MessageListProps {
  messages: Message[];
  isTyping: { [key: string]: boolean };
}

export function MessageList({ messages, isTyping }: MessageListProps) {
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Check if someone is typing
  const typingUsers = Object.entries(isTyping)
    .filter(([_, isTyping]) => isTyping)
    .map(([username]) => username);
  
  return (
    <div className="chat-messages">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No messages yet. Start the conversation!
        </div>
      ) : (
        messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            isCurrentUser={message.sender._id === session?.user?.id}
          />
        ))
      )}
      
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
          <p className="ml-2">
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing...`
              : `${typingUsers.length} people are typing...`}
          </p>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
