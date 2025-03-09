
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Chat from '@/models/Chat';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const { partnerId } = await request.json();
    
    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Check if chat already exists between these users
    const existingChat = await Chat.findOne({
      participants: { 
        $all: [userId, partnerId],
        $size: 2
      }
    });
    
    if (existingChat) {
      console.log('Chat already exists:', existingChat);
      return NextResponse.json(existingChat);
    }
    
    // Create new chat
    const newChat = await Chat.create({
      participants: [userId, partnerId],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('New chat created:', newChat);
    return NextResponse.json(newChat);
    
  } catch (error: any) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create chat' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Connect to database
    await connectToDatabase();
    
    // Get all chats for current user
    const chats = await Chat.find({
      participants: userId
    }).sort({ updatedAt: -1 });
    
    return NextResponse.json(chats);
    
  } catch (error: any) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import clientPromise from '@/lib/mongodb';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { participantId } = body;

    if (!participantId) {
      return NextResponse.json({ error: "Participant ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if a chat already exists between these users
    let participantIds;
    try {
      participantIds = [
        new ObjectId(session.user.id),
        new ObjectId(participantId)
      ];
    } catch (error) {
      console.error('Error creating ObjectIds:', error);
      return NextResponse.json({ 
        error: 'Invalid user ID format', 
        success: false,
        details: (error as Error).message
      }, { status: 400 });
    }

    // Check for existing chat
    const existingChat = await db.collection('chats').findOne({
      participants: { 
        $all: [
          { $elemMatch: { $eq: participantIds[0] } },
          { $elemMatch: { $eq: participantIds[1] } }
        ],
        $size: 2
      }
    });

    if (existingChat) {
      return NextResponse.json({
        success: true,
        chatId: existingChat._id.toString(),
        _id: existingChat._id.toString(),
        participants: existingChat.participants.map((p: ObjectId) => p.toString()),
        createdAt: existingChat.createdAt,
        isExisting: true
      });
    }

    // Create a new chat
    const newChat = {
      participants: participantIds,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('chats').insertOne(newChat);

    return NextResponse.json({
      success: true,
      chatId: result.insertedId.toString(),
      _id: result.insertedId.toString(),
      participants: participantIds.map(id => id.toString()),
      createdAt: newChat.createdAt,
      updatedAt: newChat.updatedAt,
      isNew: true
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error in chat creation API:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error', 
      success: false
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Find all chats where the current user is a participant
    const userObjectId = new ObjectId(session.user.id);
    const chats = await db.collection("chats")
      .find({ 
        participants: { $elemMatch: { $eq: userObjectId } } 
      })
      .sort({ updatedAt: -1 })
      .toArray();
    
    // Ensure we're returning an array
    const formattedChats = chats.map(chat => ({
      ...chat,
      _id: chat._id.toString(),
      participants: chat.participants.map((p: ObjectId) => p.toString())
    }));
    
    return NextResponse.json(formattedChats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
