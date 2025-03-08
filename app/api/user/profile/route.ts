import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const data = await req.json();
    const userEmail = session.user.email;

    // Update user profile - use updateOne instead of findOneAndUpdate
    // This avoids the isModified middleware issues
    const result = await User.updateOne(
      { email: userEmail },
      { $set: { ...data } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch the updated user
    const updatedUser = await User.findOne({ email: userEmail });

    return NextResponse.json({ 
      success: true, 
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
        image: updatedUser.image,
        profilePic: updatedUser.profilePic
      } 
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ 
      error: `Error updating profile: ${error.message}` 
    }, { status: 500 });
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