
import { connectToDatabase } from './mongoose';
import mongoose from 'mongoose';

// Define Chat Schema if not already defined elsewhere
const ChatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: String,
  lastMessageTime: Date,
  createdAt: { type: Date, default: Date.now },
});

// Define Message Schema
const MessageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  timestamp: { type: Date, default: Date.now },
});

// Get or create models
const Chat = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

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
  
  const message = await Message.create({
    chatId,
    senderId,
    text,
    timestamp: new Date()
  });
  
  // Update the chat's lastMessage
  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: text,
    lastMessageTime: new Date()
  });
  
  return {
    id: message._id.toString(),
    senderId,
    text,
    timestamp: message.timestamp.toISOString()
  };
};

// Get messages for a chat
export const getChatMessages = async (chatId: string) => {
  await connectToDatabase();
  
  const messages = await Message.find({ chatId }).sort('timestamp');
  
  return messages.map(msg => ({
    id: msg._id.toString(),
    senderId: msg.senderId.toString(),
    text: msg.text,
    timestamp: msg.timestamp.toISOString()
  }));
};
