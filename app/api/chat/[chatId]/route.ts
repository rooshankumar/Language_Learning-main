import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

interface RouteParams {
  params: {
    chatId: string;
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  // params is not a Promise, so we don't need to await it
  const chatId = params.chatId;

  if (!chatId || typeof chatId !== 'string') {
    console.error("Invalid or missing chatId:", chatId);
    return NextResponse.json({ error: "Invalid chatId" }, { status: 400 });
  }

  console.log("Fetching messages for chat:", chatId);
  try {
    const { db } = await connectToDatabase();
    const messages = await db.collection("messages").find({ chatId }).toArray();
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const chatId = params.chatId;

  if (!chatId || typeof chatId !== 'string') {
    return NextResponse.json({ error: "Invalid chatId" }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const data = await req.json();

    // Add message to database
    const result = await db.collection("messages").insertOne({
      chatId,
      ...data,
      timestamp: new Date()
    });

    return NextResponse.json({ success: true, messageId: result.insertedId });
  } catch (error) {
    console.error("Error posting message:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
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