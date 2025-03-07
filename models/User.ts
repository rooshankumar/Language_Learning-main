
import mongoose, { Schema, models, model } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    image: { type: String, default: '/placeholder-user.jpg' },
    bio: { type: String, default: '' },
    age: { type: Number },
    nativeLanguage: { type: String, default: 'English' },
    learningLanguage: { type: String, default: 'Spanish' },
    nativeLanguages: { type: [String], default: [] },
    learningLanguages: { type: [String], default: [] },
    proficiency: { type: String, default: 'beginner' },
    interests: { type: [String], default: [] },
    isOnboarded: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    online: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default models.User || model('User', UserSchema);
