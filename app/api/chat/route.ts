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

export async function POST(request: Request) {
  try {
    const { userId, partnerId } = await request.json();

    if (!userId || !partnerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if chat already exists between these users
    const existingChat = await db.collection("chats").findOne({
      participants: {
        $all: [userId, partnerId]
      }
    });

    if (existingChat) {
      return NextResponse.json(
        { chatId: existingChat._id },
        { status: 200 }
      );
    }

    // Create a new chat
    const result = await db.collection("chats").insertOne({
      participants: [userId, partnerId],
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json(
      { chatId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create chat:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
}