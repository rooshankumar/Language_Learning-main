
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowLeft, MoreVertical, Info, Phone, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

interface ChatPartner {
  id: string;
  name: string;
  image: string;
  lastSeen: Date;
  online: boolean;
}

export function ChatUI({ partnerId }: { partnerId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [partner, setPartner] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch chat data
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/chat?partnerId=${partnerId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch chat data");
        }
        
        const data = await response.json();
        setPartner(data.partner);
        setMessages(data.messages || []);
      } catch (error) {
        console.error("Error fetching chat:", error);
        toast({
          title: "Error",
          description: "Failed to load chat conversation",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (partnerId) {
      fetchChatData();
    }
  }, [partnerId, toast]);
  
  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Send message function
  const sendMessage = async () => {
    if (!messageText.trim() || !session?.user || !partner) return;
    
    try {
      setSending(true);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partnerId: partner.id,
          message: messageText.trim(),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      const data = await response.json();
      
      // Add message to the list
      setMessages(prev => [...prev, {
        id: data.message.id,
        senderId: data.message.senderId,
        text: data.message.text,
        timestamp: new Date(data.message.timestamp)
      }]);
      
      // Clear input
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };
  
  // Return to chat list
  const goBack = () => {
    router.push("/chat");
  };
  
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center p-4 border-b">
          <Button variant="ghost" size="icon" onClick={goBack} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="ml-3 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16 mt-1" />
          </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
              <Skeleton className={`h-10 ${i % 2 === 0 ? 'w-32' : 'w-40'} rounded-lg`} />
            </div>
          ))}
        </div>
        <div className="p-4 border-t">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    );
  }
  
  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-center text-muted-foreground">
          User not found or conversation couldn't be loaded.
        </p>
        <Button onClick={goBack} className="mt-4">
          Return to Chats
        </Button>
      </div>
    );
  }
  
  // Helper for message display
  const isCurrentUser = (senderId: string) => {
    return senderId === session?.user?.id;
  };
  
  // Format time for display
  const formatMessageTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center p-3 border-b">
        <Button variant="ghost" size="icon" onClick={goBack} className="md:hidden mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={partner.image || "/placeholder-user.jpg"} alt={partner.name} />
          <AvatarFallback>{partner.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="ml-3 flex-1">
          <div className="font-medium">{partner.name}</div>
          <div className="text-xs text-muted-foreground">
            {partner.online ? (
              <span className="text-green-500">Online</span>
            ) : partner.lastSeen ? (
              `Last seen ${formatDistanceToNow(new Date(partner.lastSeen), { addSuffix: true })}`
            ) : (
              "Offline"
            )}
          </div>
        </div>
        <div className="flex">
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Info className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-muted-foreground mb-2">No messages yet</p>
            <p className="text-sm text-muted-foreground">
              Send a message to start the conversation with {partner.name}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`flex ${isCurrentUser(message.senderId) ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    isCurrentUser(message.senderId) 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  <div>{message.text}</div>
                  <div className={`text-xs mt-1 ${
                    isCurrentUser(message.senderId) 
                      ? 'text-primary-foreground/80' 
                      : 'text-muted-foreground'
                  }`}>
                    {formatMessageTime(new Date(message.timestamp))}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input */}
      <div className="p-3 border-t">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex space-x-2"
        >
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!messageText.trim() || sending}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
