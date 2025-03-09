import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("❌ MONGODB_URI is missing in .env file");
}

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    cachedClient = client;
    cachedDb = db;

    console.log("✅ Connected to MongoDB");
    return { client, db };
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
    throw new Error("Database connection error");
  }
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

export default connectToDatabase;