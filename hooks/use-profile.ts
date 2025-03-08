
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from './use-toast';

interface Profile {
  name: string;
  bio: string;
  age?: number;
  nativeLanguage: string;
  learningLanguages: string[];
  interests: string[];
  profilePic?: string;
}

export const useProfile = () => {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      setProfile(data.user);
    } catch (err) {
      console.error('Error getting profile:', err);
      setError('Failed to load profile. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<Profile>) => {
    setIsLoading(true);
    try {
      console.log("Updating profile with data:", profileData);
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      console.log("Profile updated successfully:", data);
      setProfile(data.user);
      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
  };
};
