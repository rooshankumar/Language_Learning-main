
import mongoose, { Schema, models, model } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    image: { type: String, default: '/placeholder-user.jpg' },
    bio: String,
    age: Number,
    nativeLanguage: String,
    learningLanguage: String,
    interests: [String],
    isOnboarded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default models.User || model('User', UserSchema);
