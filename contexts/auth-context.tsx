"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Session } from "next-auth";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UserData {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
}

type AuthContextType = {
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  user: UserData | null;
  signIn: (provider: string, options?: any) => Promise<any>;
  signOut: () => Promise<any>;
  updateSession: () => Promise<void>;
  isOnboarded: boolean;
  loading: boolean;
  updateUserProfile: (profileData: any) => Promise<void>;
  updateUser: (userData: UserData) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null); //Added to manage user data


  const updateSession = useCallback(async () => {
    try {
      setLoading(true);
      await update();
      setUser(session?.user); // Update user state after session update
    } catch (error) {
      console.error("Error updating session:", error);
      // Notify the user about session update failure
      setUser(null); // Reset user state if session update fails
    } finally {
      setLoading(false);
    }
  }, [update, session]);

  useEffect(() => {
    // After initial load, set loading to false
    if (status !== "loading") {
      setLoading(false);
      setUser(session?.user); //Set user state on initial load
    }
  }, [status, session]);

  const updateUserProfile = async (profileData: any) => {
    try {
      if (!session?.user) throw new Error('No user logged in');

      // Handle image upload if there's a file
      if (profileData.imageFile) {
        const formData = new FormData();
        formData.append('file', profileData.imageFile);
        formData.append('userId', session.user.id);

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

      await updateSession(); // Use updateSession to refresh after profile update.
      return await res.json();
    } catch (error: any) {
      console.error("Profile update error:", error);
      throw error;
    }
  };

  const updateUser = (userData: UserData) => {
    setUser(userData);
  };

  const value = {
    session,
    status,
    user,
    signIn,
    signOut: async () => {
      await signOut({ redirect: false });
      router.push("/sign-in");
    },
    updateSession,
    isOnboarded: !!session?.user?.isOnboarded,
    loading: status === "loading" || loading,
    updateUserProfile,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};