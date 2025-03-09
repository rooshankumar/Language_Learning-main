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
    setUser((prevUser) => ({ ...prevUser, ...userData }));

    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        localStorage.setItem('user', JSON.stringify({ ...parsedUser, ...userData }));
      }
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