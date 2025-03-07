
// This is a temporary file to provide Firebase-like functionality
// during the migration to MongoDB. Remove this file after completing the migration.

export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback: any) => {
    // Return an unsubscribe function
    return () => {};
  },
  signOut: async () => {
    console.log("Firebase auth mock: signOut called");
    return Promise.resolve();
  },
};

export const db = {
  collection: (name: string) => ({
    doc: (id: string) => ({
      get: async () => ({
        exists: false,
        data: () => null,
      }),
      set: async (data: any) => {
        console.log(`Firebase mock: set data for ${name}/${id}`, data);
        return Promise.resolve();
      },
      update: async (data: any) => {
        console.log(`Firebase mock: update data for ${name}/${id}`, data);
        return Promise.resolve();
      },
    }),
    where: () => ({
      get: async () => ({
        empty: true,
        docs: [],
      }),
    }),
  }),
};

// Default export for components that import firebase directly
export default {
  auth,
  firestore: () => db,
};
