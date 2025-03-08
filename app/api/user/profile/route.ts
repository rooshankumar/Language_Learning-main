import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/mongoose';

// GET /api/user/profile - Get current user profile
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error getting profile:', error);
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

// PATCH /api/user/profile - Update user profile
//This route is removed from the edited code.  Leaving it out for now.

// PUT /api/user/profile - Legacy API for compatibility
export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const data = await req.json();
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: data },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}