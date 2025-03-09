"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Send, PaperclipIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChatInterface({ chatId, initialMessages = [] }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [partner, setPartner] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch chat partner
  useEffect(() => {
    const fetchChatPartner = async () => {
      try {
        if (!chatId) return;

        const response = await fetch(`/api/chat/${chatId}/partner`);
        if (response.ok) {
          const data = await response.json();
          setPartner(data);
        }
      } catch (error) {
        console.error("Failed to fetch chat partner:", error);
      }
    };

    fetchChatPartner();
  }, [chatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages and setup socket connection
  useEffect(() => {
    if (!chatId || !session?.user) return;

    // Socket connection for real-time messages would be implemented here
    const fetchMessages = async () => {
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

    fetchMessages();

    // Setup socket connection
    // const socket = io();
    // socket.on("connect", () => {
    //   socket.emit("joinChat", { chatId, userId: session.user.id });
    // });
    // socket.on("newMessage", (message) => {
    //   setMessages((prev) => [...prev, message]);
    // });
    // 
    // return () => {
    //   socket.disconnect();
    // };
  }, [chatId, session]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !session?.user || loading) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
          senderId: session.user.id,
        }),
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setMessages((prev) => [...prev, sentMessage]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Chat header */}
      <div className="p-4 border-b bg-white dark:bg-gray-800 flex items-center">
        <div className="flex-1">
          <h2 className="font-medium">{partner?.displayName || "Chat"}</h2>
          {partner?.status && <p className="text-sm text-gray-500">{partner.status}</p>}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.senderId === session?.user?.id;

            return (
              <div 
                key={message.id || index}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwnMessage 
                      ? 'bg-blue-500 text-white rounded-br-none' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                  }`}
                >
                  <p>{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block text-right">
                    {new Date(message.timestamp || Date.now()).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input area */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={loading || !newMessage.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}