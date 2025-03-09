
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
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const { participantId } = await req.json();

    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      );
    }

    // Check if participantId is valid
    if (!ObjectId.isValid(participantId)) {
      return NextResponse.json(
        { error: "Invalid participant ID" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if chat already exists between the two users
    const existingChat = await db.collection("chats").findOne({
      participants: { 
        $all: [currentUserId, participantId],
        $size: 2
      }
    });

    if (existingChat) {
      return NextResponse.json({ 
        chatId: existingChat._id,
        message: "Chat already exists" 
      });
    }

    // Create new chat
    const result = await db.collection("chats").insertOne({
      participants: [currentUserId, participantId],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      chatId: result.insertedId,
      message: "Chat created successfully" 
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
}
