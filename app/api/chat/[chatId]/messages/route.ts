
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Ensure params.chatId is defined
    const chatId = params.chatId;

    if (!chatId) {
      return new NextResponse(
        JSON.stringify({ error: "Chat ID is required" }),
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(chatId)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid chat ID format" }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // First check if the chat exists and user has access
    const chat = await db.collection("chats").findOne({
      _id: new ObjectId(chatId),
      participants: session.user.id
    });

    if (!chat) {
      return new NextResponse(
        JSON.stringify({ error: "Chat not found or access denied" }),
        { status: 404 }
      );
    }

    // Get messages from the messages collection
    const messages = await db.collection("messages")
      .find({ chatId: chatId })
      .sort({ createdAt: 1 })
      .toArray();

    // Format messages with sender details
    const formattedMessages = await Promise.all(messages.map(async (message) => {
      // Get sender details
      const sender = await db.collection("users").findOne(
        { _id: new ObjectId(message.senderId) },
        { projection: { _id: 1, name: 1, image: 1, profilePic: 1 } }
      );

      return {
        _id: message._id,
        chatId: message.chatId,
        content: message.content,
        sender: sender || {
          _id: message.senderId,
          name: 'Unknown User'
        },
        createdAt: message.createdAt
      };
    }));

    return new NextResponse(
      JSON.stringify(formattedMessages),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch messages" }),
      { status: 500 }
    );
  }
}
