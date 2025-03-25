import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { interviewid: any } }
) {
  try {
    const {interviewid} = params
    const fetchInterviewfeedback = await db.userAnswer.findMany({
      where: {
        mockInterviewId: interviewid,
      },
    });
    if (!fetchInterviewfeedback) {
      return NextResponse.json({ error: "No feedback found" }, { status: 404 });
    }
    return NextResponse.json(fetchInterviewfeedback);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching interview feedback" },
      { status: 500 }
    );
  }
}
