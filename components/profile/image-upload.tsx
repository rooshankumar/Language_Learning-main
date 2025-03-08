
"use client"

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Camera } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth-context';

// Helper function to convert file to base64
const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export function ImageUpload({ onImageUploaded }: { onImageUploaded?: (url: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user, updateUser } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.includes('image')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPEG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Show preview
    setPreview(URL.createObjectURL(file));

    try {
      setIsUploading(true);
      
      // Create a FormData object
      const formData = new FormData();
      formData.append('profilePic', file);
      
      // Upload to server
      const response = await fetch('/api/users/upload-profile', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Update user context with new profile pic
      if (updateUser && user) {
        updateUser({
          ...user,
          profilePic: data.profilePic,
          photoURL: data.profilePic,
        });
      }
      
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
      });
      
      // Call callback if provided
      if (onImageUploaded) {
        onImageUploaded(data.profilePic);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload profile picture. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div
        className="relative cursor-pointer group"
        onClick={handleAvatarClick}
      >
        <Avatar className="w-24 h-24">
          <AvatarImage src={preview || user?.profilePic || user?.photoURL || user?.image || '/placeholder-user.jpg'} />
          <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition">
          <Camera className="text-white" />
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />
      <span className="text-sm text-muted-foreground">
        {isUploading ? 'Uploading...' : 'Click to upload profile picture'}
      </span>
    </div>
  );
}
"use client"

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Camera, Loader2 } from "lucide-react"

export function ImageUpload() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleClick = () => {
    fileInputRef.current?.click()
  }
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      })
      return
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size should be less than 5MB",
        variant: "destructive"
      })
      return
    }
    
    try {
      setIsLoading(true)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', user?.id || user?._id || '')
      
      const response = await fetch('/api/user/upload-image', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to upload image')
      }
      
      const data = await response.json()
      
      // Update user in context
      if (updateUser && user) {
        updateUser({
          ...user,
          profilePic: data.imageUrl,
          image: data.imageUrl,
          photoURL: data.imageUrl,
        })
      }
      
      toast({
        title: "Image uploaded",
        description: "Your profile image has been updated"
      })
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast({
        title: "Upload failed",
        description: error.message || "There was a problem uploading your image",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }
  
  return (
    <div className="flex flex-col items-center">
      <Avatar className="h-24 w-24 mb-4">
        <AvatarImage 
          src={user?.profilePic || user?.photoURL || user?.image || "/placeholder-user.jpg"} 
          alt={user?.displayName || user?.name || "User"} 
        />
        <AvatarFallback>
          {user?.displayName?.charAt(0) || user?.name?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>
      
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            Change Photo
          </>
        )}
      </Button>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />
    </div>
  )
}
