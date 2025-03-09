import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Get messages for a specific chat
export async function GET(req: Request, { params }: { params: { chatId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = params;
    const { db } = await connectToDatabase();

    const chatObjectId = new ObjectId(chatId);

    const chat = await db.collection("chats").findOne({ _id: chatObjectId });
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Check if user is a participant
    if (!chat.participants.includes(session.user.id)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const messages = await db.collection("messages").find({ chatId: chatObjectId }).sort({ createdAt: 1 }).toArray();


    return NextResponse.json(messages || []);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Post a new message to a chat
export async function POST(req: Request, { params }: { params: { chatId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = params;
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const chatObjectId = new ObjectId(chatId);
    const userId = new ObjectId(session.user.id);

    const chat = await db.collection("chats").findOne({ _id: chatObjectId });
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Check if user is a participant
    if (!chat.participants.includes(session.user.id)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create message object
    const newMessage = {
      chatId: chatObjectId,
      content: content.trim(),
      sender: userId,
      createdAt: new Date(),
      readBy: [userId]
    };

    const result = await db.collection("messages").insertOne(newMessage);
    if (!result.acknowledged){
        return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }

    await db.collection("chats").updateOne(
      { _id: chatObjectId },
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}