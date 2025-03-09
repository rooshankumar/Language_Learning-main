import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/lib/mongodb";
import Chat from "@/models/Chat";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { receiverId } = await request.json();
    if (!receiverId) {
      return NextResponse.json({ error: "Receiver ID is required" }, { status: 400 });
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      participants: { 
        $all: [session.user.id, receiverId] 
      }
    });

    if (existingChat) {
      return NextResponse.json({ chatId: existingChat._id });
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    // Create new chat
    const newChat = await Chat.create({
      participants: [session.user.id, receiverId],
      messages: []
    });

    return NextResponse.json({ chatId: newChat._id });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
  }
}