
import { NextResponse } from "next/server";
import { verifyDbConnection } from "@/lib/mongodb";

export async function GET() {
  try {
    console.log("Testing database connection...");
    const isConnected = await verifyDbConnection();
    
    if (!isConnected) {
      console.error("Database connection test failed");
      return NextResponse.json({ 
        status: "error", 
        message: "Database connection failed",
        connected: false
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      status: "success", 
      message: "Database connection successful",
      connected: true
    });
  } catch (error) {
    console.error("Database connection test error:", error);
    return NextResponse.json({ 
      status: "error", 
      message: "Database connection test error",
      error: error instanceof Error ? error.message : String(error),
      connected: false
    }, { status: 500 });
  }
}
