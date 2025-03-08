
// This is a temporary file to provide backward compatibility
// during the migration to MongoDB. This should be removed after fully migrating.

import { connectToDatabase } from './mongoose';
import User from '../models/User';

// Mock auth for backward compatibility during migration
import { getSession, signOut as nextAuthSignOut } from 'next-auth/react';

export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback: any) => {
    // This will check for NextAuth session and provide backward compatibility
    const checkSession = async () => {
      const session = await getSession();
      if (session?.user) {
        auth.currentUser = {
          uid: session.user.id,
          email: session.user.email,
          displayName: session.user.name,
          photoURL: session.user.image,
          ...session.user
        };
        callback(auth.currentUser);
      } else {
        auth.currentUser = null;
        callback(null);
      }
    };
    
    // Initial check
    checkSession();
    
    // We can't really replicate the Firebase real-time updates here,
    // but we can check the session periodically
    const interval = setInterval(checkSession, 5000);
    
    // Return an unsubscribe function
    return () => {
      clearInterval(interval);
    };
  },
  signOut: async () => {
    console.log("Auth mock: signOut called, redirecting to NextAuth signOut");
    return nextAuthSignOut({ callbackUrl: '/sign-in' });
  },
  // Add basic firebase auth methods for compatibility
  signInWithEmailAndPassword: async (email: string, password: string) => {
    console.log("Auth mock: signInWithEmailAndPassword called");
    // This should never be called directly, but if it is, redirect to NextAuth
    window.location.href = `/api/auth/signin?email=${encodeURIComponent(email)}`;
    return Promise.resolve({
      user: { email, uid: 'mock-uid' }
    });
  },
  createUserWithEmailAndPassword: async (email: string, password: string) => {
    console.log("Auth mock: createUserWithEmailAndPassword called");
    // Redirect to registration page or API
    window.location.href = `/api/auth/signup?email=${encodeURIComponent(email)}`;
    return Promise.resolve({
      user: { email, uid: 'mock-uid' }
    });
  }
};

// Mock db for backward compatibility
export const db = {
  collection: (name: string) => ({
    doc: (id: string) => ({
      get: async () => {
        await connectToDatabase();
        
        // Map collections to mongoose models
        let model;
        switch(name) {
          case 'users':
            model = User;
            break;
          default:
            return { exists: false, data: () => null };
        }
        
        try {
          const doc = await model.findById(id);
          return {
            exists: !!doc,
            data: () => doc ? doc.toObject() : null,
          };
        } catch (error) {
          console.error(`Error getting document ${name}/${id}`, error);
          return { exists: false, data: () => null };
        }
      },
      set: async (data: any) => {
        await connectToDatabase();
        
        let model;
        switch(name) {
          case 'users':
            model = User;
            break;
          default:
            console.log(`MongoDB mock: set data for unknown collection ${name}`);
            return Promise.resolve();
        }
        
        try {
          await model.findByIdAndUpdate(id, data, { upsert: true });
          console.log(`MongoDB mock: set data for ${name}/${id}`, data);
        } catch (error) {
          console.error(`Error setting document ${name}/${id}`, error);
        }
        
        return Promise.resolve();
      },
      update: async (data: any) => {
        await connectToDatabase();
        
        let model;
        switch(name) {
          case 'users':
            model = User;
            break;
          default:
            console.log(`MongoDB mock: update data for unknown collection ${name}`);
            return Promise.resolve();
        }
        
        try {
          await model.findByIdAndUpdate(id, data, { new: true });
          console.log(`MongoDB mock: update data for ${name}/${id}`, data);
        } catch (error) {
          console.error(`Error updating document ${name}/${id}`, error);
        }
        
        return Promise.resolve();
      },
    }),
    where: (field: string, operator: string, value: any) => ({
      get: async () => {
        await connectToDatabase();
        
        let model;
        switch(name) {
          case 'users':
            model = User;
            break;
          default:
            return { empty: true, docs: [] };
        }
        
        try {
          // Create a query filter based on parameters
          const filter: any = {};
          if (operator === '==') {
            filter[field] = value;
          } else if (operator === 'in') {
            filter[field] = { $in: value };
          }
          
          const docs = await model.find(filter);
          return {
            empty: docs.length === 0,
            docs: docs.map(doc => ({
              id: doc._id.toString(),
              data: () => doc.toObject()
            })),
          };
        } catch (error) {
          console.error(`Error querying collection ${name}`, error);
          return { empty: true, docs: [] };
        }
      },
    }),
  }),
};

// Default export for components that import firebase directly
export default {
  auth,
  firestore: () => db,
};
