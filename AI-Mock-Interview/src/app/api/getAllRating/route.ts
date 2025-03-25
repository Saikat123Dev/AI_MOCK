import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const userId = url.searchParams.get("userId");
  console.log("userId:", userId);

  try {
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Invalid or missing userId" }, { status: 400 });
    }

    const ratings = await db.mockInterview.findMany({
      where: {
        userId: userId,
      },
      select: {
        jobPosition: true,
        answers: true,
      },
    });

    // Filter out records with empty answers
    const filteredRatings = ratings.filter(rating => {
      // Check if answers array exists and is not empty
      return rating.answers &&
             Array.isArray(rating.answers) &&
             rating.answers.length > 0;
    });

    console.log("Filtered ratings:", filteredRatings);
    return NextResponse.json({ ratings: filteredRatings }, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
