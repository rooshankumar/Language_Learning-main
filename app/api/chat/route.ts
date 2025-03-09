
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view chats" },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();

    const chats = await db.collection("chats")
      .find({
        participants: session.user.id
      })
      .sort({ updatedAt: -1 })
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

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a chat" },
        { status: 401 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Partner user ID is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if chat already exists between these users
    const existingChat = await db.collection("chats").findOne({
      participants: {
        $all: [session.user.id, userId],
        $size: 2
      }
    });

    if (existingChat) {
      return NextResponse.json(existingChat);
    }

    // Create new chat
    const newChat = {
      participants: [session.user.id, userId],
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("chats").insertOne(newChat);
    
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
