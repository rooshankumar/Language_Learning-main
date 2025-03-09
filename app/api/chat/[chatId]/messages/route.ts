
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

    // Get the messages and populate sender information
    const messages = chat.messages || [];
    
    // If there are messages, populate the sender information
    if (messages.length > 0) {
      const senderIds = [...new Set(messages.map((msg: any) => msg.sender))];
      const senderObjectIds = senderIds.map((id: string) => new ObjectId(id));
      
      const users = await db.collection("users").find(
        { _id: { $in: senderObjectIds } },
        { projection: { _id: 1, name: 1, image: 1, profilePic: 1 } }
      ).toArray();
      
      const usersMap = new Map();
      users.forEach((user: any) => {
        usersMap.set(user._id.toString(), {
          _id: user._id.toString(),
          name: user.name,
          image: user.profilePic || user.image
        });
      });
      
      // Replace sender IDs with sender objects
      const populatedMessages = messages.map((msg: any) => ({
        ...msg,
        sender: usersMap.get(msg.sender.toString()) || { _id: msg.sender, name: 'Unknown User' }
      }));
      
      return new NextResponse(
        JSON.stringify({ messages: populatedMessages }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new NextResponse(
      JSON.stringify({ messages: [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
