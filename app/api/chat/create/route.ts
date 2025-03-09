
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

    const body = await req.json();
    const recipientId = body.recipientId;
    
    if (!recipientId) {
      return new NextResponse(
        JSON.stringify({ error: "Recipient ID is required" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log("Creating chat between", session.user.id, "and", recipientId);

    const client = await clientPromise;
    const db = client.db();
    
    // Check if chat already exists
    let participantIds;
    try {
      participantIds = [new ObjectId(session.user.id), new ObjectId(recipientId)];
    } catch (error) {
      console.error("Error converting IDs to ObjectId:", error);
      return new NextResponse(
        JSON.stringify({ error: "Invalid user ID format" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const existingChat = await db.collection("chats").findOne({
      participants: {
        $all: [
          { $elemMatch: { $eq: participantIds[0] } },
          { $elemMatch: { $eq: participantIds[1] } }
        ],
        $size: 2
      }
    });

    if (existingChat) {
      // Chat already exists, return it
      return new NextResponse(
        JSON.stringify(existingChat),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a new chat
    const newChat = {
      participants: participantIds,
      messages: [],
      createdBy: new ObjectId(session.user.id),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("chats").insertOne(newChat);
    
    if (!result.acknowledged) {
      return new NextResponse(
        JSON.stringify({ error: "Failed to create chat" }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return the new chat with its ID
    return new NextResponse(
      JSON.stringify({ 
        _id: result.insertedId, 
        ...newChat 
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error creating chat:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
