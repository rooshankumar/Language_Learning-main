
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    await connectToDatabase();
    
    // Get all registered users that have completed onboarding
    const users = await User.find({ 
      isOnboarded: true,
      // Don't include the current user
      email: { $ne: session.user.email }
    }).select("-password").sort({ lastSeen: -1 });
    
    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Error fetching community users:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}
