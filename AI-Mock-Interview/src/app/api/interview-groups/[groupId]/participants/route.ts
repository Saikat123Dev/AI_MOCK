import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// GET: Fetch participants
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

    // Verify the interview group exists
    const group = await db.interviewGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Interview group not found" },
        { status: 404 }
      );
    }

    // Fetch participants
    const participants = await db.interviewGroupUser.findMany({
      where: { groupId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        isAdmin: true,
        isReady: true,
        totalScore: true,
        createdAt: true,
        updatedAt: true,
        Answer: {
          select: {
            id: true
          }
        },
      },
    });

    // Fetch corresponding user details
    const users = await db.user.findMany({
      where: {
        id: { in: participants.map((p) => p.userId) },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Merge participant and user data
    const participantsWithUserInfo = participants.map(participant => {
      const user = users.find(u => u.id === participant.userId) || {};
      return {
        id: participant.id,
        userId: participant.userId,
        name: user.name || null,
        email: user.email || null,
        imageUrl: user.imageUrl || null,
        isAdmin: participant.isAdmin || false,
        isReady: participant.isReady || false,
        totalScore: participant.totalScore || 0,
        totalAnswers: participant.Answer?.length || 0,
      };
    });

    console.log("Processed participants data:", participantsWithUserInfo);

    return NextResponse.json({
      participants: participantsWithUserInfo
    });

  } catch (error) {
    console.error("[GET_INTERVIEW_PARTICIPANTS]", error.message);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Add a participant
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
    const { name, email, imageUrl } = await req.json();

    // Validate request body
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and Email are required" },
        { status: 400 }
      );
    }

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

    // Validate if the user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Add participant (upsert to handle rejoining)
    const participant = await db.interviewGroupUser.upsert({
      where: {
        userId_groupId: { userId, groupId },
      },
      update: {
        name,
        email,
        imageUrl,
      },
      create: {
        userId,
        groupId,
        name: name || user.name,
        email: email || user.email,

        isReady: false,
        isAdmin: group.createdBy === userId,
        totalScore: 0,
        totalAnswers: 0,
      },
    });

    return NextResponse.json({ participant });
  } catch (error) {
    console.error("[ADD_INTERVIEW_PARTICIPANT]", error.message);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update participant readiness
export async function PATCH(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = params;
    const { isReady } = await req.json();

    if (typeof isReady !== "boolean") {
      return NextResponse.json(
        { error: "Invalid data. isReady must be a boolean" },
        { status: 400 }
      );
    }

    // Check if participant exists
    const existingParticipant = await db.interviewGroupUser.findUnique({
      where: {
        userId_groupId: { userId, groupId },
      },
    });

    if (!existingParticipant) {
      return NextResponse.json(
        { error: "You are not a participant in this interview group" },
        { status: 404 }
      );
    }

    // Update participant status
    const participant = await db.interviewGroupUser.update({
      where: {
        userId_groupId: { userId, groupId },
      },
      data: { isReady },
    });

    return NextResponse.json({ participant });
  } catch (error) {
    console.error("[UPDATE_INTERVIEW_PARTICIPANT]", error.message);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a participant
export async function DELETE(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = params;

    // Check if user is in the group
    const participant = await db.interviewGroupUser.findUnique({
      where: {
        userId_groupId: { userId, groupId },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // Delete participant
    await db.interviewGroupUser.delete({
      where: {
        userId_groupId: { userId, groupId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE_INTERVIEW_PARTICIPANT]", error.message);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
