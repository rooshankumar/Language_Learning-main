
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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
    const file = formData.get('file') as File;
    
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
    
    return NextResponse.json({ 
      imageUrl: (result as any).secure_url 
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ 
      message: `Error uploading image: ${error.message}` 
    }, { status: 500 });
  }
}
