
import mongoose from 'mongoose';

let isConnected = false;

export const connectToDatabase = async () => {
  if (isConnected) {
    console.log('MongoDB is already connected');
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  try {
    // Check connection state
    const connectionState = mongoose.connection.readyState;
    
    if (connectionState === 0) {
      // Not connected, connect now
      const options: mongoose.ConnectOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4, skip trying IPv6
      };

      await mongoose.connect(process.env.MONGODB_URI, options);
      isConnected = true;
      console.log('✅ MongoDB connected successfully');
    } else if (connectionState === 1) {
      // Already connected
      isConnected = true;
      console.log('✅ MongoDB already connected');
    } else if (connectionState === 2) {
      // Connecting
      console.log('⏳ MongoDB connection in progress...');
    } else if (connectionState === 3) {
      // Disconnecting
      console.log('⚠️ MongoDB disconnecting...');
    }
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    console.error('URI (redacted):', process.env.MONGODB_URI?.replace(/\/\/(.+?)@/, '//****:****@'));
    throw error;
  }
};

export async function disconnectFromDatabase() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected');
  }
}
