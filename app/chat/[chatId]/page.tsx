"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ChatInterface from "@/components/chat/chat-interface";
import { AppShell } from "@/components/app-shell";
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

    let isMounted = true;

    const joinChatRoom = async () => {
      try {
        setIsJoining(true);
        console.log(`📌 Joining chat room: ${chatId}`);

        await joinChat(chatId, session.user.id);
        console.log(`✅ Successfully joined chat: ${chatId}`);

        // Fetch chat partner
        console.log(`📩 Fetching partner data for chat: ${chatId}`);
        const partnerData = await getChatPartner(chatId);

        if (partnerData && isMounted) {
          console.log(`✅ Partner data received:`, partnerData.name || partnerData._id);
          setPartner(partnerData);
        } else if (isMounted) {
          console.error(`❌ No partner data found for chat: ${chatId}`);
        }
      } catch (error) {
        console.error("🚨 Failed to join chat:", error);
      } finally {
        if (isMounted) {
          setIsJoining(false);
        }
      }
    };

    const fetchChatMessages = async () => {
      try {
        console.log(`📩 Fetching messages for chat: ${chatId}`);
        const response = await fetch(`/api/chat/${chatId}/messages`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`❌ Failed to fetch messages: ${response.status}`, errorData);
          return;
        }

        const data = await response.json();

        if (isMounted) {
          console.log(`✅ Received ${data.length} messages for chat: ${chatId}`);
          setMessages(data);
        }
      } catch (error) {
        console.error("🚨 Error fetching messages:", error);
      }
    };

    joinChatRoom();
    fetchChatMessages();

    // Clean up function
    return () => {
      isMounted = false;
    };
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