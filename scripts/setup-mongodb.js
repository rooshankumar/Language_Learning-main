
// This script helps set up the MongoDB environment and test connection

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testMongoConnection() {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in your environment variables");
    console.log("Please set it up with a valid MongoDB connection string");
    process.exit(1);
  }

  console.log("Attempting to connect to MongoDB...");
  const client = new MongoClient(process.env.MONGODB_URI, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000
  });
  
  try {
    await client.connect();
    console.log("✅ Successfully connected to MongoDB!");
    
    // Create test collections if they don't exist
    const db = client.db();
    if (!(await db.listCollections({name: 'users'}).hasNext())) {
      await db.createCollection('users');
      console.log("Created 'users' collection");
    }
    
    if (!(await db.listCollections({name: 'chats'}).hasNext())) {
      await db.createCollection('chats');
      console.log("Created 'chats' collection");
    }
    
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
