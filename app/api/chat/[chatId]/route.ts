
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
    
    let objectId;
    try {
      objectId = new ObjectId(chatId);
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid chat ID format" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Find chat and populate participant details
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
    
    // Get chat partner details
    const partnerIds = chat.participants.filter(id => id !== session.user.id);
    const partners = await db.collection('users')
      .find({ _id: { $in: partnerIds.map(id => new ObjectId(id)) } })
      .toArray();
    
    const result = {
      ...chat,
      partnerDetails: partners.map(partner => ({
        _id: partner._id.toString(),
        name: partner.name,
        image: partner.image || partner.profilePic,
        online: partner.online || false,
        lastSeen: partner.lastSeen || null
      }))
    };
    
    return new NextResponse(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error("Error fetching chat:", error);
    return new NextResponse(
      JSON.stringify({ error: error.message || "Failed to fetch chat" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
