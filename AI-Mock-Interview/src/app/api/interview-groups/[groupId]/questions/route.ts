// src/app/api/interview-groups/[groupId]/questions/route.ts
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = params;
    const group = await db.interviewGroup.findUnique({
      where: { id: groupId },
      include: {
        InterviewGroupUser: {
          where: { userId },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Interview group not found" },
        { status: 404 }
      );
    }

    // Check if the user is part of this group
    if (group.InterviewGroupUser.length === 0 && group.createdBy !== userId) {
      return NextResponse.json(
        { error: "You are not a member of this interview group" },
        { status: 403 }
      );
    }

    // Get all questions for this group
    const questions = await db.question.findMany({
      where: { groupId },
      orderBy: { createdAt: "asc" },
    });

    // Map to the format our frontend expects
    const mappedQuestions = questions.map((q) => ({
      id: q.id,
      text: q.text,
      correctAnswer: q.correctAnswer,
      timeLimit: q.timeLimit,

    }));

    return NextResponse.json(
      {
        success: true,
        questions: mappedQuestions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
