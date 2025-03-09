
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
      console.error("Invalid or missing chatId:", chatId);
      return NextResponse.json(
        { error: "Invalid chat ID" },
        { status: 400 }
      );
    }

    console.log("Fetching messages for chat:", chatId);

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

    // Verify user is part of this chat
    const chat = await db.collection("chats").findOne({
      _id: objectChatId,
      participants: userId
    });

    if (!chat) {
      console.log(`Chat not found or user ${session.user.id} is not a participant`);
      return NextResponse.json(
        { error: "Chat not found or you're not a participant" },
        { status: 404 }
      );
    }

    // Get messages collection
    const messages = await db.collection("messages")
      .find({ chatId: objectChatId })
      .sort({ createdAt: 1 })
      .toArray();

    // Get sender info for each message
    const messageWithSenders = await Promise.all(messages.map(async (message) => {
      const sender = await db.collection("users").findOne(
        { _id: message.sender },
        { projection: { _id: 1, name: 1, image: 1, profilePic: 1 } }
      );
      
      return {
        ...message,
        sender: sender || { _id: message.sender, name: "Unknown User" }
      };
    }));

    return NextResponse.json(messageWithSenders);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Server error when fetching messages", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: RouteParams) {
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

    const body = await req.json();
    const { content } = body;
    
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: "Message content is required" },
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

    // Verify user is part of this chat
    const chat = await db.collection("chats").findOne({
      _id: objectChatId,
      participants: userId
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found or you're not a participant" },
        { status: 404 }
      );
    }

    // Create and save the message
    const newMessage = {
      chatId: objectChatId,
      content: content.trim(),
      sender: userId,
      createdAt: new Date(),
      readBy: [userId] // Mark as read by sender
    };

    const result = await db.collection("messages").insertOne(newMessage);
    
    if (!result.acknowledged) {
      return NextResponse.json(
        { error: "Failed to save message" },
        { status: 500 }
      );
    }

    // Update the chat's last message and updatedAt
    await db.collection("chats").updateOne(
      { _id: objectChatId },
      { 
        $set: { 
          lastMessage: {
            _id: result.insertedId,
            content: content.trim(),
            sender: userId,
            createdAt: new Date()
          },
          updatedAt: new Date() 
        } 
      }
    );

    // Get sender info
    const sender = await db.collection("users").findOne(
      { _id: userId },
      { projection: { _id: 1, name: 1, image: 1, profilePic: 1 } }
    );

    const messageWithSender = {
      _id: result.insertedId,
      ...newMessage,
      sender: sender || { _id: userId, name: "Unknown User" }
    };

    return NextResponse.json(messageWithSender);
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Server error when sending message" },
      { status: 500 }
    );
  }
}
