
import { v4 as uuidv4 } from 'uuid';

// Mock user for development
const mockUser = {
  uid: `mock-uid-${Date.now()}`,
  email: "dev@example.com",
  displayName: "Development User",
  emailVerified: true,
  isAnonymous: false,
  photoURL: "/placeholder-user.jpg",
  phoneNumber: "+1234567890",
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString()
  }
};

// Mock Auth
export const createMockAuth = () => {
  const listeners: ((user: any) => void)[] = [];
  
  const auth = {
    currentUser: mockUser,
    onAuthStateChanged: (listener: (user: any) => void) => {
      // Call the listener immediately with the mock user
      setTimeout(() => listener(mockUser), 100);
      
      // Store listener for future reference
      listeners.push(listener);
      
      // Return unsubscribe function
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };
    },
    signInWithEmailAndPassword: async () => {
      return { user: mockUser };
    },
    createUserWithEmailAndPassword: async () => {
      return { user: mockUser };
    },
    signOut: async () => {
      return Promise.resolve();
    },
    signInWithPopup: async () => {
      return { user: mockUser };
    },
    signInWithPhoneNumber: async () => {
      return {
        confirm: async () => ({ user: mockUser })
      };
    },
    verifyPhoneNumber: async () => {
      return { verificationId: "mock-verification-id" };
    },
    updateProfile: async () => {
      return Promise.resolve();
    },
    sendPasswordResetEmail: async () => {
      return Promise.resolve();
    }
  };
  
  return auth;
};

// Mock Firestore
export const createMockFirestore = () => {
  const mockDb = {
    // Create a mock document reference
    doc: (path: string) => {
      return {
        id: path.split('/').pop(),
        set: async (data: any, options?: any) => Promise.resolve(),
        get: async () => ({
          exists: true,
          data: () => ({ 
            name: "Test User", 
            email: "user@example.com",
            phoneNumber: "+1234567890",
            bio: "This is a test user bio",
            age: 25,
            nativeLanguage: "English",
            learningLanguage: "Spanish",
            interests: ["Reading", "Travel", "Music"]
          })
        }),
        update: async (data: any) => Promise.resolve(),
        delete: async () => Promise.resolve(),
        collection: (collPath: string) => mockDb.collection(`${path}/${collPath}`)
      };
    },
    // Create a mock collection reference
    collection: (path: string) => {
      return {
        id: path.split('/').pop(),
        doc: (docId = uuidv4()) => mockDb.doc(`${path}/${docId}`),
        add: async (data: any) => {
          const docId = `mock-doc-${Date.now()}`;
          const docRef = mockDb.doc(`${path}/${docId}`);
          return { ...docRef, id: docId };
        },
        where: () => ({
          get: async () => ({
            empty: false,
            docs: [
              {
                id: "user123",
                exists: true,
                data: () => ({ 
                  name: "Test User", 
                  email: "user@example.com",
                  phoneNumber: "+1234567890",
                  bio: "This is a test user bio",
                  age: 25,
                  nativeLanguage: "English",
                  learningLanguage: "Spanish",
                  interests: ["Reading", "Travel", "Music"]
                }),
                ref: mockDb.doc(`${path}/user123`)
              }
            ]
          }),
          orderBy: () => ({
            get: async () => ({
              empty: false,
              docs: [
                {
                  id: "user123",
                  exists: true,
                  data: () => ({ 
                    name: "Test User", 
                    email: "user@example.com",
                    photoURL: "/placeholder-user.jpg",
                    bio: "This is a test user bio",
                    age: 25,
                    nativeLanguage: "English",
                    learningLanguage: "Spanish",
                    interests: ["Reading", "Travel", "Music"]
                  }),
                  ref: mockDb.doc(`${path}/user123`)
                }
              ]
            }),
            onSnapshot: (callback) => {
              callback({
                empty: false,
                docs: [
                  {
                    id: "user123",
                    exists: true,
                    data: () => ({ 
                      name: "Test User", 
                      email: "user@example.com",
                      photoURL: "/placeholder-user.jpg",
                      bio: "This is a test user bio",
                      age: 25, 
                      nativeLanguage: "English",
                      learningLanguage: "Spanish",
                      interests: ["Reading", "Travel", "Music"]
                    }),
                    ref: mockDb.doc(`${path}/user123`)
                  }
                ]
              });
              return () => {};
            }
          }),
          onSnapshot: (callback) => {
            callback({
              empty: false,
              docs: [
                {
                  id: "user123",
                  exists: true,
                  data: () => ({ 
                    name: "Test User", 
                    email: "user@example.com", 
                    photoURL: "/placeholder-user.jpg",
                    bio: "This is a test user bio",
                    age: 25,
                    nativeLanguage: "English",
                    learningLanguage: "Spanish",
                    interests: ["Reading", "Travel", "Music"]
                  }),
                  ref: mockDb.doc(`${path}/user123`)
                }
              ]
            });
            return () => {};
          }
        }),
        orderBy: () => ({
          get: async () => ({
            empty: false,
            docs: [
              {
                id: "user123",
                exists: true,
                data: () => ({ 
                  name: "Test User", 
                  email: "user@example.com",
                  photoURL: "/placeholder-user.jpg",
                  bio: "This is a test user bio",
                  age: 25,
                  nativeLanguage: "English",
                  learningLanguage: "Spanish",
                  interests: ["Reading", "Travel", "Music"]
                }),
                ref: mockDb.doc(`${path}/user123`)
              }
            ]
          }),
          onSnapshot: (callback) => {
            callback({
              empty: false,
              docs: [
                {
                  id: "user123",
                  exists: true,
                  data: () => ({ 
                    name: "Test User", 
                    email: "user@example.com",
                    photoURL: "/placeholder-user.jpg",
                    bio: "This is a test user bio",
                    age: 25,
                    nativeLanguage: "English",
                    learningLanguage: "Spanish",
                    interests: ["Reading", "Travel", "Music"]
                  }),
                  ref: mockDb.doc(`${path}/user123`)
                }
              ]
            });
            return () => {};
          }
        }),
        onSnapshot: (callback) => {
          callback({
            empty: false,
            docs: [
              {
                id: "user123",
                exists: true,
                data: () => ({ 
                  name: "Test User", 
                  email: "user@example.com",
                  photoURL: "/placeholder-user.jpg",
                  bio: "This is a test user bio",
                  age: 25,
                  nativeLanguage: "English",
                  learningLanguage: "Spanish",
                  interests: ["Reading", "Travel", "Music"]
                }),
                ref: mockDb.doc(`${path}/user123`)
              }
            ]
          });
          return () => {};
        }
      };
    }
  };
  
  return mockDb;
};
