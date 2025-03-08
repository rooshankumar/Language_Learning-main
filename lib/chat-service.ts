import { connectToDatabase } from './mongoose';
import mongoose from 'mongoose';

// Define Chat Schema if not already defined elsewhere
const ChatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: String,
  lastMessageTime: Date,
  createdAt: { type: Date, default: Date.now },
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
  }]
});

// Define Message Schema (This is redundant given the embedded messages in ChatSchema)
// const MessageSchema = new mongoose.Schema({
//   chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
//   senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   text: String,
//   timestamp: { type: Date, default: Date.now },
// });

// Get or create models
const Chat = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
// const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema); //Removed redundant model


// Create a new chat or get existing one
export const startChat = async (userId: string, recipientId: string) => {
  await connectToDatabase();

  // Check if chat already exists with these participants
  const existingChat = await Chat.findOne({
    participants: { $all: [userId, recipientId] }
  });

  if (existingChat) {
    return existingChat._id.toString();
  }

  // Create new chat
  const newChat = await Chat.create({
    participants: [userId, recipientId],
    lastMessageTime: new Date()
  });

  return newChat._id.toString();
};

// Get all chats for a user
export const getUserChats = async (userId: string) => {
  await connectToDatabase();

  const chats = await Chat.find({
    participants: userId
  }).populate('participants', 'name image');

  return chats.map(chat => ({
    id: chat._id.toString(),
    participants: chat.participants.map((p: any) => ({
      id: p._id.toString(),
      name: p.name,
      image: p.image
    })),
    lastMessage: chat.lastMessage,
    lastMessageTime: chat.lastMessageTime
  }));
};

// Send a message
export const sendMessage = async (chatId: string, senderId: string, text: string) => {
  await connectToDatabase();

  const chat = await Chat.findById(chatId);
  if (!chat) throw new Error("Chat not found");

  chat.messages.push({sender: senderId, text, timestamp: new Date()});
  await chat.save();

  // Update the chat's lastMessage
  // await Chat.findByIdAndUpdate(chatId, {
  //   lastMessage: text,
  //   lastMessageTime: new Date()
  // });

  return {
    id: chat.messages[chat.messages.length -1]._id.toString(), // Assuming _id is available after save
    senderId,
    text,
    timestamp: chat.messages[chat.messages.length -1].timestamp.toISOString()
  };
};

// Get messages for a chat
export async function getChatMessages(chatId: string) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Find messages for this chat
    const chat = await Chat.findById(chatId).populate('messages.sender');

    if (!chat) {
      throw new Error('Chat not found');
    }

    return chat.messages || [];
  } catch (error) {
    console.error('Error getting chat messages:', error);
    return [];
  }
}

// Subscribe to chat messages (mock implementation for NextAuth)
export function subscribeToChatMessages(chatId: string, callback: (messages: any[]) => void) {
  // Initial fetch
  getChatMessages(chatId).then(messages => {
    callback(messages);
  });

  // Set up polling every 5 seconds
  const intervalId = setInterval(async () => {
    const messages = await getChatMessages(chatId);
    callback(messages);
  }, 5000);

  // Return unsubscribe function
  return () => {
    clearInterval(intervalId);
  };
}

// Mark messages as read
export async function markMessagesAsRead(chatId: string, userId: string) {
  try {
    await connectToDatabase();

    // Update all unread messages in this chat where the current user is not the sender
    await Chat.findByIdAndUpdate(
      chatId,
      {
        $set: {
          'messages.$[elem].isRead': true
        }
      },
      {
        arrayFilters: [
          { 'elem.sender': { $ne: userId }, 'elem.isRead': false }
        ],
        new: true
      }
    );

    return true;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return false;
  }
}