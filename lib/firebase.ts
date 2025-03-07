import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { GoogleAuthProvider, GithubAuthProvider, PhoneAuthProvider } from "firebase/auth";
import { createMockAuth, createMockFirestore } from "./mock-auth";

// Check if Firebase config is available
const hasValidConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                       process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN && 
                       process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Use mock implementation for dev/testing when Firebase config is missing
let auth: any;
let db: any;
let storage: any;
let app: any;
let googleProvider: GoogleAuthProvider | undefined;
let githubProvider: GithubAuthProvider | undefined;
let phoneProvider: PhoneAuthProvider | undefined;

if (hasValidConfig) {
  // Real Firebase implementation
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  // Initialize Firebase
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

// Set up Firebase Storage with proper CORS
if (storage && typeof window !== 'undefined') {
  try {
    console.log("Setting up Firebase Storage with CORS config");
    
    // Make sure Firebase Storage has proper CORS settings
    // This needs to be done in Firebase Console, but we can check the connection
    const testRef = ref(storage, 'cors-test.txt');
    
    // Add event listeners for potential CORS issues
    window.addEventListener('error', (event) => {
      if (event.message && event.message.includes('CORS')) {
        console.error('CORS Error detected:', event);
        // Log for debugging but continue execution
      }
    });
  } catch (error) {
    console.error("Error setting up storage:", error);
  }
}
} else {
  console.warn("Firebase config is missing or incomplete");
  // Use mock implementations
  app = {};
  auth = createMockAuth();
  db = createMockFirestore();
  storage = { ref: () => ({ put: async () => ({ ref: { getDownloadURL: async () => "/placeholder.jpg" } }) }) };
}

// Initialize providers only in browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
if (isBrowser) {
  googleProvider = new GoogleAuthProvider();
  githubProvider = new GithubAuthProvider();
  phoneProvider = new PhoneAuthProvider(auth);
}


export { app, auth, db, storage, googleProvider, githubProvider, phoneProvider };