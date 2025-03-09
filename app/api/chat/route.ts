
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();

    const userId = session.user.id;
    let userObjectId;
    
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.error("Invalid ObjectId format:", error);
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Fetch all chats where the current user is a participant
    const chats = await db.collection("chats")
      .find({
        participants: userObjectId
      })
      .toArray();

    return NextResponse.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { targetUserId } = body;
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: "Target user ID is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    let userObjectId, targetUserObjectId;
    try {
      userObjectId = new ObjectId(session.user.id);
      targetUserObjectId = new ObjectId(targetUserId);
    } catch (error) {
      console.error("Invalid ObjectId format:", error);
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Check if chat already exists
    const existingChat = await db.collection("chats").findOne({
      participants: { $all: [userObjectId, targetUserObjectId] }
    });

    if (existingChat) {
      return NextResponse.json(existingChat);
    }

    // Create new chat
    const newChat = {
      participants: [userObjectId, targetUserObjectId],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("chats").insertOne(newChat);
    
    // Get the complete chat object with the ID
    const chat = await db.collection("chats").findOne({
      _id: result.insertedId
    });

    return NextResponse.json(chat);
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
}
