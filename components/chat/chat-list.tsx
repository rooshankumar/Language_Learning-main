"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface Chat {
  id: string
  participants: string[]
  lastMessage?: {
    content: string
    senderId: string
    timestamp: any
    read?: boolean
  }
  createdAt: any
  unreadCount: number
}

interface User {
  uid: string
  displayName?: string
  photoURL?: string
  about?: string
  languages?: string[]
}

export function ChatList() {
  const { user } = useAuth()
  const router = useRouter()
  const [chats, setChats] = useState<Chat[]>([])
  const [users, setUsers] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)

  // Fetch chats for the current user
  useEffect(() => {
    if (!user) return

    const fetchChats = async () => {
      try {
        if (!db) throw new Error('Firestore not initialized');
        const chatsRef = collection(db, 'chats')
        const q = query(chatsRef, where('participants', 'array-contains', user.uid))
        const querySnapshot = await getDocs(q)

        // Get chat metadata for unread counts
        const metadataRef = collection(db, 'users', user.uid, 'chatMetadata')
        const metadataSnapshot = await getDocs(metadataRef)
        const metadata: { [key: string]: any } = {}
        metadataSnapshot.forEach(doc => {
          metadata[doc.id] = doc.data()
        })

        const chatList: Chat[] = []
        querySnapshot.forEach((doc) => {
          chatList.push({
            id: doc.id,
            ...doc.data()
          } as Chat)
        })

        // Sort by last message timestamp (descending)
        chatList.sort((a, b) => {
          const timeA = a.lastMessage?.timestamp?.toMillis() || a.createdAt?.toMillis() || 0
          const timeB = b.lastMessage?.timestamp?.toMillis() || b.createdAt?.toMillis() || 0
          return timeB - timeA
        })

        setChats(chatList)
        await fetchUsers(chatList)
      } catch (error) {
        console.error("Error fetching chats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchChats()
  }, [user])

  // Fetch user data for chat participants
  const fetchUsers = async (chatList: Chat[]) => {
    const userIds = new Set<string>()

    // Gather all unique user IDs from chat participants
    chatList.forEach(chat => {
      chat.participants.forEach(id => {
        if (id !== user?.uid) {
          userIds.add(id)
        }
      })
    })

    const userDataMap: Record<string, User> = {}

    // Fetch user data for each ID
    for (const uid of userIds) {
      try {
        if (!db) {
          throw new Error('Firestore database not initialized');
        }
        const userDoc = await getDoc(doc(db, 'users', uid))
        if (userDoc.exists()) {
          userDataMap[uid] = {
            uid,
            ...userDoc.data() as Omit<User, 'uid'>
          }
        }
      } catch (error) {
        console.error(`Error fetching user ${uid}:`, error)
      }
    }

    setUsers(userDataMap)
  }

  // Get the other participant's info
  const getOtherParticipant = (chat: Chat) => {
    const otherUserId = chat.participants.find(id => id !== user?.uid) || ''
    return users[otherUserId] || { uid: otherUserId, displayName: 'Unknown User' }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading chats...</div>
  }

  return (
    <Card className="h-full border-0 shadow-none">
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="px-3 py-2">
          {chats.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">
              No conversations yet. Start chatting with users from the community.
            </div>
          ) : (
            chats.map(chat => {
              const otherUser = getOtherParticipant(chat)
              const lastMessage = chat.lastMessage?.content || 'Start a conversation'
              const timestamp = chat.lastMessage?.timestamp 
                ? formatDistanceToNow(chat.lastMessage.timestamp.toDate(), { addSuffix: true })
                : ''

              return (
                <Link 
                  href={`/chat/${chat.id}`} 
                  key={chat.id} 
                  className="block"
                >
                  <div className={cn(
                    "flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent",
                    chat.unreadCount && chat.unreadCount > 0 ? "bg-muted" : ""
                  )}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={otherUser.photoURL} alt={otherUser.displayName} />
                      <AvatarFallback>{otherUser.displayName?.substring(0, 2) || 'UN'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium leading-none truncate">
                          {otherUser.displayName}
                        </span>
                        {timestamp && (
                          <span className="text-xs text-muted-foreground">{timestamp}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {lastMessage}
                        </span>
                        {chat.unreadCount && chat.unreadCount > 0 ? (
                          <span className="inline-flex items-center justify-center h-5 w-5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                            {chat.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import chatService from '@/lib/chat-service';

interface ChatPreview {
  _id: string;
  participants: any[];
  lastMessage?: {
    text: string;
    sender: string;
    createdAt: Date;
  };
  updatedAt: Date;
}

interface ChatParticipant {
  _id: string;
  name: string;
  image?: string;
  profilePic?: string;
  online?: boolean;
}

export function ChatList() {
  const { data: session } = useSession();
  const router = useRouter();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [participants, setParticipants] = useState<{[key: string]: ChatParticipant}>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Fetch chats on component mount
  useEffect(() => {
    if (!session?.user) return;

    const fetchChats = async () => {
      try {
        const response = await fetch('/api/chat');
        if (!response.ok) {
          throw new Error('Failed to fetch chats');
        }
        
        const data = await response.json();
        setChats(data.chats || []);
        
        // Extract unique participant IDs (excluding current user)
        const participantIds = new Set<string>();
        data.chats.forEach((chat: ChatPreview) => {
          chat.participants.forEach((participantId: string) => {
            if (participantId !== session.user.id) {
              participantIds.add(participantId);
            }
          });
        });
        
        // Fetch participant details
        if (participantIds.size > 0) {
          const participantsResponse = await fetch('/api/community/users?ids=' + Array.from(participantIds).join(','));
          if (participantsResponse.ok) {
            const participantsData = await participantsResponse.json();
            
            const participantsMap: {[key: string]: ChatParticipant} = {};
            participantsData.users.forEach((user: ChatParticipant) => {
              participantsMap[user._id] = {
                ...user,
                image: user.profilePic || user.image || '/placeholder-user.jpg'
              };
            });
            
            setParticipants(participantsMap);
          }
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
    
    // Subscribe to chat updates
    const unsubscribeChatUpdates = chatService.subscribeToChatUpdates((data) => {
      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat._id === data.chatId) {
            return {
              ...chat,
              lastMessage: data.lastMessage,
              updatedAt: new Date()
            };
          }
          return chat;
        });
      });
    });
    
    // Subscribe to online users
    const unsubscribeOnlineUsers = chatService.subscribeToOnlineUsers((users) => {
      setOnlineUsers(users);
    });
    
    return () => {
      unsubscribeChatUpdates();
      unsubscribeOnlineUsers();
    };
  }, [session?.user]);

  // Navigate to chat when clicked
  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  // Filter chats based on search term
  const filteredChats = chats.filter(chat => {
    if (!searchTerm) return true;
    
    // Find the other participant
    const otherParticipantId = chat.participants.find(id => id !== session?.user?.id);
    if (!otherParticipantId) return false;
    
    const participant = participants[otherParticipantId];
    if (!participant) return false;
    
    return participant.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Sort chats by most recent activity
  const sortedChats = [...filteredChats].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  if (!session?.user) {
    return <div className="flex items-center justify-center h-full">Please sign in to view chats</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search chats"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading chats...
          </div>
        ) : sortedChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
            <p>No chats found.</p>
            <p className="text-sm mt-2">Start a conversation from the Community tab.</p>
          </div>
        ) : (
          sortedChats.map(chat => {
            // Find the other participant
            const otherParticipantId = chat.participants.find(id => id !== session.user.id);
            const participant = otherParticipantId ? participants[otherParticipantId] : null;
            const isOnline = participant && onlineUsers.includes(otherParticipantId);
            
            return (
              <Card
                key={chat._id}
                className="mb-2 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleChatClick(chat._id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={participant?.image || "/placeholder-user.jpg"} alt={participant?.name} />
                        <AvatarFallback>{participant?.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium truncate">
                          {participant?.name || "Unknown User"}
                        </h3>
                        {chat.lastMessage?.createdAt && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(chat.lastMessage.createdAt), 'HH:mm')}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {chat.lastMessage?.text || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ChatList;
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';

export default function ChatList() {
  const { data: session } = useSession();
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChats() {
      try {
        const response = await fetch('/api/chat');
        if (response.ok) {
          const data = await response.json();
          setChats(data);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchChats();
    }
  }, [session]);

  if (loading) {
    return <div className="flex justify-center py-8">Loading conversations...</div>;
  }

  if (chats.length === 0) {
    return (
      <Card className="border border-dashed bg-muted/40">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold">No conversations yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Start a new conversation with language partners or AI assistants to practice your skills
          </p>
          <Button onClick={() => router.push('/community')}>Find Language Partners</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {chats.map((chat) => (
        <Card key={chat._id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={chat.participants[0]?.profileImage || '/placeholder-user.jpg'} />
                  <AvatarFallback>{chat.participants[0]?.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{chat.participants[0]?.name || 'User'}</CardTitle>
                  <CardDescription className="text-xs">
                    {new Date(chat.updatedAt).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
              {chat.unreadCount > 0 && (
                <Badge variant="default" className="ml-auto">
                  {chat.unreadCount}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {chat.lastMessage?.content || 'Start a conversation'}
            </p>
          </CardContent>
          <CardFooter className="pt-1">
            <Button variant="ghost" className="w-full" onClick={() => router.push(`/chat/${chat._id}`)}>
              Open Chat
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
