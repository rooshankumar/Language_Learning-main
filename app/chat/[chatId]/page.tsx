'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import useChat from '@/hooks/use-chat';
import { AppShell } from '@/components/app-shell';

export default function Page() {
  const { chatId } = useParams();
  const { data: session } = useSession();
  const { messages, sendMessage, joinChat, loadChatHistory, setTyping } = useChat();
  const [chat, setChat] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat data
  useEffect(() => {
    if (!chatId || !session?.user?.id) return;

    const fetchChatData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/chat/${chatId}`);

        if (!res.ok) {
          throw new Error('Failed to fetch chat data');
        }

        const chatData = await res.json();
        setChat(chatData);

        // Find partner user (not current user)
        if (chatData && chatData.participants) {
          const partnerId = chatData.participants.find(
            (id: string) => id !== session.user.id
          );

          if (partnerId) {
            const userRes = await fetch(`/api/users/${partnerId}`);
            if (userRes.ok) {
              const userData = await userRes.json();
              setPartner(userData);
            }
          }
        }

        // Join chat room
        joinChat(chatId as string);

        // Load chat history
        await loadChatHistory(chatId as string);

        setLoading(false);
      } catch (err: any) {
        console.error('Error loading chat:', err);
        setError(err.message || 'Failed to load chat');
        setLoading(false);
      }
    };

    fetchChatData();
  }, [chatId, session?.user?.id, joinChat, loadChatHistory]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (message: string) => {
    if (message.trim() && chatId) {
      const success = sendMessage(message, chatId as string);
      if (!success) {
        setError('Failed to send message');
      }
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (chatId) {
      setTyping(chatId as string, isTyping);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col h-screen max-h-screen overflow-hidden">
        {/* Chat Header */}
        {partner && (
          <div className="border-b p-3 flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={partner.image || partner.profilePic || "/placeholder-user.jpg"} alt={partner.name} />
              <AvatarFallback>{partner.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{partner.name || "Unknown User"}</h2>
              <p className="text-xs text-muted-foreground">
                {partner.online ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading messages...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No messages yet. Say hello!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isCurrentUser = message.sender._id === session?.user?.id;

                return (
                  <div
                    key={message._id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex items-start gap-2 max-w-[80%]">
                      {!isCurrentUser && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender.image || "/placeholder-user.jpg"} />
                          <AvatarFallback>{message.sender.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`rounded-lg p-3 ${
                          isCurrentUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="text-sm">{message.text}</div>
                        <div className="text-xs mt-1 opacity-70">
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      {isCurrentUser && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={session?.user?.image || "/placeholder-user.jpg"} />
                          <AvatarFallback>{session?.user?.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Chat Input */}
        <div className="p-3 pt-0">
          <Separator className="my-3" />
          <ChatInterface
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            loading={loading}
          />
        </div>
      </div>
    </AppShell>
  );
}