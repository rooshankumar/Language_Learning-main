"use client"

import { useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatRelative } from "date-fns"
import { useAuth } from "@/contexts/auth-context"

type Message = {
  id: string
  senderId: string
  text: string
  timestamp: any
}

interface ChatMessagesProps {
  messages: Message[]
  currentUserId: string
  participants: {
    [key: string]: {
      displayName: string
      photoURL: string
    }
  }
}

export function ChatMessages({ messages, currentUserId, participants }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return ""
    return formatRelative(new Date(timestamp.toDate()), new Date())
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isCurrentUser = message.senderId === currentUserId
        const sender = isCurrentUser
          ? { displayName: user?.displayName || "You", photoURL: user?.photoURL || "" }
          : participants[message.senderId] || { displayName: "Unknown", photoURL: "" }

        return (
          <div key={message.id} className={`flex items-start gap-2 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={sender.photoURL || ""} alt={sender.displayName} />
              <AvatarFallback>{sender.displayName.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className={`max-w-[70%] ${isCurrentUser ? "items-end" : "items-start"}`}>
              <div className={`rounded-lg p-3 ${isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <p>{message.text}</p>
              </div>
              {message.timestamp && (
                <p className="text-xs text-muted-foreground mt-1">{formatMessageTime(message.timestamp)}</p>
              )}
            </div>
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}

