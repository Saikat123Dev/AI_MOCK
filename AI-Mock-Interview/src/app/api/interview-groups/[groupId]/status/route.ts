import { db } from '@/lib/db'; // Your Prisma client
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const groupId = params.groupId;

  if (!groupId) {
    return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
  }

  try {
    // Fetch the interview group with its current state
    const interviewGroup = await db.interviewGroup.findUnique({
      where: { id: groupId },
      select: {
        isStarted: true,
      }
    });

    if (!interviewGroup) {
      return NextResponse.json({ error: 'Interview group not found' }, { status: 404 });
    }

    // Return the current interview status
    return NextResponse.json({
      inProgress: interviewGroup.isStarted,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching interview status:', error);
    return NextResponse.json({ error: 'Failed to fetch interview status' }, { status: 500 });
  }
}
