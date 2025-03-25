// File: app/api/experiences/[userId]/route.js
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
type Params = {
    params: {
      userId: string;
    };
  };
export async function GET (request: NextRequest,
  { params }: Params): Promise<NextResponse>  {
  try {
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    const experiences = await db.experience.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        Duration: 'desc'
      }
    });
    
    return NextResponse.json({ success: true, experiences });
  } catch (error) {
    console.error("Error fetching experiences:", error);
    return NextResponse.json(
      { error: "Something went wrong! Please try again." },
      { status: 500 }
    );
  }
}