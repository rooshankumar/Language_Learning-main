
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    
    let user;
    try {
      // Try to find user by MongoDB ObjectId
      user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0 } } // Exclude password
      );
    } catch (e) {
      // If ObjectId fails, try to find by string ID
      user = await db.collection('users').findOne(
        { _id: userId },
        { projection: { password: 0 } }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get online status from active users if available
    // This is simplified; you may need to modify based on your actual online tracking method
    const isOnline = Array.from(global.activeUsers?.keys() || []).includes(userId);
    
    return NextResponse.json({
      ...user,
      isOnline,
      status: isOnline ? "Online" : "Offline"
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ 
      error: "Server error when fetching user", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
