
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: Request, { params }: { params: { chatId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { chatId } = params;
    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    let chatObjectId;
    try {
      chatObjectId = new ObjectId(chatId);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid chat ID format" },
        { status: 400 }
      );
    }

    // Verify the chat exists and the user is a participant
    const chat = await db.collection("chats").findOne({
      _id: chatObjectId,
      participants: new ObjectId(session.user.id)
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found or user is not a participant" },
        { status: 404 }
      );
    }

    // Return success response with chat data
    return NextResponse.json({
      success: true,
      message: "Successfully joined chat",
      chat
    });
  } catch (error) {
    console.error("Error joining chat:", error);
    return NextResponse.json(
      { error: "Failed to join chat" },
      { status: 500 }
    );
  }
}
