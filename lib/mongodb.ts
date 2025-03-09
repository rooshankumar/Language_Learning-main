
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("❌ MONGODB_URI is missing in .env file");
}

const uri = process.env.MONGODB_URI;
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR
  let globalWithMongo = global as typeof global & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;

// Helper function to get db instance
export async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db();
  return { client, db };
}

// Keep the connectToDB function for backward compatibility
export async function connectToDB() {
  try {
    const { db } = await connectToDatabase();
    console.log("✅ MongoDB Connected");
    return db;
  } catch (error) {
    console.error("🚨 MongoDB Connection Error:", error);
    throw error;
  }
}
