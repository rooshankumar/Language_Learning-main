
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in your environment variables");
    process.exit(1);
  }

  console.log(`Attempting to connect to MongoDB...`);
  const client = new MongoClient(process.env.MONGODB_URI, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 20000,
  });
  
  try {
    await client.connect();
    console.log("✅ Successfully connected to MongoDB!");
    
    const db = client.db();
    const collections = await db.listCollections().toArray();
    
    console.log("\nAvailable collections:");
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    // List one user to verify data access
    const users = await db.collection('users').find({}).limit(1).toArray();
    if (users.length > 0) {
      console.log("\nSample user found:");
      console.log(`Email: ${users[0].email}`);
      console.log(`Name: ${users[0].name}`);
    } else {
      console.log("\nNo users found in the database.");
    }
    
  } catch (err) {
    console.error("❌ Connection error:", err);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

testConnection();
// This script helps verify that the MongoDB connection is working correctly
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testMongoConnection() {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in your environment variables");
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
