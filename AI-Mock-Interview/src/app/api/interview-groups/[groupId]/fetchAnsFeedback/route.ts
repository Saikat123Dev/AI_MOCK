// app/api/interview-groups/[groupId]/data/route.ts
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    // Authenticate request
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the interview group with all related data
    const interviewGroup = await db.interviewGroup.findUnique({
      where: {
        id: params.groupId,
      },
      include: {
        InterviewGroupUser: {
          include: {
            Answer: {
              include: {
                question: true,
              },
            },
          },
        },
        InterviewQuestion: true,
      },
    });

    if (!interviewGroup) {
      return NextResponse.json(
        { error: "Interview group not found" },
        { status: 404 }
      );
    }

    // Fetch user information for each participant
    const participants = await Promise.all(
      interviewGroup.InterviewGroupUser.map(async (participant) => {
        const user = participant.userId ? await db.user.findUnique({
          where: { id: participant.userId },
          select: {
            id: true,
            name: true,
            email: true,
            ProfileImage: true,
          },
        }) : null;

        return {
          ...participant,
          user,
        };
      })
    );

    // Restructure the data for easier consumption by the frontend
    const formattedData = {
      group: {
        id: interviewGroup.id,
        name: interviewGroup.name,
        dateTime: interviewGroup.dateTime,
        role: interviewGroup.role,
        timeLimit: interviewGroup.timeLimit,
        skills: interviewGroup.skills,
        questionNo: interviewGroup.questionNo,
        experience: interviewGroup.experience,
        difficulty: interviewGroup.difficulty,
        createdAt: interviewGroup.createdAt,
      },
      questions: interviewGroup.InterviewQuestion,
      participants: participants,
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error fetching group data:", error);
    return NextResponse.json(
      { error: "Failed to fetch group data" },
      { status: 500 }
    );
  }
}
