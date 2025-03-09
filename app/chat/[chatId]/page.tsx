"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ChatInterface from "@/components/chat/chat-interface";
import AppShell from "@/components/app-shell";
import { useSession } from "next-auth/react";
import { joinChat, useChat } from "@/hooks/use-chat";


export default function ChatPage() {
  const params = useParams();
  const chatId = params?.chatId as string;
  const { data: session } = useSession();
  const { getChatPartner } = useChat();
  const [messages, setMessages] = useState([]);
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

    const fetchChatMessages = async () => {
      try {
        const response = await fetch(`/api/chat/${chatId}/messages`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    joinChatRoom();
    if (chatId) {
      fetchChatMessages();
    }
  }, [chatId, session?.user?.id, getChatPartner]);

  return (
    <AppShell>
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            {isJoining ? (
              <p>Loading chat...</p>
            ) : partner ? (
              <h1 className="text-xl font-bold">{partner.name}</h1>
            ) : (
              <p>Chat not found</p>
            )}
          </div>
          <ChatInterface chatId={chatId} initialMessages={messages} />
        </div>
      </div>
    </AppShell>
  );
}