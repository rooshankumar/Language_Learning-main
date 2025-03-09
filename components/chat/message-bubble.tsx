import React from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";

type MessageBubbleProps = {
  message: any;
  isLast?: boolean;
};

const MessageBubble = ({ message, isLast }: MessageBubbleProps) => {
  const { data: session } = useSession();
  const isSentByCurrentUser = message.sender?._id === session?.user?.id;

  return (
    <div className={`flex w-full ${isSentByCurrentUser ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`message-bubble ${
          isSentByCurrentUser ? "sent" : "received"
        } max-w-[70%]`}
      >
        {!isSentByCurrentUser && message.sender?.name && (
          <div className="text-xs font-medium text-gray-500 mb-1">
            {message.sender.name}
          </div>
        )}
        <div>{message.content}</div>
        <div className="message-time text-xs">
          {message.createdAt && format(new Date(message.createdAt), "h:mm a")}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;