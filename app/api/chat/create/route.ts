
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
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { userId } = await req.json();
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log("Creating chat between", session.user.id, "and", userId);

    const client = await clientPromise;
    const db = client.db();
    
    // Check if chat already exists
    let participantIds;
    try {
      participantIds = [new ObjectId(session.user.id), new ObjectId(userId)];
    } catch (error) {
      console.error("Error converting IDs to ObjectId:", error);
      return new NextResponse(
        JSON.stringify({ error: "Invalid user ID format" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const existingChat = await db.collection("chats").findOne({
      participants: {
        $all: participantIds
      }
    });

    if (existingChat) {
      console.log("Chat already exists:", existingChat._id);
      return NextResponse.json({ chatId: existingChat._id });
    }

    // Create a new chat
    const result = await db.collection("chats").insertOne({
      participants: participantIds,
      createdAt: new Date(),
      messages: []
    });

    console.log("New chat created with ID:", result.insertedId);
    return NextResponse.json({ chatId: result.insertedId });
  } catch (error) {
    console.error("Error creating chat:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to create chat" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
