import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";


export  async function POST(req:NextRequest){
try {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, dateTime, role, skills, experience,questionNo, timeLimit,difficulty } = await req.json();

  if (!name || !dateTime || !role || !skills || !difficulty||!questionNo || !timeLimit || !experience) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const interviewDate = new Date(dateTime);
  const now = new Date();

  if (interviewDate <= now) {
    return NextResponse.json({ error: "Interview date must be in the future" }, { status: 400 });
  }

  // Generate a unique public ID
  const publicId = nanoid(10);
  const group = await db.interviewGroup.create({
    data: {
      name,
      dateTime: interviewDate,
      role,
      skills,
      experience,
      timeLimit,
      questionNo,
      difficulty,
      createdBy: userId,
      publicId,
    },
  });
  await db.interviewGroupUser.create({
    data: {
      groupId: group.id,
      userId,
      isAdmin: true,
      isReady: false,
    },
  });
  return NextResponse.json({
    success: true,
    message: "Interview group created successfully",
    group
  }, { status: 201 });
 } catch (error) {
  console.error("Error creating interview group:", error);
    return NextResponse.json({ error: "Failed to create interview group" }, { status: 500 });
  }
}
