
import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

export function useProfile() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const updateProfile = async (profileData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      // Handle image upload if there's a file
      if (profileData.imageFile) {
        const formData = new FormData();
        formData.append('file', profileData.imageFile);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.message || 'Failed to upload image');
        }
        
        const { imageUrl } = await uploadRes.json();
        profileData.image = imageUrl;
      }
      
      // Remove the file from the data before sending to API
      delete profileData.imageFile;
      
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      const updatedProfile = await res.json();
      
      // Force refresh the session
      await fetch('/api/auth/session', { 
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });
      
      // Update the session data
      await update({
        ...session,
        user: {
          ...session?.user,
          ...updatedProfile,
        },
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      // Force router refresh to update UI components
      router.refresh();
      
      return updatedProfile;
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred while updating the profile';
      setError(errorMessage);
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const getProfile = useCallback(async (userId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = userId ? `/api/user/${userId}` : '/api/user/profile';
      
      const res = await fetch(url, {
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch profile');
      }
      
      return await res.json();
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred while fetching the profile';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    updateProfile,
    getProfile,
    loading,
    error,
  };
}
