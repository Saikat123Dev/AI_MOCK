import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { interviewid: string } }
) {
  try {
    const {interviewid} = await params
    const interview = await db.mockInterview.findUnique({
      where: {
        id:  interviewid,
      },
    });
    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(interview);
  } catch (error: any) {
    console.log("error finding interview", error.message || error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
