'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import clientPromise from "@/lib/mongodb"; 
import { ObjectId } from "mongodb";       


export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (session?.user) {
      setUser(session.user);
    } else {
      setUser(null);
    }

    setLoading(false);
  }, [session, status]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      router.refresh();
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      return await login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut({ 
        redirect: true,
        callbackUrl: '/sign-in'
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback if the redirect fails
      window.location.href = '/sign-in';
    }
  };

  const updateUser = (userData: any) => {
    console.log("Updating user in context with:", userData);
    
    // Ensure we're working with the right structure
    const newUserData = userData.user ? userData.user : userData;
    
    if (!newUserData) {
      console.error("Invalid user data format received:", userData);
      return;
    }
    
    // Update the state with a complete replacement to ensure all fields sync
    setUser((prevUser) => {
      // Create a complete user object with all fields from both sources
      const updatedUser = { ...prevUser, ...newUserData };
      console.log("Updated user state:", updatedUser);
      
      // Sync with localStorage for client-side persistence
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (err) {
          console.error("Error saving user to localStorage:", err);
        }
      }
      
      return updatedUser;
    });
    
    // Force session refresh on the server
    if (typeof window !== 'undefined') {
      // Request the user session to refresh
      fetch('/api/auth/session', { method: 'GET' })
        .catch(err => console.error("Error refreshing session:", err));
    }
  };

  const value = {
    user,
    loading,
    status,
    login,
    logout,
    register,
    isAuthenticated: !!user,
    updateUser, // Added updateUser to the context
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};