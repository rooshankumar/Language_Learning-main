
'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { CheckCheck } from 'lucide-react';
import type { Message } from '@/lib/chat-service';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Format the timestamp
  const formattedTime = message.createdAt ? 
    format(new Date(message.createdAt), 'h:mm a') : '';
  
  return (
    <div className={`message ${isCurrentUser ? 'sent' : 'received'}`}>
      {!isCurrentUser && (
        <div className="message-with-avatar">
          <Avatar className="message-avatar">
            <AvatarImage 
              src={message.sender.profilePic || message.sender.image || ''} 
              alt={message.sender.name} 
              onLoad={() => setImageLoaded(true)}
            />
            <AvatarFallback>
              {message.sender.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div className="message-content">
        {!isCurrentUser && <div className="message-sender">{message.sender.name}</div>}
        <div className="message-text">{message.content}</div>
        
        <div className="message-meta">
          {formattedTime}
          {isCurrentUser && (
            <span className="message-status">
              <CheckCheck size={14} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
