
// This file provides backward compatibility during the migration from Firebase to MongoDB
// It should be removed once the migration is complete

import { connectToDatabase } from '../../lib/mongoose';
import User from '../../models/User';

// Mock Firebase auth and db for backward compatibility
export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback: any) => {
    return () => {};
  },
  signOut: async () => Promise.resolve(),
};

export const db = {
  collection: (name: string) => ({
    doc: (id: string) => ({
      get: async () => {
        await connectToDatabase();
        let model;
        switch(name) {
          case 'users':
            model = User;
            break;
          default:
            return { exists: false, data: () => null };
        }
        
        const doc = await model.findById(id);
        return {
          exists: !!doc,
          data: () => doc ? doc.toObject() : null,
        };
      },
      set: async (data: any) => {
        await connectToDatabase();
        let model;
        switch(name) {
          case 'users':
            model = User;
            break;
          default:
            return Promise.resolve();
        }
        
        await model.findByIdAndUpdate(id, data, { upsert: true });
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
            return Promise.resolve();
        }
        
        await model.findByIdAndUpdate(id, data, { new: true });
        return Promise.resolve();
      },
    }),
    where: () => ({
      get: async () => ({ empty: true, docs: [] }),
    }),
  }),
};

export const storage = null;
export const app = null;
export const googleProvider = null;
export const githubProvider = null;
export const phoneProvider = null;
