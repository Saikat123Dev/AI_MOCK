import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = params;

    // Find the participant record
    const participant = await db.interviewGroupUser.findFirst({
      where: {
        groupId,
        userId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "You are not a participant in this group" },
        { status: 403 }
      );
    }

    // Toggle ready status
    const updatedParticipant = await db.interviewGroupUser.update({
      where: {
        id: participant.id,
      },
      data: {
        isReady: !participant.isReady,
      },
    });

    return NextResponse.json(
      {
        success: true,
        isReady: updatedParticipant.isReady,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating ready status:", error);
    return NextResponse.json(
      { error: "Failed to update ready status" },
      { status: 500 }
    );
  }
}
