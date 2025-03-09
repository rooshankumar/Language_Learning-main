
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const chatId = params.chatId;
    const currentUserId = session.user.id;

    console.log(`Fetching chat ${chatId} for user ${currentUserId}`);

    if (!chatId || !ObjectId.isValid(chatId)) {
      return NextResponse.json(
        { error: "Invalid chat ID" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Find the chat with ObjectId
    const chat = await db.collection("chats").findOne({
      _id: new ObjectId(chatId),
      participants: currentUserId
    });

    if (!chat) {
      console.error(`Chat ${chatId} not found for user ${currentUserId}`);
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      );
    }

    // Find the partner user details (the other participant)
    const partnerIds = chat.participants.filter(
      (id: string) => id !== currentUserId
    );

    const partnerDetails = partnerIds.length > 0 
      ? await db.collection("users").find(
          { _id: { $in: partnerIds.map((id: string) => 
            ObjectId.isValid(id) ? new ObjectId(id) : id) } },
          { projection: { name: 1, image: 1, online: 1, lastSeen: 1 } }
        ).toArray()
      : [];

    return NextResponse.json({
      ...chat,
      partnerDetails,
      currentUserId
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat" },
      { status: 500 }
    );
  }
}
