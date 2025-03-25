import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Fetch all groups where the user is a participant
    const userGroups = await db.interviewGroupUser.findMany({
      where: { userId },
      select: { groupId: true }
    });
    const groupIds = userGroups.map(group => group.groupId);
    // Fetch the actual groups with details
    const groups = await db.interviewGroup.findMany({
      where: {
        id: { in: groupIds }
      },
      include: {
        InterviewGroupUser: true
      },
      orderBy: {
        dateTime: 'asc'
      }
    });
    // Ensure groups is always an array
    return NextResponse.json({ groups: groups || [] }, { status: 200 });
  } catch (error) {
    console.error("[LIST_INTERVIEW_GROUPS]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
