import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert buffer to base64
    const base64String = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64String}`;

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(dataURI, {
        folder: 'user_profiles',
      }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    // Update user's profile picture URL in database
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: { profilePicture: (uploadResult as any).secure_url } },
      { new: true }
    );

    return NextResponse.json({ 
      url: (uploadResult as any).secure_url,
      user
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

// Set larger body size limit for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Add GET method to handle preflight requests
export async function GET() {
  return new NextResponse(
    JSON.stringify({ message: 'Upload API is working' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}