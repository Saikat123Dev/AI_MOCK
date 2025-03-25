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

    // Check if the group exists
    const group = await db.interviewGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Interview group not found" },
        { status: 404 }
      );
    }

    // Check if the user is the creator
    if (group.createdBy === userId) {
      return NextResponse.json(
        { error: "The creator cannot leave the group. You can cancel it instead." },
        { status: 403 }
      );
    }

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

    // Delete the participant record
    await db.interviewGroupUser.delete({
      where: {
        id: participant.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "You have left the interview group",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error leaving interview group:", error);
    return NextResponse.json(
      { error: "Failed to leave interview group" },
      { status: 500 }
    );
  }
}
