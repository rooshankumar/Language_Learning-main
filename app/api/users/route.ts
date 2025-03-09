
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    console.log("📌 Fetching all users...");
    const { db } = await connectToDatabase();
    
    if (!db) {
      throw new Error("Database connection failed");
    }
    
    const users = await db.collection("users")
      .find({}, { 
        projection: { 
          name: 1, 
          email: 1, 
          image: 1, 
          profilePic: 1,
          online: 1,
          lastSeen: 1,
          nativeLanguage: 1,
          learningLanguages: 1
        } 
      })
      .toArray();
    
    console.log(`✅ Retrieved ${users.length} users`);
    
    return NextResponse.json(users);
  } catch (error: any) {
    console.error("🚨 Error fetching users:", error.message, error.stack);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
