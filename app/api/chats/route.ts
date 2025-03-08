
import { NextResponse } from 'next/server';
import { getUserChats, getChatWithUser } from '@/lib/chat-service';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const otherUserId = url.searchParams.get('otherUserId');

    if (otherUserId && userId) {
      const result = await getChatWithUser(userId, otherUserId);
      return NextResponse.json(result);
    } else if (userId) {
      const result = await getUserChats(userId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: 'Missing user ID' }, { status: 400 });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Chat from "@/models/Chat";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    // Find all chats where the current user is a participant
    const userChats = await Chat.find({
      participants: session.user.id
    })
    .populate('participants', 'name image')
    .populate('lastMessage.sender', 'name')
    .sort({ updatedAt: -1 })
    .lean();

    return NextResponse.json(userChats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}
