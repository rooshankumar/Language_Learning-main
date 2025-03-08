import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Chat from "@/models/Chat";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const otherUserId = url.searchParams.get('otherUserId');

    if (otherUserId && userId) {
      // Get specific chat between two users
      const chat = await Chat.findOne({
        participants: { $all: [userId, otherUserId] }
      })
      .populate('participants', 'displayName photoURL')
      .lean();

      return NextResponse.json(chat || null);
    } else {
      // Get all chats for current user
      const userId = session.user.id;
      const chats = await Chat.find({ 
        participants: userId 
      })
      .populate('participants', 'displayName photoURL')
      .populate('lastMessage.sender', 'displayName')
      .sort({ updatedAt: -1 })
      .lean();

      return NextResponse.json(chats);
    }
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}