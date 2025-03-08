
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestData = await req.json();
    
    // Remove undefined or null values to prevent overwriting with nulls
    Object.keys(requestData).forEach(key => {
      if (requestData[key] === null || requestData[key] === undefined) {
        delete requestData[key];
      }
    });

    // Ensure if profile pic is updated, it syncs to all image fields
    if (requestData.profilePic) {
      requestData.image = requestData.profilePic;
      requestData.photoURL = requestData.profilePic;
    }

    // If displayName is provided, also update the name field
    if (requestData.displayName) {
      requestData.name = requestData.displayName;
    }

    // Update user in database with new data
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: requestData },
      { new: true } // Return the updated document
    );
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      user: updatedUser,
      message: 'Profile updated successfully' 
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile: ' + error.message },
      { status: 500 }
    );
  }
}
