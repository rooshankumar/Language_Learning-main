
import mongoose from 'mongoose';

let isConnected = false;

export const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
      isConnected = true;
      console.log('✅ MongoDB connected successfully');
    } else {
      isConnected = true;
      console.log('✅ MongoDB already connected');
    }
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
  }
};
import mongoose from 'mongoose';

// Set up mongoose promise
mongoose.Promise = global.Promise;

// Cache connection
let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase() {
  // Return existing connection if it exists
  if (cachedConnection) {
    return { connection: cachedConnection };
  }

  // Check if MongoDB URI is set
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    // Set mongoose options
    const options: mongoose.ConnectOptions = {
      // These options help with connection stability
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    // Connect to MongoDB
    const connection = await mongoose.connect(process.env.MONGODB_URI, options);
    
    // Cache the connection
    cachedConnection = connection;
    
    // Initialize models here if needed
    // require('../models/User');
    // require('../models/Chat');
    
    return { connection };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectFromDatabase() {
  if (cachedConnection) {
    await mongoose.disconnect();
    cachedConnection = null;
  }
}
