import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  connectAuthEmulator, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  PhoneAuthProvider 
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let firebaseApp;
let auth: ReturnType<typeof getAuth>;
let db: Firestore | null;
let storage: FirebaseStorage | null;
let googleProvider;
let githubProvider;
let phoneProvider;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Check if we have the minimum required config
const hasMinConfig = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

// Create a server-side stub for auth
const createAuthStub = () => ({
  currentUser: null,
  onAuthStateChanged: () => () => {},
  signInWithEmailAndPassword: async () => ({ user: null }),
  createUserWithEmailAndPassword: async () => ({ user: null }),
  signOut: async () => {},
  setPersistence: async () => {},
  signInWithPopup: async () => ({ user: null }),
  signInWithPhoneNumber: async () => ({ verificationId: '' }),
  updateProfile: async () => {},
});

// Initialize Firebase based on environment
if (!isBrowser) {
  // Server-side initialization
  auth = createAuthStub() as any;
  db = null;
  storage = null;
  firebaseApp = null;
  googleProvider = null;
  githubProvider = null;
  phoneProvider = null;
} else if (!hasMinConfig) {
  console.warn("Firebase config is missing or incomplete");
  auth = createAuthStub() as any;
  db = null;
  storage = null;
  firebaseApp = null;
  googleProvider = null;
  githubProvider = null;
  phoneProvider = null;
} else {
  try {
    // Initialize or get existing Firebase app
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Initialize Firebase services
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
    storage = getStorage(firebaseApp);
    
    // Initialize providers only in browser environment
    if (isBrowser) {
      googleProvider = new GoogleAuthProvider();
      githubProvider = new GithubAuthProvider();
      phoneProvider = new PhoneAuthProvider(auth);
    }
    
    // Set up emulators in development
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && isBrowser) {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
    // Fallback to stubs on initialization error
    auth = createAuthStub() as any;
    db = null;
    storage = null;
    googleProvider = null;
    githubProvider = null;
    phoneProvider = null;
  }
}

export { auth, db, storage, googleProvider, githubProvider, phoneProvider };