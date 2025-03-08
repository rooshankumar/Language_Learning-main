
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function PUT(req: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the request body
    const body = await req.json();
    
    // Connect to the database
    await connectToDatabase();
    
    // Get user ID from session or request body
    const userId = session.user.id || session.user._id;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }
    
    // Update fields that were provided
    const updateData: any = {};
    if (body.displayName) updateData.name = body.displayName;
    if (body.bio !== undefined) updateData.bio = body.bio;
    
    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
        profilePic: updatedUser.profilePic || updatedUser.photoURL || updatedUser.image,
      }
    });
    
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Get user ID from session
    const userId = session.user.id || session.user._id;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Return user data
    return NextResponse.json({
      id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      profilePic: user.profilePic || user.photoURL || user.image,
      nativeLanguage: user.nativeLanguage,
      learningLanguage: user.learningLanguage,
      nativeLanguages: user.nativeLanguages,
      learningLanguages: user.learningLanguages,
      interests: user.interests,
      proficiency: user.proficiency,
      isOnboarded: user.isOnboarded,
    });
    
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
