
import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

interface MessageProps {
  message: {
    _id: string;
    senderId: string;
    text: string;
    timestamp: string | number | Date;
  };
}

const MessageBubble = ({ message }: MessageProps) => {
  const { user } = useAuth();
  const isSentByCurrentUser = message.senderId === user?.id;

  return (
    <div className={`flex w-full ${isSentByCurrentUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`px-4 py-2 rounded-lg max-w-xs break-words ${
          isSentByCurrentUser 
            ? "bg-blue-500 text-white message-bubble sent" 
            : "bg-gray-200 text-black message-bubble received"
        }`}
      >
        {message.text}
        <div className="text-xs mt-1 message-meta">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
