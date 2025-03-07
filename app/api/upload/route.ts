
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
      
      await User.updateOne(
        { email: session.user.email },
        { $set: { image: result.secure_url } }
      );
      
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
