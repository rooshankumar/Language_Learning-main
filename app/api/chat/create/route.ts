
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { otherUserId } = await req.json();
    
    if (!otherUserId) {
      return NextResponse.json({ error: "Missing otherUserId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Get current user ID
    const currentUserEmail = session.user.email;
    const currentUser = await db.collection("users").findOne({ email: currentUserEmail });
    
    if (!currentUser) {
      return NextResponse.json({ error: "Current user not found" }, { status: 404 });
    }

    const currentUserId = currentUser._id;
    const otherUserObjectId = new ObjectId(otherUserId);
    
    // Check if chat already exists
    const existingChat = await db.collection("chats").findOne({
      participants: { 
        $all: [currentUserId, otherUserObjectId],
        $size: 2
      }
    });

    if (existingChat) {
      return NextResponse.json({ chatId: existingChat._id });
    }

    // Create new chat
    const newChat = {
      participants: [currentUserId, otherUserObjectId],
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("chats").insertOne(newChat);
    
    return NextResponse.json({ chatId: result.insertedId });
    
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
  }
}
