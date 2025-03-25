import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { groupId } = await req.json(); // Parse the request body correctly

    const group = await db.interviewGroup.findUnique({
      where: {
        id: groupId,
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const start = await db.interviewGroup.update({
      where: {
        id: groupId,
      },
      data: {
        isStarted: true,
      },
    });

    return NextResponse.json({ message: "Interview started successfully", start });
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}
