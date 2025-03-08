
"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import Link from "next/link"

interface ProfileCardProps {
  user: any
  isLink?: boolean
}

export function ProfileCard({ user, isLink = true }: ProfileCardProps) {
  if (!user) return null

  const content = (
    <Card className="overflow-hidden h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.profilePic || user.photoURL || user.image || "/placeholder-user.jpg"} alt={user.displayName || user.name || "User"} />
            <AvatarFallback>{(user.displayName || user.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{user.displayName || user.name || "User"}</CardTitle>
            {user.country && (
              <CardDescription className="text-sm">{user.country}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {user.bio && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{user.bio}</p>
        )}
        
        <div className="space-y-2">
          {user.nativeLanguage && (
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Native: {user.nativeLanguage}
              </Badge>
            </div>
          )}
          
          {user.learningLanguage && (
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Learning: {user.learningLanguage}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
      {user.interests && user.interests.length > 0 && (
        <CardFooter className="pt-2">
          <div className="flex flex-wrap gap-1">
            {user.interests.slice(0, 3).map((interest: string) => (
              <Badge key={interest} variant="secondary" className="text-xs">
                {interest}
              </Badge>
            ))}
            {user.interests.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{user.interests.length - 3}
              </Badge>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  )

  if (isLink) {
    return (
      <Link href={`/profile/${user._id || user.id}`} className="block h-full">
        {content}
      </Link>
    )
  }

  return content
}
