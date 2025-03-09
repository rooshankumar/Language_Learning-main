import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: Request) {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to view users" },
        { status: 401 }
      );
    }

    const users = await User.find({
      _id: { $ne: session.user.id } // Exclude the current user
    }).select('name email image languages level streakCount');

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}