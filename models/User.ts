import mongoose, { Schema, models, model } from 'mongoose';

// Middleware to ensure image fields stay in sync
const syncImageFields = function(this: any, next: any) {
  if (this.isModified('profilePic')) {
    this.image = this.profilePic;
    this.photoURL = this.profilePic;
  } else if (this.isModified('photoURL')) {
    this.image = this.photoURL;
    this.profilePic = this.photoURL;
  } else if (this.isModified('image')) {
    this.photoURL = this.image;
    this.profilePic = this.image;
  }
  next();
};

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
    photoURL: { type: String, default: '/placeholder-user.jpg' }, // For compatibility
    profilePic: { type: String, default: '/placeholder-user.jpg' }, // Cloudinary URL
    displayName: { type: String }, // Add displayName field
  },
  { timestamps: true }
);

// Add pre-save hook to sync image fields
UserSchema.pre('save', syncImageFields);
UserSchema.pre('findOneAndUpdate', syncImageFields);

export default models.User || model('User', UserSchema);