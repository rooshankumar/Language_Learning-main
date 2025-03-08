
// This script helps set up the MongoDB environment and test connection

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testMongoConnection() {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in your environment variables");
    console.log("Please set it up with a valid MongoDB connection string");
    console.log("Example: MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>");
    process.exit(1);
  }

  console.log("Attempting to connect to MongoDB...");
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log("✅ Successfully connected to MongoDB!");
    
    const db = client.db();
    const collections = await db.listCollections().toArray();
    
    console.log("\nAvailable collections:");
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testMongoConnection().catch(console.error);
