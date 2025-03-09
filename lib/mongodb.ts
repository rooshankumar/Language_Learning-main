import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("❌ MONGODB_URI is missing in .env file");
}

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

let client;
let clientPromise;
let db;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

// Helper function to get DB connection
export async function connectToDB() {
  try {
    if (!db) {
      const connectedClient = await clientPromise;
      db = connectedClient.db();
      console.log("✅ MongoDB Connected");
    }
    return db;
  } catch (error) {
    console.error("🚨 MongoDB Connection Error:", error);
    // Attempt reconnection after delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a new client if needed
    if (process.env.NODE_ENV !== "development" || !global._mongoClientPromise) {
      console.log("🔄 Attempting to reconnect to MongoDB...");
      client = new MongoClient(uri, options);
      if (process.env.NODE_ENV === "development") {
        global._mongoClientPromise = client.connect();
      }
      clientPromise = client.connect();
    }
    
    const newClient = await clientPromise;
    db = newClient.db();
    console.log("✅ MongoDB Reconnected");
    return db;
  }
}