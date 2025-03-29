import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Enum for Question Types
enum QuestionType {
  MAIN = "MAIN",
  FOLLOWUP = "FOLLOWUP"
}

// Utility Functions
function safeError(error: unknown) {
  return {
    message: error instanceof Error ? error.message : String(error || 'Unknown error'),
    stack: error instanceof Error ? error.stack : undefined
  };
}

// Configuration Constants
const CONFIG = {
  AI_MODEL: "gemini-1.5-flash",
  FOLLOWUP_THRESHOLD: 0.7,
  DEFAULT_MAX_SCORE: 10,
  DEFAULT_FOLLOWUP_SCORE_RATIO: 0.5,
  DEFAULT_FOLLOWUP_TIME_RATIO: 0.75
};

// AI Analysis Service
class AIAnalysisService {
  private model: any;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    if (!apiKey) {
      throw new Error("Gemini API key is not configured");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: CONFIG.AI_MODEL });
  }

  async analyzeAnswer(params: {
    question: string,
    answer: string,
    maxScore?: number,
    additionalContext?: string
  }) {
    const {
      question,
      answer,
      maxScore = CONFIG.DEFAULT_MAX_SCORE,
      additionalContext = ''
    } = params;

    try {
      const analysisPrompt = `Analyze this interview answer:
Question: ${question}
${additionalContext ? `Context: ${additionalContext}` : ''}
Candidate's Answer: ${answer}

Provide a detailed evaluation with:
- Numerical Score (out of ${maxScore})
- Concise, Constructive Feedback
- Key Points Covered
- Strengths and Areas of Improvement`;

      const result = await this.model.generateContent(analysisPrompt);
      return result.response.text();
    } catch (error) {
      console.error("AI analysis error:", safeError(error));
      return null;
    }
  }

  async generateFollowUpQuestion(params: {
    mainQuestion: string,
    answer: string,
    context?: string
  }) {
    const { mainQuestion, answer, context = '' } = params;

    try {
      const followUpPrompt = `Create an insightful follow-up question based on:
Original Question: ${mainQuestion}
Candidate's Answer: ${answer}
${context ? `Additional Context: ${context}` : ''}

Guidelines:
- Make the question specific and probing
- Focus on deeper understanding
- Encourage more detailed explanation`;

      const result = await this.model.generateContent(followUpPrompt);
      return result.response.text();
    } catch (error) {
      console.error("Follow-up question generation error:", safeError(error));
      return null;
    }
  }
}

// Analysis Parser
function parseAnalysisResponse(
  analysisText: string | null,
  maxScore: number = CONFIG.DEFAULT_MAX_SCORE
): {
  score: number;
  evaluationFeedback: string;
  matchedKeyPoints: string[];
  voiceTone?: string | null;
  confidence?: string | null;
} {
  if (!analysisText) {
    return {
      score: Math.floor(maxScore / 2),
      evaluationFeedback: 'Unable to generate detailed analysis.',
      matchedKeyPoints: [],
      voiceTone: null,
      confidence: null
    };
  }

  // Regex patterns for extraction
  const extractors = [
    { key: 'score', regex: /Score:\s*(\d+)/i },
    { key: 'evaluationFeedback', regex: /Feedback:\s*([^-]+)/i },
    { key: 'matchedKeyPoints', regex: /Key Points:\s*([^\n]+)/i },
    { key: 'voiceTone', regex: /Voice Tone:\s*([^\n]+)/i },
    { key: 'confidence', regex: /Confidence:\s*([^\n]+)/i }
  ];

  const result: any = {
    score: Math.floor(maxScore / 2),
    evaluationFeedback: 'No specific feedback provided.',
    matchedKeyPoints: [],
    voiceTone: null,
    confidence: null
  };

  extractors.forEach(({ key, regex }) => {
    const match = analysisText.match(regex);
    if (match && match[1]) {
      if (key === 'matchedKeyPoints') {
        result[key] = match[1]
          .split(/,|\n/)
          .map(point => point.trim())
          .filter(Boolean);
      } else if (key === 'score') {
        const parsedScore = parseInt(match[1], 10);
        result[key] = Math.min(parsedScore, maxScore);
      } else {
        result[key] = match[1].trim();
      }
    }
  });

  return result;
}

// Main Interview Handler
export class HRInterviewHandler {
  private aiService: AIAnalysisService;

  constructor() {
    this.aiService = new AIAnalysisService();
  }

  async processMainQuestion(req: NextRequest) {
    try {
      // Authentication
      const authResult = await auth();
      const userId = authResult?.userId;
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Parse request body
      const body = await req.json();
      const { hrQuestionId, userAnswer, videoUrl } = body;
      console.log("hrQuestionId", hrQuestionId);
      if (!hrQuestionId || !userAnswer) {
        return NextResponse.json({
          error: "Missing required fields",
          details: "hrQuestionId and userAnswer are required"
        }, { status: 400 });
      }

      // Fetch question with related data
      const hrQuestion = await db.hRQuestion.findUnique({
        where: { id: hrQuestionId },
        include: {
          hrInterview: true,
          followUpQuestions: true,
          userAnswer: true
        }
      });

      if (!hrQuestion) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 });
      }

      // Perform AI Analysis
      const analysisText = await this.aiService.analyzeAnswer({
        question: hrQuestion.text,
        answer: userAnswer,
        maxScore: hrQuestion.maxScore,
        additionalContext: hrQuestion.hrInterview?.jobDescription
      });

      // Parse AI Analysis
      const analysis = parseAnalysisResponse(
        analysisText,
        hrQuestion.maxScore || CONFIG.DEFAULT_MAX_SCORE
      );

      // Save/Update User Answer
      let hrUserAnswer;
      try {
        // Attempt to update or create answer
        console.log("hrQuestionId", hrQuestionId);
        console.log("userId", userId);
       const  already = await db.hRUserAnswer.findFirst({
          where: {

              hrQuestionId,
              userId

          }
        });
        if(already){
          console.log("already", already);
        }

         hrUserAnswer = await db.hRUserAnswer.create({
          data: {
            hrQuestionId,
            userId,
            userAnswer,
            videoUrl: videoUrl ?? null, // Ensures `null` if `videoUrl` is undefined
            ...analysis, // Spreads `analysis` object safely
          },
        });

      } catch (error) {
        console.error("Answer saving error:", safeError(error));
        return NextResponse.json({
          error: "Failed to save answer",
          details: safeError(error).message
        }, { status: 500 });
      }

      // Determine Follow-up Eligibility
      const scoreRatio = analysis.score / (hrQuestion.maxScore || CONFIG.DEFAULT_MAX_SCORE);
      const isEligibleForFollowUp = scoreRatio >= CONFIG.FOLLOWUP_THRESHOLD;
      let nextQuestion = null;

      if (isEligibleForFollowUp) {
        // Prefer existing follow-up questions
        if (hrQuestion.followUpQuestions.length > 0) {
          nextQuestion = hrQuestion.followUpQuestions[0];
        } else {
          // Generate new follow-up question
          const generatedFollowUpText = await this.aiService.generateFollowUpQuestion({
            mainQuestion: hrQuestion.text,
            answer: userAnswer,
            context: hrQuestion.hrInterview?.jobDescription
          });

          if (generatedFollowUpText) {
            nextQuestion = await db.hRFollowUpQuestion.create({
              data: {
                mainQuestionId: hrQuestionId,
                text: generatedFollowUpText,
                type: QuestionType.FOLLOWUP,
                category: hrQuestion.category,
                maxScore: Math.floor((hrQuestion.maxScore || CONFIG.DEFAULT_MAX_SCORE) * CONFIG.DEFAULT_FOLLOWUP_SCORE_RATIO)
              }
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        hrUserAnswer,
        analysis,
        nextQuestion,
        isEligibleForFollowUp
      }, { status: 200 });

    } catch (error) {
      console.error("Main question processing error:", safeError(error));
      return NextResponse.json({
        error: "An unexpected error occurred",
        details: safeError(error).message
      }, { status: 500 });
    }
  }

  async processFollowUpQuestion(req: NextRequest) {
    try {
      // Authentication
      const authResult = await auth();
      const userId = authResult?.userId;
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Parse request body
      const body = await req.json();
      const { followUpQuestionId, userAnswer, videoUrl } = body;

      if (!followUpQuestionId || !userAnswer) {
        return NextResponse.json({
          error: "Missing required fields",
          details: "followUpQuestionId and userAnswer are required"
        }, { status: 400 });
      }

      // Fetch follow-up question
      const followUpQuestion = await db.hRFollowUpQuestion.findUnique({
        where: { id: followUpQuestionId },
        include: {
          mainQuestion: {
            include: { hrInterview: true }
          }
        }
      });

      if (!followUpQuestion) {
        return NextResponse.json({ error: "Follow-up question not found" }, { status: 404 });
      }

      // Perform AI Analysis
      const analysisText = await this.aiService.analyzeAnswer({
        question: followUpQuestion.text,
        answer: userAnswer,
        maxScore: followUpQuestion.maxScore,
        additionalContext: followUpQuestion.mainQuestion.hrInterview?.jobDescription
      });

      // Parse AI Analysis
      const analysis = parseAnalysisResponse(
        analysisText,
        followUpQuestion.maxScore || CONFIG.DEFAULT_MAX_SCORE
      );

      // Save Follow-up Answer
      let hrUserAnswer;
      try {
        hrUserAnswer = await db.hRUserAnswer.upsert({
          where: {
            hrFollowUpQuestionId_userId: {
              hrFollowUpQuestionId: followUpQuestionId,
              userId
            }
          },
          update: {
            userAnswer,
            videoUrl: videoUrl || undefined,
            ...analysis
          },
          create: {
            hrFollowUpQuestionId: followUpQuestionId,
            userId,
            userAnswer,
            videoUrl: videoUrl || null,
            ...analysis
          }
        });
      } catch (error) {
        console.error("Follow-up answer saving error:", safeError(error));
        return NextResponse.json({
          error: "Failed to save follow-up answer",
          details: safeError(error).message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        hrUserAnswer,
        analysis
      }, { status: 200 });

    } catch (error) {
      console.error("Follow-up question processing error:", safeError(error));
      return NextResponse.json({
        error: "An unexpected error occurred",
        details: safeError(error).message
      }, { status: 500 });
    }
  }
}

// Route Handlers
const handler = new HRInterviewHandler();

export async function POST(req: NextRequest) {
  return handler.processMainQuestion(req);
}

export async function PUT(req: NextRequest) {
  return handler.processFollowUpQuestion(req);
}
