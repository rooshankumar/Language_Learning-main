
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

export function ImageUpload({ onImageUploaded }: { onImageUploaded?: (url: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user, updateUser } = useAuth();

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

    try {
      setIsUploading(true);

      // Convert image to base64
      const base64 = await convertToBase64(file);
      
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
      
      // Update user context
      if (updateUser) {
        updateUser({ ...user, photoURL: data.imageUrl });
      }
      
      // Callback if provided
      if (onImageUploaded) {
        onImageUploaded(data.imageUrl);
      }

      toast({
        title: 'Upload successful',
        description: 'Your profile picture has been updated',
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: 'There was a problem uploading your image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24">
        <AvatarImage src={user?.profilePic || user?.photoURL || '/placeholder-user.jpg'} alt="Profile" />
        <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
      </Avatar>
      
      <div className="relative">
        <input
          type="file"
          id="image-upload"
          className="sr-only"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isUploading}
        />
        <label htmlFor="image-upload">
          <Button 
            variant="outline" 
            className="cursor-pointer" 
            disabled={isUploading}
            type="button"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⟳</span> Uploading...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" /> Change Picture
              </span>
            )}
          </Button>
        </label>
      </div>
    </div>
  );
}
