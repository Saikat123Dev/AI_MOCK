import { db } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    // Get the current user
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get data from the request body
    const { questionId, userAnswer, groupId } = await req.json();
    console.log("questionId", questionId);
    console.log("userAnswer", userAnswer);

    // Validate the required fields
    if (!questionId || !userAnswer) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Get the question from the database
    const question = await db.question.findUnique({
      where: {
        id: questionId
      },
      include: {
        group: true
      }
    });

    if (!question) {
      return new NextResponse("Question not found", { status: 404 });
    }

    // Get the interview group user
    const interviewGroupUser = await db.interviewGroupUser.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: question.groupId
        }
      }
    });

    if (!interviewGroupUser) {
      return new NextResponse("User not in this interview group", { status: 403 });
    }

    const existingAnswer = await db.answer.findUnique({
      where: {
        questionId_participantId: {
          questionId: questionId,
          participantId: interviewGroupUser.id
        }
      }
    });
    console.log("existingAnswer", existingAnswer);

    if (existingAnswer) {
      return NextResponse.json({
        success: false,
        message: "You have already answered this question",
        existingAnswer
      }, { status: 409 }); // 409 Conflict status code
    }
    // Generate the prompt for Gemini API with stricter JSON formatting instructions
    const prompt = `
      You are an expert interviewer analyzing a candidate's answer.
      Question: ${question.text}
      Expected Answer: ${question.correctAnswer}
      Candidate's Answer: ${userAnswer}

      Please analyze the candidate's answer based on the following criteria:
      1. Accuracy - How well does the answer match the expected answer?
      2. Completeness - Did the candidate cover all key points?
      3. Clarity - Is the answer clear and well-structured?

      Provide a score from 0-10 and detailed feedback.

      IMPORTANT: You must respond with ONLY a valid JSON object using this exact format:
      {
        "score": number,
        "feedback": {
          "strengths": ["strength1", "strength2"],
          "weaknesses": ["weakness1", "weakness2"],
          "improvement": "suggestion"
        }
      }
      DO NOT include any explanation or additional text before or after the JSON.
    `;

    // Call Gemini API for analysis
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Advanced parsing strategy with multiple fallbacks
    let analysis;

    // First attempt: Direct JSON parsing
    try {
      analysis = JSON.parse(text);
    } catch (error) {
      console.log("Direct JSON parsing failed. Attempting regex extraction...");

      // Second attempt: Extract JSON using regex
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0]);
        } catch (error) {
          console.log("Regex JSON extraction failed. Using fallback structure...");

          // Fallback to default structure
          analysis = {
            score: 5,
            feedback: {
              strengths: ["The candidate provided an answer"],
              weaknesses: ["Unable to properly analyze the response format"],
              improvement: "The system had trouble analyzing this response. Please provide a clearer answer."
            }
          };
        }
      } else {
        // No JSON-like structure found, use fallback
        console.log("No JSON structure found. Using fallback...");
        analysis = {
          score: 5,
          feedback: {
            strengths: ["The candidate provided an answer"],
            weaknesses: ["Unable to analyze response properly"],
            improvement: "Please try again with a clearer response"
          }
        };
      }
    }

    // Validate analysis structure
    if (!analysis.score || !analysis.feedback ||
        !analysis.feedback.strengths || !analysis.feedback.weaknesses ||
        !analysis.feedback.improvement) {
      console.log("Invalid analysis structure. Using fallback...");
      analysis = {
        score: analysis.score || 5,
        feedback: {
          strengths: Array.isArray(analysis.feedback?.strengths) ? analysis.feedback.strengths : ["The candidate provided an answer"],
          weaknesses: Array.isArray(analysis.feedback?.weaknesses) ? analysis.feedback.weaknesses : ["Analysis incomplete"],
          improvement: analysis.feedback?.improvement || "Please try again with a more structured response"
        }
      };
    }

    // Ensure score is within range 0-10
    analysis.score = Math.min(Math.max(Number(analysis.score) || 5, 0), 10);

    // Store the answer and analysis in the database
    const answer = await db.answer.create({
      data: {
        questionId,
        participantId: interviewGroupUser.id,
        userId: user.id,
        text: userAnswer,
        score: analysis.score,
        feedback: analysis.feedback
      }
    });

    // Update the participant's total score and answers count
 const userScore =   await db.interviewGroupUser.update({
      where: {
        id: interviewGroupUser.id
      },
      data: {
        totalScore: {
          increment: analysis.score
        },
        totalAnswers: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      answer,
      analysis,
      userScore
    });
  } catch (error) {
    console.error("[ANSWER_ANALYSIS_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
