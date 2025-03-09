
import React, { useEffect, useRef } from "react";
import MessageBubble from "./message-bubble";

interface Message {
  _id: string;
  senderId: string;
  text: string;
  timestamp: string | number | Date;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

const MessageList = ({ messages, isLoading = false }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading messages...</div>;
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex justify-center items-center h-full text-muted-foreground">
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <div className="chat-messages">
      {messages.map((message) => (
        <MessageBubble key={message._id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
