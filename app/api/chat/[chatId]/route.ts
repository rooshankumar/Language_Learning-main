
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

interface RouteParams {
  params: {
    chatId: string;
  };
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const chatId = params.chatId;
    if (!chatId || typeof chatId !== 'string') {
      return NextResponse.json(
        { error: "Invalid chat ID" },
        { status: 400 }
      );
    }

    console.log("Fetching chat with ID:", chatId);

    const { db } = await connectToDatabase();
    
    let objectChatId, userId;
    try {
      objectChatId = new ObjectId(chatId);
      userId = new ObjectId(session.user.id);
    } catch (error) {
      console.error("Error converting IDs to ObjectId:", error);
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    // Get chat and verify user is a participant
    const chat = await db.collection("chats").findOne({
      _id: objectChatId,
      participants: userId
    });

    if (!chat) {
      console.log(`Chat not found or user ${session.user.id} is not a participant`);
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      );
    }

    // Get participants details
    const participantIds = chat.participants.map((id: ObjectId) => id);
    const participants = await db.collection("users")
      .find({ _id: { $in: participantIds } })
      .project({ password: 0 }) // Exclude password
      .toArray();

    // Replace ObjectId participants with actual user data
    const chatWithParticipants = {
      ...chat,
      participants: participants
    };

    return NextResponse.json(chatWithParticipants);
  } catch (error) {
    console.error("Error fetching chat:", error);
    return NextResponse.json(
      { error: "Server error when fetching chat", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const chatId = params.chatId;
    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    let objectChatId, userId;
    try {
      objectChatId = new ObjectId(chatId);
      userId = new ObjectId(session.user.id);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    // Verify user is a participant before deletion
    const chat = await db.collection("chats").findOne({
      _id: objectChatId,
      participants: userId
    });

    if (!chat) {
      console.error(`Chat ${chatId} not found or user ${userId} is not a participant`);
      return NextResponse.json(
        { error: "Chat not found or you're not a participant" },
        { status: 404 }
      );
    }
    
    // Ensure the chat has an ID in the expected format
    const formattedChat = {
      ...chat,
      _id: chat._id.toString(),
      chatId: chat._id.toString()
    };

    // Delete the chat
    const result = await db.collection("chats").deleteOne({ _id: objectChatId });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Failed to delete chat" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return NextResponse.json(
      { error: "Server error when deleting chat" },
      { status: 500 }
    );
  }
}
