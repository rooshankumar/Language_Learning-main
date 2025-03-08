
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
import mongoose, { Schema, models, model } from 'mongoose';

const MessageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    attachments: [{ type: String }],
    readAt: { type: Date }
  },
  { timestamps: true }
);

const ChatSchema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    messages: [MessageSchema],
    lastMessage: {
      text: { type: String },
      sender: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date }
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export default models.Chat || model('Chat', ChatSchema);
