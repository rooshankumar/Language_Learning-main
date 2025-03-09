import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "You must be logged in to access this resource" }),
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();

    const users = await db.collection("users")
      .find({ _id: { $ne: new ObjectId(session.user.id) } })
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch users" }),
      { status: 500 }
    );
  }
}