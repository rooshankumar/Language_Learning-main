import React, { useEffect, useRef } from "react";
import MessageBubble from "./message-bubble";

type MessageListProps = {
  messages: any[];
  loading?: boolean;
};

const MessageList = ({ messages, loading = false }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No messages yet. Start a conversation!
      </div>
    );
  }

  return (
    <div className="chat-messages">
      {messages.map((message, index) => (
        <MessageBubble 
          key={message._id || index} 
          message={message} 
          isLast={index === messages.length - 1} 
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;