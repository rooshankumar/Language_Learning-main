
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function useAuthHook() {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const isLoading = status === 'loading';
  const user = session?.user || null;
  
  // Login with credentials or OAuth provider
  const signIn = async (provider: string, credentials?: { email: string; password: string }) => {
    try {
      setError(null);
      
      if (provider === 'credentials' && credentials) {
        const result = await nextAuthSignIn('credentials', {
          redirect: false,
          email: credentials.email,
          password: credentials.password,
        });
        
        if (result?.error) {
          setError(result.error);
          throw new Error(result.error);
        }
        
        // Redirect based on whether user has completed onboarding
        router.push(user?.isOnboarded ? '/' : '/onboarding');
      } else {
        // OAuth providers
        await nextAuthSignIn(provider, { callbackUrl: '/' });
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during sign in.');
      throw error;
    }
  };
  
  // Register new user
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      
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
      await signIn('credentials', { email, password });
      
      router.push('/onboarding');
    } catch (error: any) {
      setError(error.message || 'An error occurred during registration.');
      throw error;
    }
  };
  
  // Sign out
  const signOut = async () => {
    try {
      await nextAuthSignOut({ callbackUrl: '/sign-in' });
    } catch (error: any) {
      setError(error.message || 'An error occurred during sign out.');
      throw error;
    }
  };
  
  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      
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
      
      return data;
    } catch (error: any) {
      setError(error.message || 'An error occurred when resetting password.');
      throw error;
    }
  };
  
  return {
    user,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
