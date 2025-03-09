import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the session
    const userId = (session.user as any).id || (session.user as any)._id;

    // Connect to the database
    const client = await clientPromise;
    const db = client.db();

    // Find the user by ID
    const user = await db.collection('users').findOne({ _id: userId });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return the user profile
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the session
    const userId = (session.user as any).id || (session.user as any)._id;

    // Connect to the database
    const client = await clientPromise;
    const db = client.db();

    const userData = await request.json();
    console.log("Updating user with data:", userData);

    // Update the user in the database
    const result = await db.collection('users').updateOne(
      { _id: userId },
      { $set: userData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return the updated user
    const updatedUser = await db.collection('users').findOne({ _id: userId });
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}