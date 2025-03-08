
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/User';

export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the data from the request
    const data = await req.json();
    const { displayName, bio, photoURL } = data;

    // Connect to database
    await connectToDatabase();
    
    // Update user profile
    const userId = session.user.id;
    const updateData: any = {};
    
    if (displayName) updateData.displayName = displayName;
    if (bio) updateData.bio = bio;
    if (photoURL) updateData.photoURL = photoURL;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error in profile update API:', error);
    return NextResponse.json({ error: 'Profile update failed' }, { status: 500 });
  }
}
