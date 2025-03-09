
import { NextResponse } from "next/server";
import { connectToDatabase, verifyDbConnection } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify database connection first
    const isConnected = await verifyDbConnection();
    if (!isConnected) {
      console.error("Database connection failed");
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    await connectToDatabase();

    // Find the user by email
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user data
    return NextResponse.json({ user: user.toObject() });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Verify database connection first
    const isConnected = await verifyDbConnection();
    if (!isConnected) {
      console.error("Database connection failed");
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    await connectToDatabase();

    // Find and update the user
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: { ...data, updatedAt: new Date() } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Convert to plain object and return
    return NextResponse.json({ 
      user: updatedUser.toObject(),
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
