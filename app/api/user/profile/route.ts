
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import User from "@/models/User";
import connectDB from "@/lib/mongoose";

// GET /api/user/profile - Get current user profile
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email }).lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Don't send the password
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error("Error getting profile:", error);
    return NextResponse.json({ message: error.message || "Error getting profile" }, { status: 500 });
  }
}

// PATCH /api/user/profile - Update user profile
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const data = await req.json();
    const allowedFields = [
      'displayName', 
      'name',
      'bio', 
      'age',
      'nativeLanguage',
      'learningLanguage',
      'nativeLanguages',
      'learningLanguages',
      'proficiency',
      'interests',
      'profilePic'
    ];

    // Filter out any fields not in the allowed list
    const updateData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }

    // If displayName is set, also set name to the same value for consistency
    if (updateData.displayName && !updateData.name) {
      updateData.name = updateData.displayName;
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Remove password from the response
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ message: error.message || "Error updating profile" }, { status: 500 });
  }
}

// PUT /api/user/profile - Legacy API for compatibility
export async function PUT(req: NextRequest) {
  return PATCH(req);
}
