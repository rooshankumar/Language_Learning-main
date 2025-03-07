
import mongoose, { Schema, models, model } from 'mongoose';

const MessageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ChatSchema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    messages: [MessageSchema],
    lastMessage: { type: Date },
  },
  { timestamps: true }
);

export default models.Chat || model('Chat', ChatSchema);
