import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return new NextResponse(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.bio,
      age: user.age,
      nativeLanguage: user.nativeLanguage,
      learningLanguage: user.learningLanguage,
      interests: user.interests,
      isOnboarded: user.isOnboarded,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Error fetching user profile' }),
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const body = await request.json();

    await connectToDatabase();

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { 
        $set: { 
          ...body,
          isOnboarded: true 
        } 
      },
      { new: true }
    );

    if (!updatedUser) {
      return new NextResponse(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    // Update session to immediately reflect changes
    await fetch('/api/auth/session', { 
      method: 'GET', 
      cache: 'no-store'
    });

    return NextResponse.json({
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      bio: updatedUser.bio,
      age: updatedUser.age,
      nativeLanguage: updatedUser.nativeLanguage,
      learningLanguage: updatedUser.learningLanguage,
      interests: updatedUser.interests,
      isOnboarded: updatedUser.isOnboarded,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Error updating user profile' }),
      { status: 500 }
    );
  }
}