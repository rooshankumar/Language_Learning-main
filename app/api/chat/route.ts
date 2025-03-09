
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a chat" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const participantId = body.participantId;
    
    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      );
    }

    console.log(`Creating chat between ${session.user.id} and ${participantId}`);

    const { db } = await connectToDatabase();
    
    // Convert IDs to ObjectId safely
    let currentUserId, otherUserId;
    try {
      currentUserId = new ObjectId(session.user.id);
      otherUserId = new ObjectId(participantId);
    } catch (error) {
      console.error("Error converting IDs to ObjectId:", error);
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Check if chat already exists between these users
    const existingChat = await db.collection("chats").findOne({
      participants: {
        $all: [
          { $elemMatch: { $eq: currentUserId } },
          { $elemMatch: { $eq: otherUserId } }
        ],
        $size: 2
      }
    });

    if (existingChat) {
      console.log("Found existing chat:", existingChat._id.toString());
      return NextResponse.json({ 
        chatId: existingChat._id.toString(),
        message: "Existing chat found" 
      });
    }

    // Create a new chat
    const newChat = {
      participants: [currentUserId, otherUserId],
      createdBy: currentUserId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("chats").insertOne(newChat);
    
    if (!result.acknowledged || !result.insertedId) {
      console.error("MongoDB failed to acknowledge chat creation or no ID returned");
      return NextResponse.json(
        { error: "Failed to create chat in database" },
        { status: 500 }
      );
    }

    const chatId = result.insertedId.toString();
    console.log("Created new chat with ID:", chatId);
    
    // Return consistent response format with chatId property
    return NextResponse.json({ 
      chatId: chatId,
      _id: chatId, // Include both formats for backward compatibility
      message: "Chat created successfully" 
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Server error when creating chat", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    
    let currentUserId;
    try {
      currentUserId = new ObjectId(session.user.id);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Find all chats involving current user
    const chats = await db.collection("chats")
      .find({ participants: currentUserId })
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Server error when fetching chats" },
      { status: 500 }
    );
  }
}
