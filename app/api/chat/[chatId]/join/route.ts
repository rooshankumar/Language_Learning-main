
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  context: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    const { db } = await connectToDatabase();
    const chatId = context.params.chatId;
    
    // Check if chat exists
    const chat = await db.collection("chats").findOne({
      _id: new ObjectId(chatId)
    });
    
    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      );
    }
    
    // Add user to participants if not already there
    const userId = session.user.id;
    
    await db.collection("chats").updateOne(
      { _id: new ObjectId(chatId) },
      { 
        $addToSet: { participants: userId },
        $set: { updatedAt: new Date() }
      }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error joining chat:", error);
    return NextResponse.json(
      { error: "Failed to join chat" },
      { status: 500 }
    );
  }
}
