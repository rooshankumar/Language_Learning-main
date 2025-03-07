
// This script helps migrate data from Firebase to MongoDB
// You would need to run this with Firebase credentials to export your data

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

dotenv.config();

// Check for MongoDB connection string
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set');
  process.exit(1);
}

async function migrateFirebaseToMongoDB(firebaseData) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Process users
    if (firebaseData.users && firebaseData.users.length > 0) {
      const User = mongoose.model('User');
      
      console.log(`Migrating ${firebaseData.users.length} users...`);
      
      for (const user of firebaseData.users) {
        // Convert Firebase document to MongoDB document
        const userData = {
          name: user.name,
          email: user.email,
          image: user.image || '/placeholder-user.jpg',
          bio: user.bio,
          nativeLanguage: user.nativeLanguage,
          learningLanguage: user.learningLanguage,
          interests: user.interests || [],
          isOnboarded: user.isOnboarded || false,
          // Map other fields as needed
        };
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: user.email });
        
        if (existingUser) {
          console.log(`Updating user: ${user.email}`);
          await User.findByIdAndUpdate(existingUser._id, userData);
        } else {
          console.log(`Creating user: ${user.email}`);
          await User.create(userData);
        }
      }
      
      console.log('✅ Users migration completed');
    }
    
    // Process other collections as needed (chats, messages, etc.)
    
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Example usage:
// Load Firebase data (this would come from your Firebase export)
const firebaseData = {
  users: [
    // Your exported Firebase user data
  ]
};

migrateFirebaseToMongoDB(firebaseData).catch(console.error);
