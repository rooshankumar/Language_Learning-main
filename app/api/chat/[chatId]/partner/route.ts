
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req, { params }) {
  try {
    console.log("📌 Fetching chat partner for chatId:", params.chatId);
    if (!params?.chatId) {
      console.error("❌ Missing chatId:", params);
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    if (!db) throw new Error("❌ Database connection failed");

    // Find chat document
    let chatObjectId;
    try {
      chatObjectId = new ObjectId(params.chatId);
    } catch (error) {
      console.error("❌ Invalid chat ID format:", params.chatId);
      return NextResponse.json({ error: "Invalid chat ID format" }, { status: 400 });
    }

    const chat = await db.collection("chats").findOne({ _id: chatObjectId });
    console.log("🔍 Chat found:", !!chat);

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Get current user ID from the request or session
    const userId = req.user?.id || req.headers.get('x-user-id');
    console.log("👤 Current user ID:", userId);

    // Find the chat partner (other user in the chat)
    const partnerId = chat.participants.find(id => id !== userId);
    console.log("🔍 Partner ID found:", !!partnerId);

    if (!partnerId) {
      console.error("❌ No chat partner found in participants:", chat.participants);
      return NextResponse.json({ error: "No chat partner found" }, { status: 404 });
    }

    // Fetch partner details
    let partnerObjectId;
    try {
      partnerObjectId = new ObjectId(partnerId);
    } catch (error) {
      console.error("❌ Invalid partner ID format:", partnerId);
      return NextResponse.json({ error: "Invalid partner ID format" }, { status: 400 });
    }

    const partner = await db.collection("users").findOne({ _id: partnerObjectId });
    console.log("👤 Chat Partner found:", !!partner);

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    return NextResponse.json(partner);
  } catch (error) {
    console.error("🚨 Error fetching chat partner:", error.message, error.stack);
    return NextResponse.json({ error: "Failed to fetch chat partner" }, { status: 500 });
  }
}
