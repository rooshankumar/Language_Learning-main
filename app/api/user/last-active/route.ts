
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from session
    const userId = session.user.id || session.user._id;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 400 });
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Update the user's lastActive field
    await User.findByIdAndUpdate(userId, {
      lastActive: new Date(),
      lastSeen: new Date()
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating last active status:', error);
    return NextResponse.json({ error: 'Failed to update last active status' }, { status: 500 });
  }
}
