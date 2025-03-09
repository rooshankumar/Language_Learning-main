
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
'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Message } from '@/lib/chat-service';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { data: session } = useSession();
  const isSentByCurrentUser = session?.user?.id === message.sender._id;
  
  // Format timestamp
  const timestamp = message.createdAt 
    ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })
    : '';

  return (
    <div className={`flex w-full mb-4 ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isSentByCurrentUser && (
        <div className="flex-shrink-0 mr-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
            {message.sender.image || message.sender.profilePic ? (
              <Image 
                src={message.sender.image || message.sender.profilePic} 
                alt={message.sender.name}
                width={32}
                height={32}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-sm font-medium">
                {message.sender.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className={`flex flex-col max-w-[70%]`}>
        {!isSentByCurrentUser && (
          <span className="text-xs text-gray-500 mb-1">{message.sender.name}</span>
        )}
        
        <div className={`px-4 py-2 rounded-lg break-words ${
          isSentByCurrentUser 
            ? 'bg-primary text-primary-foreground rounded-tr-none' 
            : 'bg-secondary text-secondary-foreground rounded-tl-none'
        }`}>
          {message.content}
        </div>
        
        <span className={`text-xs text-gray-500 mt-1 ${isSentByCurrentUser ? 'text-right' : 'text-left'}`}>
          {timestamp}
        </span>
      </div>
    </div>
  );
}
