import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

type Params = {
  params: {
    userId: string;
  };
};

export async function GET(
  request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  try {
    const  userId  = await params.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    const profile = await db.user.findUnique({
      where: {
        id: userId
      }
    });
    
    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Something went wrong! Please try again." },
      { status: 500 }
    );
  }
}