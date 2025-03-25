import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
    const group = await db.interviewGroup.findUnique({
      where: { id: groupId },
      include: {
        InterviewGroupUser: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Interview group not found" },
        { status: 404 }
      );
    }

    if (group.createdBy !== userId) {
      return NextResponse.json(
        { error: "Only the creator can start the interview" },
        { status: 403 }
      );
    }

    const allReady = group.InterviewGroupUser.every((user) => user.isReady);
    if (!allReady) {
      return NextResponse.json(
        { error: "All participants must be ready to start the interview" },
        { status: 400 }
      );
    }

    // Generate questions and check if we got an array back
    const questionsResult = await generateInterviewQuestions(
      group.difficulty,
      group.role,
      group.skills,
      group.questionNo,
      group.experience,
      group.timeLimit
    );

    // Handle error response from the generator function
    if (!Array.isArray(questionsResult)) {
      return NextResponse.json(
        { error: questionsResult.error || "Failed to generate questions", details: questionsResult.details },
        { status: questionsResult.status || 500 }
      );
    }

    // Only proceed with database operations if we have valid questions
    for (const question of questionsResult) {
      await db.question.create({
        data: {
          groupId: group.id,
          text: question.text,
          correctAnswer: question.correctAnswer,
          timeLimit: question.timeLimit
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Questions created successfully",
        // redirectUrl: `/interview-battle/${group.id}/session`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error starting interview:", error);
    return NextResponse.json(
      { error: "Failed to start interview", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function generateInterviewQuestions(
  difficulty: string,
  role: string,
  skills: string[],
  questionNo: number,
  experience: string,
  timeLimit: number // timeLimit is now in minutes
) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Google AI API key not found");
    }

    // Convert timeLimit from minutes to seconds for internal calculations
    const timeLimitSeconds = timeLimit * 60;

    // Import and initialize the Generative AI model
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);

    // Use the correct model identifier for Gemini Pro
    // NOTE: Check the latest documentation for the correct model name
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create prompt for generating interview questions with dynamic time allocation
    const prompt = `Create a set of ${questionNo} technical interview questions for a ${role} position focused on ${skills.join(", ")} with ${difficulty} difficulty level (${experience} years of experience expected).

The ENTIRE interview must fit within a total time limit of ${timeLimit} minutes.

Important requirements:
- Do NOT create multiple-choice questions. All questions should require written responses or coding solutions.
- Create open-ended questions that test deeper understanding and problem-solving abilities.
- Questions should require candidates to explain concepts, solve problems, or write code.

Each question should:
1. Test practical knowledge relevant to real-world scenarios a ${role} would encounter
2. Include at least one question that tests problem-solving abilities
3. Cover different aspects of ${skills.join(", ")} to provide a comprehensive assessment
4. Match the difficulty level (${difficulty}) appropriate for someone with ${experience} experience
5. Include a mix of conceptual understanding and practical application

Distribution of questions by difficulty:
- For "easy" interviews: 60% easy questions, 30% medium questions, 10% hard questions
- For "medium" interviews: 30% easy questions, 50% medium questions, 20% hard questions
- For "hard" interviews: 10% easy questions, 40% medium questions, 50% hard questions

Time allocation (IMPORTANT - total must equal exactly ${timeLimit} minutes):
- Allocate time proportionally to question difficulty
- If the interview has more questions, reduce individual question times while maintaining these proportions
- Ensure the sum of all question time limits equals EXACTLY ${timeLimit} minutes when converted to seconds

For each question, provide:
1. A detailed question text with clear instructions and context
2. A comprehensive correct answer that demonstrates mastery of the topic
3. Time limit in seconds based on the above allocation (must sum to exactly ${timeLimitSeconds} seconds)
4. Difficulty rating (1-3 for easy, 4-7 for medium, 8-10 for hard) as a numeric value
5. Expected skills being tested by the question (must be selected from: ${skills.join(", ")})
6. Common mistakes or misconceptions candidates might have
7. A "maxScore" field set to: 50 for easy questions, 75 for medium questions, 100 for hard questions

Format your response as JSON:
[
  {
    "text": "detailed question text with necessary context and clear instructions...",
    "correctAnswer": "comprehensive correct answer with explanations and best practices...",
    "timeLimit": number_of_seconds,
    "difficulty": numeric_rating_1_to_10,
    "skills": ["specific skill being tested"],
    "commonMistakes": ["typical error 1", "misconception 2"]
  },
  ...and so on for all ${questionNo} questions
]

Ensure:
- NO multiple-choice questions - all questions should be open-ended
- Questions are free from ambiguity
- Questions are properly scoped for their allocated time
- Questions progress from easier to more difficult throughout the set
- Questions test both theoretical knowledge and practical application
- Questions are designed to reveal the candidate's depth of understanding
- The sum of all timeLimit values MUST equal exactly ${timeLimitSeconds} seconds
- Skills listed for each question MUST be from the provided skills list`;

    // Generate content with temperature setting for more controlled output
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
      }
    });

    const response = await result.response;
    const responseText = response.text();

    // Extract the JSON from the response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not extract valid JSON from the AI response");
    }

    // Parse the JSON
    const questions = JSON.parse(jsonMatch[0]);

    // Validate the response
    validateQuestions(questions, questionNo, timeLimitSeconds, skills);

    return questions;
  } catch (error) {
    console.error("Error generating interview questions:", error);

    if (error instanceof SyntaxError) {
      console.error("JSON parsing error - invalid format received from AI");
    }

    // Return a more informative error
    return {
      error: "Failed to generate interview questions",
      details: error instanceof Error ? error.message : "Unknown error",
      status: 500
    };
  }
}

// Helper function to validate generated questions and fix common issues
function validateQuestions(questions, questionNo, timeLimitSeconds, skills) {
  // Check if we got the expected number of questions
  if (questions.length !== questionNo) {
    console.warn(`Expected ${questionNo} questions but received ${questions.length}`);
  }

  // Check for and filter out any multiple-choice questions
  for (let i = 0; i < questions.length; i++) {
    const questionText = questions[i].text.toLowerCase();
    if (
      questionText.includes("select one") ||
      questionText.includes("choose the") ||
      questionText.includes("which of the following") ||
      (questionText.match(/a\)\s|b\)\s|c\)\s|d\)\s/g) || []).length >= 2
    ) {
      console.warn(`Question ${i+1} appears to be multiple-choice. Flagging for review.`);
      // We don't remove it but flag it in case it needs manual review
      questions[i].needsReview = true;
    }
  }

  // Calculate total time allocated
  const totalTime = questions.reduce((sum, q) => sum + q.timeLimit, 0);

  // Check if total time matches expected timeLimit
  if (totalTime !== timeLimitSeconds) {
    console.warn(`Time allocation mismatch: expected ${timeLimitSeconds}s, got ${totalTime}s`);

    // Adjust time limits proportionally to match the expected total
    const factor = timeLimitSeconds / totalTime;
    let adjustedTotal = 0;

    // First-pass adjustment (might leave 1-2 seconds difference due to rounding)
    for (let i = 0; i < questions.length; i++) {
      if (i === questions.length - 1) {
        // For the last question, ensure we hit the exact total
        questions[i].timeLimit = timeLimitSeconds - adjustedTotal;
      } else {
        // For other questions, apply the proportional adjustment
        questions[i].timeLimit = Math.round(questions[i].timeLimit * factor);
        adjustedTotal += questions[i].timeLimit;
      }
    }
  }

  // Validate skills match the provided list
  questions.forEach(q => {
    if (q.skills) {
      q.skills = q.skills.filter(skill =>
        skills.some(s => s.toLowerCase() === skill.toLowerCase()));

      // If no valid skills remain, assign the first available skill
      if (q.skills.length === 0) {
        q.skills = [skills[0]];
      }
    } else {
      q.skills = [skills[0]];
    }

    // Ensure maxScore is set correctly based on difficulty
    if (!q.maxScore || typeof q.maxScore !== 'number') {
      if (q.difficulty <= 3) q.maxScore = 50;      // Easy
      else if (q.difficulty <= 7) q.maxScore = 75; // Medium
      else q.maxScore = 100;                       // Hard
    }
  });

  return questions;
}
