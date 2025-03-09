
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!params.chatId) {
      console.error("❌ Missing chatId:", params);
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    const client = await connectToDatabase();
    const db = client.db();
    
    let chatId;
    try {
      chatId = new ObjectId(params.chatId);
    } catch (error) {
      return NextResponse.json({ error: "Invalid chat ID format" }, { status: 400 });
    }

    const chat = await db.collection("chats").findOne({ _id: chatId });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Find the other participant (not the current user)
    const partnerId = chat.participants.find(
      (id: string | ObjectId) => id.toString() !== session.user.id
    );
    
    if (!partnerId) {
      return NextResponse.json({ error: "No chat partner found" }, { status: 404 });
    }

    // Fetch partner details
    let partnerObjectId;
    try {
      partnerObjectId = new ObjectId(partnerId);
    } catch (error) {
      return NextResponse.json({ error: "Invalid partner ID format" }, { status: 400 });
    }

    const partner = await db.collection("users").findOne({ _id: partnerObjectId });

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    return NextResponse.json(partner);
  } catch (error) {
    console.error("Error fetching chat partner:", error);
    return NextResponse.json({ error: "Failed to fetch chat partner" }, { status: 500 });
  }
}
