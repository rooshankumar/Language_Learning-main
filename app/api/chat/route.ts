import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized', success: false }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log request details
    console.log('POST /api/chat - Creating chat for user:', session.user.id);

    // Safely parse request body
    let body;
    try {
      body = await req.json();
      console.log('Request body:', body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Invalid request body format', 
          success: false,
          details: parseError.message 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { participantId } = body;

    if (!participantId) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Participant ID is required', 
          success: false 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Connect to MongoDB
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
      return new NextResponse(
        JSON.stringify({ 
          error: 'Invalid user ID format', 
          success: false,
          details: error.message
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking for existing chat between users:', participantIds.map(id => id.toString()));

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
      console.log('Found existing chat:', existingChat._id);
      const response = {
        success: true,
        chatId: existingChat._id.toString(),
        _id: existingChat._id.toString(),
        participants: existingChat.participants.map((p: ObjectId) => p.toString()),
        createdAt: existingChat.createdAt,
        isExisting: true
      };

      console.log('Returning existing chat response:', response);

      return new NextResponse(
        JSON.stringify(response),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a new chat
    const newChat = {
      participants: participantIds,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Creating new chat with data:', {
      ...newChat,
      participants: newChat.participants.map(p => p.toString())
    });

    const result = await db.collection('chats').insertOne(newChat);

    if (!result.acknowledged) {
      console.error('Failed to insert new chat into database');
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to create chat in database', 
          success: false 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Created new chat with ID:', result.insertedId.toString());

    const response = {
      success: true,
      chatId: result.insertedId.toString(),
      _id: result.insertedId.toString(),
      participants: participantIds.map(id => id.toString()),
      createdAt: newChat.createdAt,
      updatedAt: newChat.updatedAt,
      isNew: true
    };

    console.log('Returning new chat response:', response);

    return new NextResponse(
      JSON.stringify(response),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in chat creation API:', error);

    // Ensure we always return a valid JSON response
    return new NextResponse(
      JSON.stringify({ 
        error: error.message || 'Internal server error', 
        success: false,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}