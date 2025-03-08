
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const userId = params.userId;

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ message: 'User ID is required' }),
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return new NextResponse(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.bio || '',
      age: user.age,
      nativeLanguage: user.nativeLanguage,
      learningLanguage: user.learningLanguage,
      nativeLanguages: user.nativeLanguages || [],
      learningLanguages: user.learningLanguages || [],
      proficiency: user.proficiency || 'beginner',
      interests: user.interests || [],
      lastSeen: user.lastSeen,
      online: user.online || false,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Error fetching user profile' }),
      { status: 500 }
    );
  }
}
