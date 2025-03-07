"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  Auth,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from "firebase/auth";
import { setDoc, doc, getFirestore, Firestore } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb, googleProvider, phoneProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phoneNumber: string, recaptchaContainer: string) => Promise<string>;
  confirmPhoneCode: (verificationId: string, code: string) => Promise<void>;
  updateUserProfile: (profileData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      router.push('/');
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      if (name && user) {
        await updateProfile(user, { displayName: name });
        await setDoc(doc(firebaseDb, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          createdAt: new Date().toISOString(),
        });
      }
      router.push('/onboarding');
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (!googleProvider) {
        throw new Error("Google provider is not available");
      }
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = doc(firebaseDb, 'users', user.uid);
      await setDoc(userDoc, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastSignIn: new Date().toISOString(),
      }, { merge: true });
      
      router.push('/');
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(firebaseAuth);
      router.push('/sign-in');
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const signInWithPhone = async (phoneNumber: string, recaptchaContainer: string) => {
    try {
      const verifier = new RecaptchaVerifier(firebaseAuth, recaptchaContainer, {
        size: 'invisible',
      });
      const confirmationResult = await signInWithPhoneNumber(firebaseAuth, phoneNumber, verifier);
      return confirmationResult.verificationId;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const confirmPhoneCode = async (verificationId: string, code: string) => {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      if (!phoneProvider) {
        throw new Error("Phone provider is not available");
      }
      await signInWithPopup(firebaseAuth, phoneProvider);
      router.push('/');
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const updateUserProfile = async (profileData: any) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      // Only update these fields if they're provided
      if (profileData.displayName || profileData.photoURL) {
        // Update Firebase Auth profile
        const authUpdateData: { displayName?: string; photoURL?: string } = {};
        
        if (profileData.displayName) {
          authUpdateData.displayName = profileData.displayName;
        }
        
        if (profileData.photoURL) {
          authUpdateData.photoURL = profileData.photoURL;
        }
        
        if (Object.keys(authUpdateData).length > 0) {
          await updateProfile(user, authUpdateData);
        }
      }
      
      // Update Firestore user document - only with the fields that are actually provided
      const cleanedData = { ...profileData };
      
      // Remove undefined values and empty strings
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === undefined || (typeof cleanedData[key] === 'string' && cleanedData[key].trim() === '')) {
          delete cleanedData[key];
        }
      });
      
      if (Object.keys(cleanedData).length > 0) {
        await setDoc(doc(firebaseDb, 'users', user.uid), {
          ...cleanedData,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
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
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithGoogle,
    signInWithPhone,
    confirmPhoneCode,
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