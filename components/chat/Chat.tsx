
'use client';

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Socket, io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Paperclip, Send } from "lucide-react";

type Message = {
  type: "text" | "file";
  text?: string;
  url?: string;
  sender?: string;
  timestamp?: Date;
};

// Initialize socket outside the component
let socket: Socket | undefined;

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();

  useEffect(() => {
    // Initialize socket connection only once
    if (!socket) {
      socket = io(window.location.origin);
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/messages");
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    // Socket event handlers
    socket.on("chatMessage", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("receiveFile", (fileUrl: string) => {
      setMessages((prev) => [...prev, {
        type: "file",
        url: fileUrl,
        timestamp: new Date()
      }]);
    });

    return () => {
      socket?.off("chatMessage");
      socket?.off("receiveFile");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() && !file) return;

    if (file) {
      handleFileUpload();
      return;
    }

    const message: Message = {
      type: "text",
      text: input,
      sender: session?.user?.name || 'Anonymous',
      timestamp: new Date()
    };

    socket?.emit("chatMessage", message);
    setInput("");
  };

  const handleFileUpload = () => {
    if (!file || !socket) return;

    const formData = new FormData();
    formData.append("file", file);

    fetch("/api/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        socket.emit("sendFile", {
          url: data.url,
          sender: session?.user?.name || 'Anonymous',
        });
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
      });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] overflow-y-auto mb-4 p-4 border rounded-md">
          {loading ? <p>Loading messages...</p> :
            messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 ${msg.sender === session?.user?.name ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`inline-block p-3 rounded-lg ${
                    msg.sender === session?.user?.name
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                >
                  {msg.type === "text" ? (
                    <p>{msg.text}</p>
                  ) : (
                    <a
                      href={msg.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-500 hover:underline"
                    >
                      <Paperclip className="mr-1" size={16} />
                      Attachment
                    </a>
                  )}
                  <div className="text-xs mt-1 opacity-70">
                    {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
            <span className="sr-only">Attach file</span>
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="flex-1"
          />
          <Button type="button" onClick={handleSendMessage}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
        {file && (
          <div className="mt-2 text-sm text-muted-foreground">
            File selected: {file.name}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
