import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!params?.chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    try {
      const chatObjectId = new ObjectId(params.chatId);

      // Check if the user is a participant in this chat
      const chat = await db.collection("chats").findOne({
        _id: chatObjectId,
        participants: session.user.id
      });

      if (!chat) {
        return NextResponse.json(
          { error: "Chat not found or user not authorized to access it" },
          { status: 404 }
        );
      }

      // Fetch messages for this chat
      const messages = await db.collection("messages")
        .find({ chatId: params.chatId })
        .sort({ createdAt: 1 })
        .toArray();

      return NextResponse.json(messages);
    } catch (error) {
      console.error("Invalid ObjectId format:", error);
      return NextResponse.json({ error: "Invalid chat ID format" }, { status: 400 });
    }
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

interface RouteParams {
  params: {
    chatId: string;
  };
}

import { connectToDatabase } from '@/lib/mongodb';