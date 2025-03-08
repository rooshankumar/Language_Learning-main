import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/mongoose';

// Get user profile
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
  } catch (error: any) {
    console.error('Error getting profile:', error);
    return NextResponse.json(
      { error: 'Failed to get profile: ' + error.message },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userData = await req.json();
    console.log("Updating user with data:", userData);

    // Ensure profile image fields are synchronized
    if (userData.profilePic) {
      userData.image = userData.profilePic;
      userData.photoURL = userData.profilePic;
    } else if (userData.image) {
      userData.profilePic = userData.image;
      userData.photoURL = userData.image;
    } else if (userData.photoURL) {
      userData.profilePic = userData.photoURL;
      userData.image = userData.photoURL;
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: userData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    console.log("User updated successfully:", updatedUser);

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}