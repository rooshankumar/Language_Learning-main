import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    // Validate authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatId = params.chatId;
    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();

    // Fetch the chat to get participants
    const chat = await db.collection("chats").findOne({
      _id: new ObjectId(chatId)
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Find the partner user (the participant who is not the current user)
    const partnerId = chat.participants.find(
      (id: string) => id !== session.user.id
    );

    if (!partnerId) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Fetch the partner's user information
    const partner = await db.collection("users").findOne(
      { _id: new ObjectId(partnerId) },
      { projection: { name: 1, email: 1, profilePic: 1 } }
    );

    if (!partner) {
      return NextResponse.json({ error: "Partner user not found" }, { status: 404 });
    }

    // Return the partner info
    return NextResponse.json({
      _id: partner._id.toString(),
      name: partner.name,
      email: partner.email,
      profilePic: partner.profilePic || null
    });
  } catch (error) {
    console.error("Error fetching chat partner:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat partner" },
      { status: 500 }
    );
  }
}