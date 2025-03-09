
"use client"

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"

export function ImageUpload() {
  const { data: session, update } = useSession()
  const [uploading, setUploading] = useState(false)
  const [profileImage, setProfileImage] = useState(session?.user?.image || "")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'my_language_app')
      
      const response = await fetch('https://api.cloudinary.com/v1_1/dx6ulcmub/image/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      
      const data = await response.json()
      setProfileImage(data.secure_url)
      
      // Update user profile in the database
      const updateResponse = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: data.secure_url }),
      })
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update profile')
      }
      
      // Update the session
      await update({
        ...session,
        user: {
          ...session?.user,
          image: data.secure_url,
        },
      })
      
      toast({
        title: "Success",
        description: "Profile image updated successfully",
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Avatar 
              className="h-24 w-24 cursor-pointer" 
              onClick={handleImageClick}
            >
              <AvatarImage src={profileImage} alt="Profile" />
              <AvatarFallback className="text-lg">
                {session?.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <div className="text-center">
              <Label htmlFor="picture" className="text-sm text-muted-foreground block mb-2">
                Profile Picture
              </Label>
              <Button 
                onClick={handleImageClick}
                variant="outline" 
                size="sm" 
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Change Photo"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
