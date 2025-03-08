
import { connectToDatabase } from '@/lib/mongoose';
import Chat from '@/models/Chat';
import User from '@/models/User';
import { ObjectId } from 'mongodb';

// Get all chats for a user
export async function getUserChats(userId: string) {
  await connectToDatabase();

  try {
    const chats = await Chat.find({
      participants: userId
    })
    .populate({
      path: 'participants',
      select: 'name image online lastSeen profilePic'
    })
    .sort({ updatedAt: -1 })
    .lean();

    return { success: true, chats };
  } catch (error) {
    console.error('Error fetching chats:', error);
    return { success: false, error: 'Failed to fetch chats' };
  }
}

// Get a single chat by ID
export async function getChatById(chatId: string, userId: string) {
  await connectToDatabase();

  try {
    const chat = await Chat.findById(chatId)
      .populate({
        path: 'participants',
        select: 'name image online lastSeen profilePic'
      })
      .lean();

    if (!chat) {
      return { success: false, error: 'Chat not found' };
    }

    // Check if user is a participant
    if (!chat.participants.some((p: any) => p._id.toString() === userId)) {
      return { success: false, error: 'Unauthorized access to chat' };
    }

    return { success: true, chat };
  } catch (error) {
    console.error('Error fetching chat:', error);
    return { success: false, error: 'Failed to fetch chat' };
  }
}

// Create a new chat
export async function createChat(userId: string, otherUserId: string) {
  await connectToDatabase();

  try {
    // Check if a chat already exists between these users
    const existingChat = await Chat.findOne({
      participants: { $all: [userId, otherUserId] }
    });

    if (existingChat) {
      return { success: true, chatId: existingChat._id };
    }

    // Create new chat
    const newChat = await Chat.create({
      participants: [userId, otherUserId],
      createdBy: userId,
      messages: [],
    });

    return { success: true, chatId: newChat._id };
  } catch (error) {
    console.error('Error creating chat:', error);
    return { success: false, error: 'Failed to create chat' };
  }
}

// Send a message
export async function sendMessage(chatId: string, userId: string, text: string) {
  await connectToDatabase();

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return { success: false, error: 'Chat not found' };
    }

    // Check if user is a participant
    if (!chat.participants.includes(userId)) {
      return { success: false, error: 'Unauthorized to send message in this chat' };
    }

    const newMessage = {
      sender: userId,
      text,
      createdAt: new Date()
    };

    // Add message to chat
    chat.messages.push(newMessage);
    chat.lastMessage = {
      text,
      sender: userId,
      createdAt: new Date()
    };

    await chat.save();
    return { success: true, messageId: chat.messages[chat.messages.length - 1]._id };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

// Function to mark all messages in a chat as read
export async function markMessagesAsRead(chatId: string, userId: string) {
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return false;

    // Update messages where user is not the sender and message is unread
    const updated = await Chat.updateMany(
      { 
        _id: chatId,
        "messages.sender": { $ne: userId },
        "messages.readAt": { $exists: false }
      },
      { $set: { "messages.$[elem].readAt": new Date() } },
      { arrayFilters: [{ "elem.sender": { $ne: userId }, "elem.readAt": { $exists: false } }] }
    );

    return true;
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return false;
  }
}

// Since we're using MongoDB and not Firebase, we don't need real-time subscriptions
// This is a placeholder that returns a cleanup function
export function subscribeToChatMessages(chatId: string, callback: Function) {
  // In a real implementation, you might use WebSockets or Server-Sent Events here
  console.log("Subscription to chat messages is not implemented with MongoDB");

  // Return a cleanup function
  return () => {
    console.log("Cleaning up chat subscription");
  };
}
