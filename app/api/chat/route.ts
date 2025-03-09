import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Find all chats where the current user is a participant
    const userObjectId = new ObjectId(session.user.id);
    const chats = await db.collection("chats")
      .find({ participants: userObjectId })
      .sort({ updatedAt: -1 })
      .toArray();

    // Format the chats to convert ObjectIDs to strings for JSON
    const formattedChats = chats.map(chat => ({
      ...chat,
      _id: chat._id.toString(),
      participants: chat.participants.map((p: ObjectId) => p.toString()),
      createdBy: chat.createdBy?.toString() || null,
    }));

    return new NextResponse(
      JSON.stringify({ chats: formattedChats }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error fetching chats:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}