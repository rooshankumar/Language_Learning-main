import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { v2 as cloudinary } from "cloudinary";

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
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse form data with file
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get base64 encoded string
    const base64Data = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64Data}`;

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        dataURI,
        {
          folder: "profile_pictures",
          resource_type: "auto",
          // Generate a unique public_id for the image
          public_id: `user_${session.user.id || session.user.email}_${Date.now()}`,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    });

    // Return the URL of the uploaded image
    return NextResponse.json({
      message: "File uploaded successfully",
      imageUrl: (result as any).secure_url,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ message: error.message || "Upload failed" }, { status: 500 });
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