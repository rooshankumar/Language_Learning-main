import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";

// GET /api/user/profile
export async function GET() {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Find the user by email
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return the user profile in consistent format
    return NextResponse.json({ user: user.toObject() });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/user/profile
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    await connectToDatabase();

    // Find and update the user
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: data },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return updated user data in a consistent format
    return NextResponse.json({ 
      user: updatedUser.toObject(),
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}