
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongoose';
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
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'user_profiles' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });
    
    const uploadResult = await uploadPromise as any;
    
    // Update user in database
    await connectToDatabase();
    // Fix the type error by using optional chaining and type assertion
    const userId = (session.user as any).id || (session.user as any)._id;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        profilePic: uploadResult.secure_url,
        image: uploadResult.secure_url,
        photoURL: uploadResult.secure_url 
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      profileUrl: uploadResult.secure_url 
    });
    
  } catch (error) {
    console.error('Profile upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload profile picture' },
      { status: 500 }
    );
  }
}
