
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Don't send password in the response
    const userProfile = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.bio,
      age: user.age,
      nativeLanguage: user.nativeLanguage,
      learningLanguage: user.learningLanguage,
      interests: user.interests,
      isOnboarded: user.isOnboarded,
    };

    return NextResponse.json(userProfile);
  } catch (error: any) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Update user fields
    Object.keys(data).forEach((key) => {
      if (key !== "password" && key !== "email") {
        // Don't allow updating email or password through this route
        user[key] = data[key];
      }
    });

    // Mark user as onboarded if profile data is being updated
    if (data.nativeLanguage || data.learningLanguage) {
      user.isOnboarded = true;
    }

    await user.save();

    // Don't send password in the response
    const updatedProfile = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.bio,
      age: user.age,
      nativeLanguage: user.nativeLanguage,
      learningLanguage: user.learningLanguage,
      interests: user.interests,
      isOnboarded: user.isOnboarded,
    };

    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update profile" },
      { status: 500 },
    );
  }
}
