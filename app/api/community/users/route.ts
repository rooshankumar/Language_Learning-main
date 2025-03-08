
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { db } = await connectToDatabase();
    
    // Get all users except the current user
    const users = await db.collection('users')
      .find({ email: { $ne: session.user.email } })
      .project({
        name: 1,
        email: 1,
        image: 1,
        bio: 1,
        nativeLanguage: 1,
        learningLanguage: 1,
        lastSeen: 1,
        online: 1
      })
      .toArray();
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
