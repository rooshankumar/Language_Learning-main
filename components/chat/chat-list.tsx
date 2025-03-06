"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
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