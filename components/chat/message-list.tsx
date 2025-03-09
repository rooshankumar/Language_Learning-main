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
  isCurrentUser: (message: Message) => boolean;
}

const MessageList = ({ messages, isLoading = false, isCurrentUser }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ensure messages is always an array
  const messageList = Array.isArray(messages) ? messages : [];

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messageList]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading messages...</div>;
  }

  return (
    <div className="chat-messages">
      {messageList.length > 0 ? (
        messageList.map((message) => (
          <MessageBubble key={message._id} message={message} isCurrentUser={isCurrentUser(message)} />
        ))
      ) : (
        <div className="flex items-center justify-center h-full p-4 text-gray-500">
          <p>No messages yet. Start a conversation!</p>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;