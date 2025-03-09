"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { joinChat, useChat } from "@/hooks/use-chat";
import { Message } from "@/hooks/use-chat";

export default function ChatPage() {
  const params = useParams();
  const chatId = params?.chatId as string;
  const { data: session } = useSession();
  const { getChatPartner } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<any>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!chatId || !session?.user?.id) return;

    const joinChatRoom = async () => {
      try {
        setIsJoining(true);
        await joinChat(chatId, session.user.id);

        // Fetch chat partner
        const partnerData = await getChatPartner(chatId);
        if (partnerData) {
          setPartner(partnerData);
        }
      } catch (error) {
        console.error("Failed to join chat:", error);
      } finally {
        setIsJoining(false);
      }
    };

    joinChatRoom();
  }, [chatId, session?.user?.id, getChatPartner]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        {isJoining ? (
          <p>Loading chat...</p>
        ) : partner ? (
          <h1 className="text-xl font-bold">{partner.name}</h1>
        ) : (
          <p>Chat not found</p>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length > 0 ? (
          messages.map((message) => (
            <div 
              key={message._id}
              className={`mb-4 ${
                message.sender === session?.user?.id 
                  ? "text-right" 
                  : "text-left"
              }`}
            >
              <div 
                className={`inline-block p-3 rounded-lg ${
                  message.sender === session?.user?.id 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-200"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No messages yet</p>
        )}
      </div>

      <div className="p-4 border-t">
        <form className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}