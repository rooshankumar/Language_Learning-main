
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse form data
    const formData = await req.formData();
    const file = formData.get('profilePic') as File;
    
    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Convert to base64 for Cloudinary
    const fileType = file.type;
    const base64String = `data:${fileType};base64,${buffer.toString('base64')}`;
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64String,
        {
          folder: 'profile_pictures',
          transformation: [{ width: 500, height: 500, crop: 'limit' }]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });
    
    // Update user in database
    await connectToDatabase();
    const userId = session.user.id || session.user._id;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        profilePic: (result as any).secure_url,
        photoURL: (result as any).secure_url, // Update photoURL for consistency
        image: (result as any).secure_url, // Update image for consistency with NextAuth
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      message: 'Profile picture uploaded successfully',
      profilePic: (result as any).secure_url,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePic: (result as any).secure_url
      }
    });
    
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
