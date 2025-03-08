
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function setupMongoDBAuth() {
  console.log('🔧 Setting up MongoDB authentication...');
  
  // Check for required environment variables
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in your environment variables');
    console.log('Please update your .env.local file with your MongoDB Atlas URI');
    process.exit(1);
  }
  
  const client = new MongoClient(process.env.MONGODB_URI, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });
  
  try {
    await client.connect();
    console.log("✅ Successfully connected to MongoDB Atlas!");
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Create test user if it doesn't exist
    const testUser = {
      email: 'test@example.com',
      name: 'Test User',
      password: await bcrypt.hash('password123', 10), // Never use this in production!
      image: '/placeholder-user.jpg',
      isOnboarded: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const existingUser = await usersCollection.findOne({ email: testUser.email });
    
    if (!existingUser) {
      await usersCollection.insertOne(testUser);
      console.log('✅ Created test user:', testUser.email);
    } else {
      console.log('ℹ️ Test user already exists:', existingUser.email);
    }
    
    // Set up NextAuth environment variables if they don't exist
    let envContent = '';
    
    try {
      envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
    } catch (err) {
      console.log('ℹ️ .env.local file not found. Creating new one.');
    }
    
    // Generate NextAuth secret if it doesn't exist
    if (!envContent.includes('NEXTAUTH_SECRET=')) {
      const secret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      envContent += `\nNEXTAUTH_SECRET="${secret}"\n`;
      console.log('✅ Generated new NEXTAUTH_SECRET');
    }
    
    // Set NextAuth URL if it doesn't exist
    if (!envContent.includes('NEXTAUTH_URL=')) {
      // Using Replit-specific environment variables to set the correct domain
      const replitDomain = process.env.REPL_SLUG && process.env.REPL_OWNER
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
        : 'http://localhost:3000';
        
      envContent += `NEXTAUTH_URL="${replitDomain}"\n`;
      console.log('✅ Set NEXTAUTH_URL to', replitDomain);
    }
    
    fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent);
    
    console.log('✅ Auth setup complete! You can now use:');
    console.log('   Email: test@example.com');
    console.log('   Password: password123');
    
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    console.error("Please check your MongoDB Atlas URI and network settings");
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

setupMongoDBAuth();
