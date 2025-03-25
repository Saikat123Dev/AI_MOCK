import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // console.log('Received request body:', body);

    const { jobDesc, jobPosition, jobexperience, MockResponse,numQuestions,difficultyLevel,interviewerImageId } = body;

    // Check if mockResponse is an array of strings
    console.log("sahil pod",jobDesc,jobPosition,jobexperience,MockResponse)
    if (!jobDesc || !jobPosition || !jobexperience || !MockResponse) {
      return NextResponse.json(
        { error: 'Missing or invalid fields in request. Ensure all fields are provided and mockResponse is an array of strings.' },
        { status: 400 }
      );
    }

    const user = await currentUser ();
    if (!user) {

      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const newMockInterview = await db.mockInterview.create({
      data: {
        jobDesc,
        jobPosition,
        jobexperience,
        numQuestions,
        difficultyLevel,
        interviewerImageId,
        MockResponse:MockResponse.interviewQuestions,
        userId: user.id,
      },
    });
    console.log("akash maity love",newMockInterview);
    return NextResponse.json(newMockInterview);
  } catch (error: any) {
    console.error('Error saving mock interview:', error.message || error);
    return NextResponse.json(
      { error: 'Failed to save mock interview' },
      { status: 500 }
    );
  }
}
