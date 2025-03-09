import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const chatId = params.chatId;
    
    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    if (!chatId) {
      return new NextResponse(
        JSON.stringify({ error: "Chat ID is required" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Find chat by ID and verify user is a participant
    const chat = await db.collection("chats").findOne({
      _id: new ObjectId(chatId),
      participants: session.user.id
    });

    if (!chat) {
      return new NextResponse(
        JSON.stringify({ error: "Chat not found or user not authorized" }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get messages for this chat
    const messages = await db.collection("messages")
      .find({ chatId: new ObjectId(chatId) })
      .sort({ createdAt: 1 })
      .toArray();

    // Populate sender information for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await db.collection("users").findOne(
          { _id: new ObjectId(message.senderId) },
          { projection: { name: 1, image: 1, profilePic: 1 } }
        );

        return {
          ...message,
          sender: {
            _id: message.senderId,
            ...sender
          }
        };
      })
    );

    return new NextResponse(
      JSON.stringify({ messages: messagesWithSenders }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error fetching messages:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}