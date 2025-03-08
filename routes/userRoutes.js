
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const upload = require('../middleware/upload');
const User = require('../models/User');

// POST route for profile picture upload
router.post('/upload-profile', upload.single('profilePic'), async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { userId } = req.body;

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Find user and update profilePic field
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        profilePic: req.file.path,
        photoURL: req.file.path // Also update photoURL for consistency
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profilePic: req.file.path,
      user
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
