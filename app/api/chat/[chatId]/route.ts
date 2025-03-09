
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
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
      return new NextResponse(
        JSON.stringify({ error: "Chat ID is required" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Convert chatId to ObjectId
    let chatObjectId;
    try {
      chatObjectId = new ObjectId(chatId);
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid chat ID format" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the chat and check if the user is a participant
    const chat = await db.collection("chats").findOne({
      _id: chatObjectId,
      participants: new ObjectId(session.user.id)
    });

    if (!chat) {
      return new NextResponse(
        JSON.stringify({ error: "Chat not found or user not authorized" }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Format the participants to be strings
    const formattedChat = {
      ...chat,
      participants: chat.participants.map((p: ObjectId) => p.toString())
    };

    return new NextResponse(
      JSON.stringify(formattedChat),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error fetching chat:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
