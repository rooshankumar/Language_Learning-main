
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ProfileData {
  name?: string;
  email?: string;
  profilePicture?: string;
  bio?: string;
  age?: number;
  nativeLanguage?: string;
  learningLanguage?: string;
  learningLanguages?: string[];
  interests?: string[];
}

export function useProfile() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (status === 'authenticated') {
        try {
          setLoading(true);
          const res = await fetch('/api/user/profile');
          
          if (!res.ok) {
            throw new Error(`Failed to fetch profile: ${res.status}`);
          }
          
          const data = await res.json();
          setProfile(data.user);
          setError(null);
        } catch (err) {
          console.error('Error fetching profile:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        } finally {
          setLoading(false);
        }
      }
    };

    if (status !== 'loading') {
      fetchProfile();
    }
  }, [status]);

  const updateProfile = async (data: Partial<ProfileData>) => {
    if (!session) {
      throw new Error('Not authenticated');
    }

    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }

    const updatedData = await res.json();
    setProfile(updatedData.user);
    return updatedData.user;
  };

  const uploadProfileImage = async (file: File) => {
    if (!session) {
      throw new Error('Not authenticated');
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }

    const data = await res.json();
    return data.url;
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadProfileImage,
  };
}
