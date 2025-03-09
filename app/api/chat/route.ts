import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

// GET /api/chat - Get all chats for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { db } = await connectToDatabase();
    
    // Find all chats where the current user is a participant
    const chats = await db
      .collection("chats")
      .find({ participants: userId })
      .sort({ updatedAt: -1 })
      .toArray();
    
    return NextResponse.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

// POST /api/chat - Create a new chat
import { Request } from 'next/server';
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const currentUserId = session.user.id;
    const body = await req.json();
    const { participantId } = body;

    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      );
    }

    console.log(`Creating chat between ${currentUserId} and ${participantId}`);

    // Validate ObjectId format
    if (!ObjectId.isValid(participantId)) {
      return NextResponse.json(
        { error: "Invalid participant ID format" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if a chat already exists between these two users
    const existingChat = await db.collection("chats").findOne({
      participants: { 
        $all: [currentUserId, participantId],
        $size: 2
      }
    });

    if (existingChat) {
      console.log('Chat already exists:', existingChat._id);
      return NextResponse.json({ 
        chatId: existingChat._id.toString(),
        message: "Chat already exists" 
      });
    }

    // Create new chat
    const newChat = {
      participants: [currentUserId, participantId],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("chats").insertOne(newChat);

    if (!result.acknowledged) {
      console.error('Failed to insert chat into database');
      return NextResponse.json(
        { error: "Failed to create chat in database" },
        { status: 500 }
      );
    }

    const chatId = result.insertedId.toString();
    console.log('New chat created with ID:', chatId);

    return NextResponse.json({ 
      chatId: chatId,
      message: "Chat created successfully" 
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Server error when creating chat" },
      { status: 500 }
    );
  }
}