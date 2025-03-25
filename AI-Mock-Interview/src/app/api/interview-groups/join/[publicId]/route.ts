import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { publicId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const group = await db.interviewGroup.findUnique({
      where: { publicId: params.publicId },
      include: { InterviewGroupUser: true },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ group }, { status: 200 });
  } catch (error) {
    console.error('Error fetching interview group by public ID:', error);
    return NextResponse.json({ error: 'Failed to fetch interview group' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { publicId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const group = await db.interviewGroup.findUnique({
      where: { publicId: params.publicId },
      include: { InterviewGroupUser: true },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is already in the group
    const existingUser = group.InterviewGroupUser.find(u => u.userId === userId);
    if (existingUser) {
      return NextResponse.json({ group }, { status: 200 });
    }

    // Add user to the group
    await db.interviewGroupUser.create({
      data: {
        groupId: group.id,
        userId,
        isReady: false,
      },
    });

    return NextResponse.json({ group }, { status: 200 });
  } catch (error) {
    console.error('Error joining interview group:', error);
    return NextResponse.json({ error: 'Failed to join interview group' }, { status: 500 });
  }
}
