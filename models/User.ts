
import mongoose, { Schema, models, model } from 'mongoose';

// Create user schema
const userSchema = new Schema(
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
    country: { type: String }, // Add country field
  },
  { timestamps: true }
);

// Pre-save hook for document
userSchema.pre('save', function(next) {
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
});

// For findOneAndUpdate operations - fixing this middleware
userSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (!update) return next();
  
  // Sync profile image fields in the update
  if (update.profilePic) {
    update.image = update.profilePic;
    update.photoURL = update.profilePic;
  } else if (update.photoURL) {
    update.image = update.photoURL;
    update.profilePic = update.photoURL;
  } else if (update.image) {
    update.photoURL = update.image;
    update.profilePic = update.image;
  }
  next();
});

export default models.User || model('User', userSchema);
