
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

// GET user profile
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const userEmail = session.user.email;

    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id,
      name: user.name,
      displayName: user.displayName || user.name,
      email: user.email,
      image: user.image,
      profilePic: user.profilePic,
      photoURL: user.photoURL,
      bio: user.bio,
      age: user.age,
      nativeLanguage: user.nativeLanguage,
      learningLanguage: user.learningLanguage,
      nativeLanguages: user.nativeLanguages,
      learningLanguages: user.learningLanguages,
      proficiency: user.proficiency,
      interests: user.interests,
      isOnboarded: user.isOnboarded,
    });
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ 
      error: `Error fetching profile: ${error.message}` 
    }, { status: 500 });
  }
}

// Update user profile
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
        displayName: updatedUser.displayName || updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
        image: updatedUser.image,
        profilePic: updatedUser.profilePic,
        photoURL: updatedUser.photoURL,
        age: updatedUser.age,
        nativeLanguage: updatedUser.nativeLanguage,
        learningLanguage: updatedUser.learningLanguage,
        nativeLanguages: updatedUser.nativeLanguages,
        learningLanguages: updatedUser.learningLanguages,
        proficiency: updatedUser.proficiency,
        interests: updatedUser.interests,
        isOnboarded: updatedUser.isOnboarded,
      } 
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ 
      error: `Error updating profile: ${error.message}` 
    }, { status: 500 });
  }
}

// Patch method for updating profile
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const data = await req.json();
    const userEmail = session.user.email;

    // Update user document
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
      id: updatedUser._id,
      name: updatedUser.name,
      displayName: updatedUser.displayName || updatedUser.name,
      email: updatedUser.email,
      bio: updatedUser.bio,
      image: updatedUser.image,
      profilePic: updatedUser.profilePic,
      photoURL: updatedUser.photoURL,
      age: updatedUser.age,
      nativeLanguage: updatedUser.nativeLanguage,
      learningLanguage: updatedUser.learningLanguage,
      nativeLanguages: updatedUser.nativeLanguages,
      learningLanguages: updatedUser.learningLanguages,
      proficiency: updatedUser.proficiency,
      interests: updatedUser.interests,
      isOnboarded: updatedUser.isOnboarded,
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ 
      error: `Error updating profile: ${error.message}` 
    }, { status: 500 });
  }
}
