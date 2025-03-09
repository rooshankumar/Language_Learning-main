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