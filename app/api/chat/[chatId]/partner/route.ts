import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Chat from "@/models/Chat";
import User from "@/models/User";

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = params;

    await connectDB();

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Check if user is a participant
    if (!chat.participants.includes(session.user.id)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Find the partner (the other participant)
    const partnerId = chat.participants.find(id => id.toString() !== session.user.id);

    if (!partnerId) {
      return NextResponse.json({ error: "Chat partner not found" }, { status: 404 });
    }

    const partner = await User.findById(partnerId).select("displayName image status lastActive"); //Added lastActive

    if (!partner) {
      return NextResponse.json({ error: "Chat partner not found" }, { status: 404 });
    }

    return NextResponse.json(partner);
  } catch (error) {
    console.error("Error fetching chat partner:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: Request, { params }: { params: { chatId: string } }) {
  try {
    console.log("Fetching chat partner for chatId:", params.chatId);
    
    // Connect to database
    const db = await connectToDB();
    
    // Get userId from request URL
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    
    if (!userId) {
      console.error("No userId provided in request");
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Find the chat
    const chat = await db.collection("chats").findOne({ 
      _id: new ObjectId(params.chatId)
    });

    if (!chat) {
      console.error(`Chat not found for chatId: ${params.chatId}`);
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Find the other participant (the partner)
    const otherParticipantId = chat.participants.find(
      (p: string) => p.toString() !== userId
    );
    
    if (!otherParticipantId) {
      console.error(`No partner found in chat: ${params.chatId}`);
      return NextResponse.json({ error: "Chat partner not found" }, { status: 404 });
    }

    // Get the partner's user details
    const partner = await db.collection("users").findOne({ 
      _id: new ObjectId(otherParticipantId)
    });

    if (!partner) {
      console.error(`Partner user not found with ID: ${otherParticipantId}`);
      return NextResponse.json({ error: "Partner user not found" }, { status: 404 });
    }

    // Return the partner's details
    return NextResponse.json(partner);
  } catch (error) {
    console.error("🚨 Server error in chat partner API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
