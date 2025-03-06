"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useParams, useRouter } from 'next/navigation'
import { MessageSquare, ArrowLeft, SendHorizontal, PaperclipIcon } from 'lucide-react'
import { ChatInput } from './chat-input'
import { useChat } from '@/hooks/use-chat'
import { useAuth } from '@/contexts/auth-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'

interface Message {
  id: string
  senderId: string
  text: string
  timestamp: string
}

interface ChatWindowProps {
  chatId: string
  recipientId: string
  onBack?: () => void
  messages?: Message[]
}

interface RecipientProfile {
  photoURL?: string
  displayName?: string
  isOnline?: boolean
}

export function ChatWindow({ chatId, recipientId, onBack, messages: initialMessages }: ChatWindowProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { messages = initialMessages || [], sendMessage, loading, error } = useChat(chatId, recipientId)
  const [input, setInput] = useState('')
  const [recipientProfile, setRecipientProfile] = useState<RecipientProfile | null>(null)

  const handleSendMessage = async () => {
    if (!input.trim()) return

    await sendMessage(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!user) {
    return <div>Please sign in to view messages</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-3 flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden mr-2"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-2">
            <AvatarImage src={recipientProfile?.photoURL || '/placeholder-user.jpg'} />
            <AvatarFallback>
              {recipientProfile?.displayName?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
              {recipientProfile?.displayName || 'User'}
            </div>
            {recipientProfile?.isOnline && (
              <div className="text-xs text-green-500">Online</div>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex justify-center p-4">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">No messages yet</h3>
            <p>
              Start the conversation by sending a message below
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isCurrentUser = message.senderId === user.uid

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-end gap-2 max-w-[80%]">
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={recipientProfile?.photoURL || '/placeholder-user.jpg'} />
                        <AvatarFallback>
                          {recipientProfile?.displayName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isCurrentUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="text-sm break-words">{message.text}</div>
                      <div className="text-xs mt-1 opacity-70">
                        {format(new Date(message.timestamp), 'h:mm a')}
                      </div>
                    </div>
                    {isCurrentUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || '/placeholder-user.jpg'} />
                        <AvatarFallback>
                          {user.displayName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          <ChatInput 
            value={input}
            onChange={setInput}
            onSend={handleSendMessage}
            placeholder="Type a message..."
            disabled={loading}
          />
        </div>
      </div>
    </div>
  )
}