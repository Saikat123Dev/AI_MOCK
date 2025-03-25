import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
   const {userId} =await auth()
   if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = params;
  const group = await db.interviewGroup.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    return NextResponse.json(
      { error: "Interview group not found" },
      { status: 404 }
    );
  }
  if (group.createdBy !== userId) {
    return NextResponse.json(
      { error: "Only the creator can cancel the interview group" },
      { status: 403 }
    );
  }
  await db.interviewGroup.update({
    where: {
      id: groupId,
    },
    data: {
      isActive: false,
    },
  });

  return NextResponse.json(
    {
      success: true,
      message: "Interview group has been cancelled",
    },
    { status: 200 }
  );



  } catch (error) {

    console.error("Error cancelling interview group:", error);
    return NextResponse.json(
      { error: "Failed to cancel interview group" },
      { status: 500 }
    );
  }
}
