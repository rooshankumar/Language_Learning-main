
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

// GET /api/chat/[chatId] - Get a specific chat by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatId = params.chatId;
    
    if (!chatId || !ObjectId.isValid(chatId)) {
      return NextResponse.json(
        { error: "Invalid chat ID" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Find the chat
    const chat = await db.collection("chats").findOne({
      _id: new ObjectId(chatId),
      participants: session.user.id
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      );
    }

    // Find the other participant's details
    const otherParticipantId = chat.participants.find(
      (p: string) => p !== session.user.id
    );

    let chatPartner = null;
    if (otherParticipantId) {
      chatPartner = await db.collection("users").findOne(
        { _id: new ObjectId(otherParticipantId) },
        { 
          projection: { 
            name: 1, 
            email: 1, 
            image: 1, 
            profilePic: 1, 
            online: 1, 
            lastSeen: 1 
          } 
        }
      );
    }

    return NextResponse.json({
      ...chat,
      chatPartner
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat" },
      { status: 500 }
    );
  }
}
