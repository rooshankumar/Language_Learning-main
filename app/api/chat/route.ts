
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import Chat from "@/models/Chat";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    
    await connectToDatabase();
    
    const currentUser = await User.findOne({ email: session.user.email });
    
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    
    // If userId is provided, get specific chat
    if (userId) {
      const otherUser = await User.findById(userId);
      
      if (!otherUser) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }
      
      // Find chat between these two users
      const chat = await Chat.findOne({
        participants: { 
          $all: [
            new mongoose.Types.ObjectId(currentUser._id),
            new mongoose.Types.ObjectId(userId)
          ] 
        }
      }).populate({
        path: 'messages.sender',
        select: 'name image'
      });
      
      if (!chat) {
        // Return empty chat if no conversation exists yet
        return NextResponse.json({
          messages: [],
          participant: {
            id: otherUser._id,
            name: otherUser.name,
            image: otherUser.image
          }
        });
      }
      
      return NextResponse.json({
        messages: chat.messages,
        participant: {
          id: otherUser._id,
          name: otherUser.name,
          image: otherUser.image
        }
      });
    }
    
    // Get all chats for the current user
    const chats = await Chat.find({
      participants: new mongoose.Types.ObjectId(currentUser._id)
    }).populate({
      path: 'participants',
      select: 'name image lastSeen online',
      match: { _id: { $ne: currentUser._id } }
    }).sort({ lastMessage: -1 });
    
    return NextResponse.json(chats);
  } catch (error: any) {
    console.error("Chat fetch error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const data = await request.json();
    const { recipientId, message } = data;
    
    if (!recipientId || !message) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const sender = await User.findOne({ email: session.user.email });
    
    if (!sender) {
      return NextResponse.json({ message: "Sender not found" }, { status: 404 });
    }
    
    const recipient = await User.findById(recipientId);
    
    if (!recipient) {
      return NextResponse.json(
        { message: "Recipient not found" },
        { status: 404 }
      );
    }
    
    // Find existing chat or create a new one
    let chat = await Chat.findOne({
      participants: { 
        $all: [
          new mongoose.Types.ObjectId(sender._id),
          new mongoose.Types.ObjectId(recipientId)
        ] 
      }
    });
    
    if (!chat) {
      chat = new Chat({
        participants: [sender._id, recipient._id],
        messages: [],
      });
    }
    
    // Add the new message
    chat.messages.push({
      sender: sender._id,
      content: message,
      read: false,
    });
    
    chat.lastMessage = new Date();
    await chat.save();
    
    return NextResponse.json(
      { message: "Message sent successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Get conversation partner ID from query
    const url = new URL(request.url);
    const partnerId = url.searchParams.get('partnerId');

    if (!partnerId) {
      return new NextResponse(
        JSON.stringify({ message: 'Partner ID is required' }),
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the partner user
    const partner = await User.findById(partnerId).select("-password");
    
    if (!partner) {
      return new NextResponse(
        JSON.stringify({ message: 'Partner not found' }),
        { status: 404 }
      );
    }

    // For now, return an empty message array (in a real app, you'd get messages from a Chat model)
    return NextResponse.json({
      partner: {
        id: partner._id,
        name: partner.name,
        image: partner.image,
        lastSeen: partner.lastSeen,
        online: partner.online
      },
      messages: []
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Error fetching chat' }),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { partnerId, message } = body;

    if (!partnerId || !message) {
      return new NextResponse(
        JSON.stringify({ message: 'Partner ID and message are required' }),
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the current user
    const currentUser = await User.findOne({ email: session.user.email });
    
    if (!currentUser) {
      return new NextResponse(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    // Find the partner user
    const partner = await User.findById(partnerId);
    
    if (!partner) {
      return new NextResponse(
        JSON.stringify({ message: 'Partner not found' }),
        { status: 404 }
      );
    }

    // In a real app, you would save the message to your Chat model
    // For now, just return a success response with the message
    return NextResponse.json({
      success: true,
      message: {
        id: Date.now().toString(),
        senderId: currentUser._id.toString(),
        text: message,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Error sending message' }),
      { status: 500 }
    );
  }
}
