"use client";

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
        profileData.profilePic = imageUrl;
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

      const updatedUserData = await res.json();

      // Update the session with new user data
      await update({ ...updatedUserData });

      return updatedUserData;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/user/profile', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch profile');
      }

      const userData = await res.json();
      return userData;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateProfile,
    getProfile,
    loading,
    error
  };
}