
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const { userId } = await req.json();
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Check if chat already exists
    const existingChat = await db.collection("chats").findOne({
      participants: {
        $all: [new ObjectId(session.user.id), new ObjectId(userId)]
      }
    });

    if (existingChat) {
      return NextResponse.json({ chatId: existingChat._id });
    }

    // Create a new chat
    const result = await db.collection("chats").insertOne({
      participants: [new ObjectId(session.user.id), new ObjectId(userId)],
      createdAt: new Date(),
      messages: []
    });

    return NextResponse.json({ chatId: result.insertedId });
  } catch (error) {
    console.error("Error creating chat:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to create chat" }),
      { status: 500 }
    );
  }
}
