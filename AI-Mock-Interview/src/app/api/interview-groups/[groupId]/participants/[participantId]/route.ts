import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string; participantId: string } }
) {
  try {
    // Authenticate request
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the participant with all their answers
    const participant = await db.interviewGroupUser.findUnique({
      where: {
        id: params.participantId,
        groupId: params.groupId,
      },
      include: {
        Answer: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // Fetch user info if userId is available
    let user = null;
    if (participant.userId) {
      user = await db.user.findUnique({
        where: { id: participant.userId },
        select: {
          id: true,
          name: true,
          email: true,
          ProfileImage: true,
        },
      });
    }

    // Process the answers to include feedback
    const processedAnswers = participant.Answer.map(answer => {
      return {
        ...answer,
        feedback: answer.feedback || null,
      };
    });

    return NextResponse.json({
      participant: {
        ...participant,
        Answer: processedAnswers,
        user,
      },
    });
  } catch (error) {
    console.error("Error fetching participant data:", error);
    return NextResponse.json(
      { error: "Failed to fetch participant data" },
      { status: 500 }
    );
  }
}
