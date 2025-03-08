
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get query parameters
    const url = new URL(request.url);
    const nativeLanguage = url.searchParams.get('nativeLanguage');
    const learningLanguage = url.searchParams.get('learningLanguage');
    const interests = url.searchParams.get('interests')?.split(',');
    const proficiency = url.searchParams.get('proficiency');
    
    // Build query
    let query: any = { 
      email: { $ne: session.user.email },  // Exclude current user
      isOnboarded: true  // Only include onboarded users
    };
    
    if (nativeLanguage) {
      query.$or = [
        { nativeLanguage },
        { nativeLanguages: nativeLanguage }
      ];
    }
    
    if (learningLanguage) {
      query.$or = query.$or || [];
      query.$or.push(
        { learningLanguage },
        { learningLanguages: learningLanguage }
      );
    }
    
    if (proficiency) {
      query.proficiency = proficiency;
    }
    
    if (interests && interests.length > 0) {
      query.interests = { $in: interests };
    }

    // Get users
    const users = await User.find(query)
      .select("_id name email image bio nativeLanguage learningLanguage nativeLanguages learningLanguages proficiency interests lastSeen online")
      .limit(50)
      .lean();

    return NextResponse.json({
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        bio: user.bio || '',
        nativeLanguage: user.nativeLanguage,
        learningLanguage: user.learningLanguage,
        nativeLanguages: user.nativeLanguages || [],
        learningLanguages: user.learningLanguages || [],
        proficiency: user.proficiency || 'beginner',
        interests: user.interests || [],
        lastSeen: user.lastSeen,
        online: user.online || false,
      }))
    });
  } catch (error) {
    console.error('Error fetching community users:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Error fetching community users' }),
      { status: 500 }
    );
  }
}
