
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
