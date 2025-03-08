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
      // Set mongoose options
      const options: mongoose.ConnectOptions = {
        // These options help with connection stability
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      await mongoose.connect(process.env.MONGODB_URI, options);
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

export async function disconnectFromDatabase() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected');
  }
}