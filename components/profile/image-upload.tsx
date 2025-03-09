"use client"

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

export function ImageUpload({ onUpload, initialImage }) {
  const [image, setImage] = useState(initialImage || null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.includes('image')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive"
      })
      return
    }

    try {
      setUploading(true)

      // Create FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'language_app_uploads')

      // Upload to Cloudinary
      const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()

      // Set the uploaded image URL
      setImage(data.secure_url)

      // Call the onUpload callback with the URL
      if (onUpload) {
        onUpload(data.secure_url)
      }

      toast({
        title: "Upload successful",
        description: "Your image has been uploaded",
        variant: "default"
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        <Card className="relative w-32 h-32 overflow-hidden cursor-pointer" onClick={handleImageClick}>
          {image ? (
            <Image 
              src={image} 
              alt="Profile" 
              fill 
              className="object-cover" 
            />
          ) : (
            <Avatar className="w-full h-full">
              <AvatarFallback>
                {uploading ? "..." : "?"}
              </AvatarFallback>
            </Avatar>
          )}
        </Card>

        <div className="flex flex-col items-center">
          <Input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleImageClick}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Change Image"}
          </Button>
        </div>
      </div>
    </div>
  );
}