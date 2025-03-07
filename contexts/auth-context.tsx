"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Session } from "next-auth";

interface AuthContextType {
  user: Session['user'] | null;
  loading: boolean;
  error: string | null;
  signIn: (provider: string, credentials?: { email: string; password: string }) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (profileData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loading = status === "loading";
  const user = session?.user || null;

  const handleSignIn = async (provider: string, credentials?: { email: string; password: string }) => {
    try {
      if (provider === "credentials" && credentials) {
        const result = await signIn("credentials", {
          redirect: false,
          email: credentials.email,
          password: credentials.password,
        });

        if (result?.error) {
          setError(result.error);
          throw new Error(result.error);
        }

        router.push(session?.user?.isOnboarded ? '/' : '/onboarding');
      } else {
        await signIn(provider, { callbackUrl: '/' });
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string, name: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        throw new Error(data.message);
      }

      // Auto sign in after registration
      await handleSignIn("credentials", { email, password });

      router.push('/onboarding');
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/sign-in' });
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        throw new Error(data.message);
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const updateUserProfile = async (profileData: any) => {
    try {
      if (!user) throw new Error('No user logged in');

      // Handle image upload if there's a file
      if (profileData.imageFile) {
        const formData = new FormData();
        formData.append('file', profileData.imageFile);
        formData.append('userId', user.id);

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

      // Update the session
      const updatedSession = {
        ...session,
        user: {
          ...session?.user,
          ...profileData,
        },
      };

      // Force a refresh of the session
      await fetch('/api/auth/session', { method: 'GET' });

      return await res.json();
    } catch (error: any) {
      console.error("Profile update error:", error);
      setError(error.message);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}