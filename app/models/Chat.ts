
import mongoose, { Schema, models, model } from 'mongoose';

export interface IChat {
  _id: string;
  participants: string[]; // Array of User IDs
  lastMessage?: string; // Reference to the last message
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    participants: [{
      type: String,
      required: [true, 'Participants are required'],
      ref: 'User',
    }],
    lastMessage: {
      type: String,
      ref: 'Message',
    },
  },
  { timestamps: true }
);

export const Chat = models.Chat || model<IChat>('Chat', ChatSchema);

export default Chat;
