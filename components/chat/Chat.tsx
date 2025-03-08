
'use client';

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Paperclip, Send, Smile } from "lucide-react";

type Message = {
  type: 'text' | 'file';
  text?: string;
  url?: string;
  sender?: string;
  timestamp?: Date;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Connect to the Socket.io server
    const socketConnection = io(window.location.origin);
    setSocket(socketConnection);
    
    // Cleanup on unmount
    return () => {
      socketConnection.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

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
      socket.off("chatMessage");
      socket.off("receiveFile");
    };
  }, [socket]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!socket || !input.trim()) return;

    const message: Message = {
      type: "text",
      text: input,
      sender: session?.user?.name || 'Anonymous',
      timestamp: new Date()
    };
    
    socket.emit("chatMessage", message);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const sendFile = async () => {
    if (!socket || !file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/api/upload", formData);
      socket.emit("sendFile", response.data.fileUrl);
      setFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (file) {
      sendFile();
    }
  }, [file]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Chat Room</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] overflow-y-auto mb-4 p-4 border rounded-md">
          {messages.map((msg, index) => (
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

        <div className="flex items-center space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-grow"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <Button variant="outline" size="icon" onClick={openFileSelector}>
            <Paperclip size={18} />
          </Button>
          <Button onClick={sendMessage}>
            <Send size={18} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
