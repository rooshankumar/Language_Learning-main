
"use client"

import React from 'react'
import Image from 'next/image'
import { Card } from "@/components/ui/card"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { MessageSquare, Flag } from "lucide-react"
import { useChat } from "@/hooks/use-chat"
import { useAuth } from "@/contexts/auth-context"

interface UserCardProps {
  user: {
    id: string
    displayName?: string
    photoURL?: string
    location?: string
    bio?: string
    age?: number
    nativeLanguages?: string[]
    learningLanguages?: string[]
  }
}

export function UserCard({ user }: UserCardProps) {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { createOrGetChat } = useChat('', '')  // Initialize with empty strings as we only need createOrGetChat

  const handleMessageClick = async () => {
    if (!currentUser || !user.id || !createOrGetChat) return
    
    try {
      const chatId = await createOrGetChat(user.id)
      router.push(`/chat/${chatId}`)
    } catch (error) {
      console.error("Error starting chat:", error)
    }
  }

  const getLearningBadges = () => {
    if (!user.learningLanguages || !user.learningLanguages.length) {
      return <Badge variant="outline">No languages</Badge>
    }
    
    return user.learningLanguages.map((lang: string) => (
      <Badge key={lang} variant="secondary">{lang}</Badge>
    ))
  }

  const getNativeBadges = () => {
    if (!user.nativeLanguages || !user.nativeLanguages.length) {
      return <Badge variant="outline">No languages</Badge>
    }
    
    return user.nativeLanguages.map((lang: string) => (
      <Badge key={lang} variant="default">{lang}</Badge>
    ))
  }

  return (
    <Card className="overflow-hidden">
      <div className="aspect-[3/1] bg-gradient-to-r from-primary/20 to-primary/5"></div>
      <CardContent className="p-6 -mt-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="rounded-full border-4 border-background overflow-hidden">
            <Image 
              src={user.photoURL || "/placeholder-user.jpg"} 
              alt={user.displayName || "User"}
              width={80}
              height={80}
              className="aspect-square object-cover"
            />
          </div>
          <div>
            <h3 className="text-lg font-medium">{user.displayName || "User"}</h3>
            <p className="text-sm text-muted-foreground">
              {user.age ? `${user.age} years old` : "Age not specified"}
              {user.location && ` • ${user.location}`}
            </p>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Learning</h4>
          <div className="flex flex-wrap gap-2">
            {getLearningBadges()}
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Native</h4>
          <div className="flex flex-wrap gap-2">
            {getNativeBadges()}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          {user.bio || "No bio available"}
        </p>
      </CardContent>
      <CardFooter className="px-6 py-4 flex justify-between gap-4 border-t">
        <Button 
          className="flex-1" 
          onClick={handleMessageClick}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Message
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          title="Report user"
        >
          <Flag className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
