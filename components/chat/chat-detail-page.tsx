
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { 
  getChatById, 
  sendMessage as sendChatMessage,
  markMessagesAsRead,
  subscribeToChatMessages
} from '@/lib/chat-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

export default function ChatDetailPage() {
  const { chatId } = useParams() as { chatId: string };
  const { session } = useAuth();
  const userId = session?.user?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  useEffect(() => {
    const fetchChat = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const response = await getChatById(chatId, userId);
        
        if (response.success && response.chat) {
          setChat(response.chat);
          setMessages(response.chat.messages || []);
          
          // Find the other participant
          const other = response.chat.participants.find(
            (p: any) => p._id.toString() !== userId
          );
          setOtherUser(other);
          
          // Mark messages as read
          await markMessagesAsRead(chatId, userId);
        } else {
          console.error('Failed to fetch chat:', response.error);
        }
      } catch (error) {
        console.error('Error in chat detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
    
    // Set up subscription to new messages
    const unsubscribe = subscribeToChatMessages(chatId, (updatedMessages: any) => {
      setMessages(updatedMessages);
    });

    return () => {
      unsubscribe();
    };
  }, [chatId, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || sending || !userId) return;
    
    setSending(true);
    try {
      const response = await sendChatMessage(chatId, userId, messageText);
      
      if (response.success) {
        setMessageText('');
        
        // Refresh chat to get the new message
        const updatedChat = await getChatById(chatId, userId);
        if (updatedChat.success) {
          setChat(updatedChat.chat);
          setMessages(updatedChat.chat.messages || []);
        }
      } else {
        console.error('Failed to send message:', response.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const goBack = () => {
    router.push('/chat');
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b p-4 flex items-center">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-10 w-40 ml-4" />
        </div>
        <div className="flex-grow p-4 overflow-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-20 w-48 ml-2 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        {otherUser && (
          <div className="flex items-center ml-4">
            <div className="relative h-10 w-10 rounded-full overflow-hidden">
              <Image 
                src={otherUser.profilePic || otherUser.image || "/placeholder-user.jpg"} 
                alt={otherUser.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="ml-3">
              <h3 className="font-medium">{otherUser.name}</h3>
              <p className="text-xs text-muted-foreground">
                {otherUser.online ? 'Online' : otherUser.lastSeen ? 
                  `Last seen ${formatDistanceToNow(new Date(otherUser.lastSeen))} ago` : 
                  'Offline'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-grow p-4 overflow-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message: any) => {
            const isOwnMessage = message.sender.toString() === userId;
            
            return (
              <div 
                key={message._id} 
                className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                {!isOwnMessage && otherUser && (
                  <div className="relative h-8 w-8 rounded-full overflow-hidden mr-2">
                    <Image 
                      src={otherUser.profilePic || otherUser.image || "/placeholder-user.jpg"} 
                      alt={otherUser.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                
                <div className={`px-4 py-2 rounded-lg max-w-[70%] ${
                  isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <p>{message.text}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(message.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                    {isOwnMessage && message.readAt && ' • Read'}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="border-t p-4 flex">
        <Input
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          className="flex-grow"
          disabled={sending}
        />
        <Button type="submit" className="ml-2" disabled={sending}>
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
