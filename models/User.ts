
import mongoose, { Schema, models, model } from 'mongoose';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  image: string;
  emailVerified?: Date;
  bio?: string;
  age?: number;
  nativeLanguage?: string;
  learningLanguage?: string;
  interests?: string[];
  isOnboarded?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { 
      type: String, 
      required: [true, 'Name is required'] 
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
    },
    password: {
      type: String,
    },
    image: {
      type: String,
      default: '/placeholder-user.jpg',
    },
    emailVerified: {
      type: Date,
    },
    bio: {
      type: String,
    },
    age: {
      type: Number,
    },
    nativeLanguage: {
      type: String,
    },
    learningLanguage: {
      type: String,
    },
    interests: {
      type: [String],
      default: [],
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>('User', UserSchema);

export default User;
