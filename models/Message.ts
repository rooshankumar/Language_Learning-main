
import mongoose, { Schema, models, model } from 'mongoose';

export interface IMessage {
  _id: string;
  content: string;
  sender: string; // User ID
  recipient?: string; // User ID for direct messages
  chatId?: string; // For group chats or direct message threads
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    content: {
      type: String,
      required: [true, 'Message content is required'],
    },
    sender: {
      type: String,
      required: [true, 'Sender is required'],
      ref: 'User',
    },
    recipient: {
      type: String,
      ref: 'User',
    },
    chatId: {
      type: String,
      ref: 'Chat',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Message = models.Message || model<IMessage>('Message', MessageSchema);

export default Message;
