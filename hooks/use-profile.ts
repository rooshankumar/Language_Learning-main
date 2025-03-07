
import { useState } from 'react';
import { useSession } from 'next-auth/react';

export function useProfile() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      const updatedProfile = await res.json();
      
      // Update the session data
      await update({
        ...session,
        user: {
          ...session?.user,
          ...updatedProfile,
        },
      });
      
      return updatedProfile;
    } catch (error: any) {
      setError(error.message || 'An error occurred while updating the profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const getProfile = async (userId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = userId ? `/api/user/${userId}` : '/api/user/profile';
      
      const res = await fetch(url);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch profile');
      }
      
      return await res.json();
    } catch (error: any) {
      setError(error.message || 'An error occurred while fetching the profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    updateProfile,
    getProfile,
    loading,
    error,
  };
}
