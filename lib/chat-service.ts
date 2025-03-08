'use server';

import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function getUserChats(userId: string) {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Convert string ID to ObjectId if needed
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    // Find chats where the user is a participant
    const chats = await db.collection('chats').find({
      participants: userObjectId
    }).toArray();

    return { success: true, chats };
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return { success: false, error: 'Failed to fetch chats' };
  }
}

export async function getChatWithUser(currentUserId: string, otherUserId: string) {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Convert string IDs to ObjectId
    const currentUserObjectId = typeof currentUserId === 'string' ? new ObjectId(currentUserId) : currentUserId;
    const otherUserObjectId = typeof otherUserId === 'string' ? new ObjectId(otherUserId) : otherUserId;

    // Find chat where both users are participants
    const chat = await db.collection('chats').findOne({
      participants: { 
        $all: [currentUserObjectId, otherUserObjectId] 
      }
    });

    return { success: true, chat };
  } catch (error) {
    console.error('Error fetching chat:', error);
    return { success: false, error: 'Failed to fetch chat' };
  }
}

export async function getUserById(userId: string) {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Convert string ID to ObjectId
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const user = await db.collection('users').findOne({ _id: userObjectId });
    return { success: true, user };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { success: false, error: 'Failed to fetch user' };
  }
}

export async function sendMessage(chatId: string, senderId: string, text: string) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const message = {
      sender: typeof senderId === 'string' ? new ObjectId(senderId) : senderId,
      text,
      readAt: null,
      createdAt: new Date()
    };

    // Add message to chat
    await db.collection('chats').updateOne(
      { _id: typeof chatId === 'string' ? new ObjectId(chatId) : chatId },
      { 
        $push: { messages: message },
        $set: { 
          lastMessage: { 
            text, 
            sender: message.sender, 
            createdAt: message.createdAt 
          },
          updatedAt: new Date()
        }
      }
    );

    return { success: true, message };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

export async function createChat(currentUserId: string, otherUserId: string) {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Convert string IDs to ObjectId
    const currentUserObjectId = typeof currentUserId === 'string' ? new ObjectId(currentUserId) : currentUserId;
    const otherUserObjectId = typeof otherUserId === 'string' ? new ObjectId(otherUserId) : otherUserId;

    // Check if chat already exists
    const existingChat = await db.collection('chats').findOne({
      participants: { 
        $all: [currentUserObjectId, otherUserObjectId] 
      }
    });

    if (existingChat) {
      return { success: true, chat: existingChat };
    }

    // Create new chat
    const newChat = {
      participants: [currentUserObjectId, otherUserObjectId],
      messages: [],
      lastMessage: null,
      createdBy: currentUserObjectId,

export async function getChatById(chatId: string) {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Convert string ID to ObjectId
    const chatObjectId = typeof chatId === 'string' ? new ObjectId(chatId) : chatId;

    const chat = await db.collection('chats').findOne({ _id: chatObjectId });
    
    if (!chat) {
      return { success: false, error: 'Chat not found' };
    }

    return { success: true, chat };
  } catch (error) {
    console.error('Error fetching chat by ID:', error);
    return { success: false, error: 'Failed to fetch chat' };
  }
}

      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('chats').insertOne(newChat);

    return { 
      success: true, 
      chat: { ...newChat, _id: result.insertedId } 
    };
  } catch (error) {
    console.error('Error creating chat:', error);
    return { success: false, error: 'Failed to create chat' };
  }
}

// Function to mark all messages in a chat as read
export async function markMessagesAsRead(chatId: string, userId: string) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const chatIdObj = typeof chatId === 'string' ? new ObjectId(chatId) : chatId;
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;

    // Update messages where user is not the sender and message is unread
    const result = await db.collection('chats').updateOne(
      { _id: chatIdObj },
      { 
        $set: { 
          "messages.$[elem].readAt": new Date() 
        } 
      },
      { 
        arrayFilters: [
          { "elem.sender": { $ne: userIdObj }, "elem.readAt": null }
        ] 
      }
    );

    return { success: true, result };
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return { success: false, error: 'Failed to mark messages as read' };
  }
}

// Since we're using MongoDB and not Firebase, we don't need real-time subscriptions
// This is a placeholder that returns a cleanup function
export async function subscribeToChatMessages(chatId: string, callback: Function) {
  // In a real implementation, you might use WebSockets or Server-Sent Events here
  console.log("Subscription to chat messages is not implemented with MongoDB");

  // Return a cleanup function
  return () => {
    console.log("Cleaning up chat subscription");
  };
}