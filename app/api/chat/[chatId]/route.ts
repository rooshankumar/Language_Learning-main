import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    if (!params || !params.chatId) {
      console.error("❌ Missing chatId:", params);
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    const chatId = params.chatId;
    if (typeof chatId !== "string") {
      console.error("❌ Invalid chatId type:", typeof chatId);
      return NextResponse.json({ error: "Invalid Chat ID" }, { status: 400 });
    }

    console.log("📩 Fetching messages for chat:", chatId);
    const { db } = await connectToDatabase();
    const messages = await db.collection("messages").find({ chatId }).toArray();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("❌ Error fetching messages:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const data = await req.json();

    if (!data.content || typeof data.content !== "string") {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const result = await db.collection("messages").insertOne({
      chatId,
      content: data.content,
      sender: {
        _id: session.user.id,
        name: session.user.name,
        image: session.user.image
      },
      timestamp: new Date()
    });

    return NextResponse.json({ success: true, messageId: result.insertedId });
  } catch (error) {
    console.error("Error posting message:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
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

    // Verify user is part of this chat
    const chat = await db.collection("chats").findOne({
      _id: objectChatId,
      participants: userId
    });

    if (!chat) {
      console.error(`Chat ${chatId} not found or user ${userId} is not a participant`);
      return NextResponse.json(
        { error: "Chat not found or you're not a participant" },
        { status: 404 }
      );
    }

    // Ensure the chat has an ID in the expected format
    const formattedChat = {
      ...chat,
      _id: chat._id.toString(),
      chatId: chat._id.toString()
    };

    // Delete the chat
    const result = await db.collection("chats").deleteOne({ _id: objectChatId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Failed to delete chat" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return NextResponse.json(
      { error: "Server error when deleting chat" },
      { status: 500 }
    );
  }
}