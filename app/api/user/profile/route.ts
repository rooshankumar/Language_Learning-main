
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error getting profile:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    
    const updates = {
      ...(data.name && { name: data.name }),
      ...(data.displayName && { displayName: data.displayName }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.age !== undefined && { age: data.age }),
      ...(data.nativeLanguage !== undefined && { nativeLanguage: data.nativeLanguage }),
      ...(data.learningLanguage !== undefined && { learningLanguage: data.learningLanguage }),
      ...(data.learningLanguages !== undefined && { learningLanguages: data.learningLanguages }),
      ...(data.interests !== undefined && { interests: data.interests }),
      ...(data.profilePicture !== undefined && { profilePicture: data.profilePicture }),
    };

    // Find user by email from the session
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
