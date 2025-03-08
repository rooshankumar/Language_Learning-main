
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function testAuth() {
  console.log('Testing authentication setup...');
  
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in environment variables");
    return;
  }
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Get first user for testing
    const user = await usersCollection.findOne({});
    
    if (!user) {
      console.error("❌ No users found in database");
      return;
    }
    
    console.log(`Found user: ${user.email}`);
    console.log(`User has password: ${!!user.password}`);
    
    if (!user.password) {
      console.log("⚠️ User doesn't have a password set (might be using OAuth only)");
    }
    
    // Check NextAuth config
    console.log("\nNextAuth Configuration:");
    console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
    console.log(`NEXTAUTH_SECRET defined: ${!!process.env.NEXTAUTH_SECRET}`);
    
    console.log("\nAuthentication setup check complete.");
    
  } catch (error) {
    console.error("❌ Error testing authentication:", error);
  } finally {
    await client.close();
  }
}

testAuth();
