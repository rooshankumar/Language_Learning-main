
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function testAuth() {
  console.log('Testing authentication setup...');
  
  // Check for required environment variables
  const requiredEnvVars = ['MONGODB_URI', 'NEXTAUTH_URL', 'NEXTAUTH_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    return;
  }
  
  console.log('✅ All required environment variables are set');
  
  // Test database connection
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Test user collection
    const totalUsers = await usersCollection.countDocuments();
    console.log(`Found ${totalUsers} users in the database`);
    
    // Get first user for testing
    const user = await usersCollection.findOne({});
    
    if (!user) {
      console.log("ℹ️ No users found in database. Creating a test user...");
      
      // Create a test user
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        image: null,
        emailVerified: null,
        isOnboarded: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await usersCollection.insertOne(testUser);
      console.log(`✅ Created test user with id: ${result.insertedId}`);
    } else {
      console.log(`✅ Found user: ${user.email}`);
      console.log(`User has password: ${!!user.password}`);
      
      if (!user.password) {
        console.log("⚠️ User doesn't have a password set (might be using OAuth only)");
      }
    }
    
    // Check NextAuth config
    console.log("\nNextAuth Configuration:");
    console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
    console.log(`NEXTAUTH_SECRET defined: ${!!process.env.NEXTAUTH_SECRET}`);
    
    // Check OAuth providers
    console.log("\nOAuth Providers:");
    const oauthProviders = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GITHUB_ID', 'GITHUB_SECRET'];
    oauthProviders.forEach(provider => {
      console.log(`${provider} defined: ${!!process.env[provider]}`);
    });
    
    console.log("\nAuthentication setup check complete.");
    
  } catch (error) {
    console.error("❌ Error testing authentication:", error);
  } finally {
    await client.close();
  }
}

testAuth();
