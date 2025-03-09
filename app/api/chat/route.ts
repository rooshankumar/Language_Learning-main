import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
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

    const { db } = await clientPromise;

    const userId = session.user.id;
    const userObjectId = new ObjectId(userId);

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

    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return NextResponse.json(
        { error: "Target user ID is required" },
        { status: 400 }
      );
    }

    const { db } = await clientPromise;

    const userId = session.user.id;
    const userObjectId = new ObjectId(userId);
    const targetUserObjectId = new ObjectId(targetUserId);

    // Check if a chat already exists between these users
    const existingChat = await db.collection("chats").findOne({
      participants: {
        $all: [userObjectId, targetUserObjectId],
        $size: 2
      }
    });

    if (existingChat) {
      return NextResponse.json(existingChat);
    }

    // Create a new chat
    const newChat = {
      participants: [userObjectId, targetUserObjectId],
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("chats").insertOne(newChat);
    const chat = await db.collection("chats").findOne({ _id: result.insertedId });

    return NextResponse.json(chat);
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
}