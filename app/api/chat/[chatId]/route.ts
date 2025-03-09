
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface RouteParams {
  params: {
    chatId: string;
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  // Validate chatId parameter
  if (!params?.chatId) {
    console.error("❌ Missing chatId:", params);
    return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
  }

  const chatId = params.chatId; // No need to await params, it's not a Promise

  if (typeof chatId !== 'string') {
    console.error("❌ Invalid chatId type:", typeof chatId);
    return NextResponse.json({ error: "Invalid chatId format" }, { status: 400 });
  }

  console.log("📩 Fetching messages for chat:", chatId);
  
  try {
    const { db } = await connectToDatabase();
    
    // Optimize query with proper indexing and limit
    const messages = await db.collection("messages")
      .find({ chatId })
      .sort({ timestamp: -1 })
      .limit(100)  // Limit to most recent messages for performance
      .toArray();
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  // Validate chatId parameter
  if (!params?.chatId) {
    return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
  }

  const chatId = params.chatId;
  
  if (typeof chatId !== 'string') {
    return NextResponse.json({ error: "Invalid chatId format" }, { status: 400 });
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

    // Validate chatId parameter
    if (!params?.chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    const chatId = params.chatId;
    
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
