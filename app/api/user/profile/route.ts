import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userData = await request.json();
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