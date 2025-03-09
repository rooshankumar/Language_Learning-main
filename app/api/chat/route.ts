import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
//import { connectToDatabase } from "@/lib/mongodb"; //Removed duplicate import


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, participants } = body;

    if (!name || !participants || !Array.isArray(participants)) {
      return NextResponse.json({ error: "Invalid chat data" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const newChat = {
      name,
      participants,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("chats").insertOne(newChat);

    return NextResponse.json({
      id: result.insertedId,
      ...newChat
    });
  } catch (error) {
    console.error("❌ Error creating chat:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { connectToDatabase } from "@/lib/mongodb"; //moved this import here

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    if (!db) throw new Error("Database connection failed");

    const chats = await db.collection("chats").find({}).toArray();
    return NextResponse.json({ chats });
  } catch (error) {
    console.error("❌ Error fetching chats:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}