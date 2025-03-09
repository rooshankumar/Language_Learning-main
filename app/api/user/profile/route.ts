
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

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

    // Find the user by ID or email
    let query = {}; 
    if (userId) {
      // Try to convert to ObjectId if it's a string
      try {
        query = { _id: new ObjectId(userId.toString()) };
      } catch (e) {
        // If it's not a valid ObjectId, use it as-is
        query = { _id: userId };
      }
    } else if (session.user.email) {
      query = { email: session.user.email };
    } else {
      return NextResponse.json({ error: 'No user identifier found' }, { status: 400 });
    }

    const user = await db.collection('users').findOne(query);

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
    const userEmail = session.user.email;

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'No user identifier found' }, { status: 400 });
    }

    // Connect to the database
    const client = await clientPromise;
    const db = client.db();

    // Parse the request data
    const userData = await request.json();
    console.log("Updating user with data:", userData);

    // Prepare query - try to find the user by ID first, then by email
    let query = {};
    if (userId) {
      try {
        query = { _id: new ObjectId(userId.toString()) };
      } catch (e) {
        query = { _id: userId };
      }
    } else {
      query = { email: userEmail };
    }

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

    // Perform the update
    const result = await db.collection('users').updateOne(
      query,
      { $set: userData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return the updated user
    const updatedUser = await db.collection('users').findOne(query);
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: 'Internal server error', message: (error as Error).message }, { status: 500 });
  }
}
