import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { interviewId?: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {interviewId} =  await params;

    if (interviewId) {
      const hrInterview = await db.hRInterview.findUnique({
        where: { id: interviewId, userId },
        include: {
          questions: {
            include: {
              followUpQuestions: true,
              userAnswer: true
            }
          }
        }
      });

      if (!hrInterview) {
        return NextResponse.json({ error: "HR Interview not found" }, { status: 404 });
      }

      return NextResponse.json(hrInterview);
    } else {
      // Fetch all HR Interviews for the user
      const hrInterviews = await db.hRInterview.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { questions: true }
          }
        }
      });

      return NextResponse.json(hrInterviews);
    }
  } catch (error) {
    console.error("Error retrieving HR interviews:", error);
    return NextResponse.json({ error: "Failed to retrieve interviews" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id?: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hrInterviewId = params.id;
    if (!hrInterviewId) {
      return NextResponse.json({ error: "HR Interview ID is required" }, { status: 400 });
    }

    // Delete the HR Interview
    await db.hRInterview.deleteMany({
      where: {
        id: hrInterviewId,
        userId
      }
    });

    return NextResponse.json({
      success: true,
      message: "HR Interview deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting HR interview:", error);
    return NextResponse.json({ error: "Failed to delete interview" }, { status: 500 });
  }
}
