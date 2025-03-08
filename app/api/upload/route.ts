
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { v2 as cloudinary } from 'cloudinary';
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Handle form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "language-app-profiles",
        },
        (error, result) => {
          if (error) reject(error);
          resolve(result);
        }
      );
      
      // Convert buffer to stream and pipe to Cloudinary
      const { Readable } = require('stream');
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
    
    // Update user's profile picture in database
    if (result && result.secure_url) {
      await connectToDatabase();
      
      const updateResult = await User.findOneAndUpdate(
        { email: session.user.email },
        { $set: { image: result.secure_url } },
        { new: true }
      );
      
      if (!updateResult) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        );
      }
      
      // Manually update the session
      await fetch('/api/auth/session', { 
        method: 'GET',
        cache: 'no-store'
      });
      
      return NextResponse.json({ 
        message: "Image uploaded successfully", 
        imageUrl: result.secure_url 
      });
    }
    
    return NextResponse.json(
      { message: "Failed to upload image" },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { uploadImage } from '@/lib/storage';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new NextResponse(
        JSON.stringify({ message: 'No file provided' }),
        { status: 400 }
      );
    }
    
    // Upload the image and get the URL
    const imageUrl = await uploadImage(file);
    
    // Update the user's profile with the new image URL
    await connectToDatabase();
    
    // Update the user record
    await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: { image: imageUrl } }
    );
    
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Error uploading profile image' }),
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new NextResponse(
        JSON.stringify({ message: 'No file provided' }),
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${uuidv4()}_${file.name.replace(/\s/g, '_')}`;
    
    // Create uploads directory in public folder if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    try {
      await writeFile(path.join(uploadDir, filename), buffer);
    } catch (error) {
      console.error('Error writing file:', error);
      // If directory doesn't exist, create it and try again
      const { mkdir } = require('fs/promises');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
    }

    const imageUrl = `/uploads/${filename}`;

    return NextResponse.json({ 
      message: 'File uploaded successfully',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Error uploading file' }),
      { status: 500 }
    );
  }
}
