import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req, { params }) {
  try {
    console.log("Fetching chat partner for chatId:", params.chatId);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error("❌ Unauthorized access attempt to chat partner API");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = params;
    const userId = session.user.id;

    console.log(`User ${userId} requesting chat partner for chat ${chatId}`);

    const db = await connectToDB();

    // Check if chatId is valid
    if (!chatId || typeof chatId !== 'string' || chatId.length !== 24) {
      console.error(`❌ Invalid chatId format: ${chatId}`);
      return NextResponse.json({ error: "Invalid chat ID format" }, { status: 400 });
    }

    // Find the chat
    const chat = await db.collection("chats").findOne({ 
      _id: new ObjectId(chatId)
    });

    if (!chat) {
      console.error(`❌ Chat not found: ${chatId}`);
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Check if user is a participant
    const userIdStr = userId.toString();
    const isParticipant = chat.participants.some(
      id => id.toString() === userIdStr || id === userIdStr
    );

    if (!isParticipant) {
      console.error(`❌ Access denied for user ${userId} to chat ${chatId}`);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Find the partner (the other participant)
    const partnerId = chat.participants.find(
      id => id.toString() !== userIdStr && id !== userIdStr
    );

    if (!partnerId) {
      console.error(`❌ Partner not found in chat ${chatId}`);
      return NextResponse.json({ error: "Chat partner not found" }, { status: 404 });
    }

    console.log(`Looking for partner with ID: ${partnerId}`);

    // Query the users collection for partner details
    const partner = await db.collection("users").findOne({ 
      _id: typeof partnerId === 'string' ? new ObjectId(partnerId) : partnerId 
    });

    if (!partner) {
      console.error(`❌ Partner user not found in database: ${partnerId}`);
      return NextResponse.json({ error: "Chat partner not found" }, { status: 404 });
    }

    // Create a safe partner object with only necessary info
    const safePartner = {
      _id: partner._id,
      name: partner.name || partner.displayName || "Unknown User",
      profilePic: partner.image || partner.profilePic || null,
      lastActive: partner.lastActive || null
    };

    console.log(`✅ Successfully fetched partner for chat ${chatId}: ${safePartner.name}`);
    return NextResponse.json(safePartner);
  } catch (error) {
    console.error("🚨 Error fetching chat partner:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}