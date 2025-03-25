import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
){
  try {
const {userId} = await auth()
if (!userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const { groupId } = params;
const group = await db.interviewGroup.findUnique({
  where: { id: groupId },
  include: { InterviewGroupUser: true },
})

if (!group) {
  return NextResponse.json(
    { error: "Interview group not found" },
    { status: 404 }
  );
}
return NextResponse.json({ group }, { status: 200 });
  } catch (error) {

    console.error("[INTERVIEW_GROUP_DETAILS]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
