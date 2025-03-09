
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { toast } from "@/hooks/use-toast"

type User = {
  _id: string
  name: string
  email: string
  image?: string
  languages?: string[]
  level?: string
  streakCount?: number
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/community/users')
        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }
        const data = await response.json()
        setUsers(data)
      } catch (error) {
        console.error('Error fetching users:', error)
        toast({
          title: "Error",
          description: "Failed to load community members",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const startChat = async (userId: string) => {
    try {
      const response = await fetch('/api/chat/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiverId: userId }),
      })

      if (!response.ok) {
        throw new Error('Failed to create chat')
      }

      const { chatId } = await response.json()
      router.push(`/chat/${chatId}`)
    } catch (error) {
      console.error('Error starting chat:', error)
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="flex justify-center p-6">Loading community members...</div>
  }

  if (users.length === 0) {
    return <div className="text-center p-6">No other users found in the community.</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {users.map((user) => (
        <Card key={user._id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.image || ''} alt={user.name} />
                <AvatarFallback>{user.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <h3 className="font-medium text-sm">{user.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {user.languages?.join(', ') || 'No languages specified'}
                </p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="mr-2">Level: {user.level || 'Beginner'}</span>
                  {user.streakCount && user.streakCount > 0 && (
                    <span>🔥 {user.streakCount} day streak</span>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-primary"
                onClick={() => startChat(user._id)}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
