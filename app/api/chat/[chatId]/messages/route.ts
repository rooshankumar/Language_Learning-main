import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const chatId = params.chatId;

    if (!chatId) {
      return new NextResponse(
        JSON.stringify({ error: "Chat ID is required" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Verify user is part of this chat
    let objectId;
    try {
      objectId = new ObjectId(chatId);
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid chat ID format" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const chat = await db.collection('chats').findOne({
      _id: objectId,
      participants: session.user.id
    });

    if (!chat) {
      return new NextResponse(
        JSON.stringify({ error: "Chat not found or access denied" }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get messages for this chat
    const messages = await db.collection('messages')
      .find({ chatId: chatId })
      .sort({ createdAt: 1 })
      .toArray();

    return new NextResponse(
      JSON.stringify(messages),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Error fetching chat messages:", error);
    return new NextResponse(
      JSON.stringify({ error: error.message || "Failed to fetch messages" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}