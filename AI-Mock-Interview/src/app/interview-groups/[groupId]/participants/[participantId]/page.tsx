// app/interview-groups/[groupId]/participants/[participantId]/page.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Loader2, XCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Type definitions (same as in the previous component)
type Question = {
  id: string;
  text: string;
  correctAnswer: string;
  timeLimit: number;
  createdAt: string;
};

type Answer = {
  id: string;
  text: string;
  score: number | null;
  submittedAt: string;
  questionId: string;
  question: Question;
  feedback: any;
};

type Participant = {
  id: string;
  name: string | null;
  email: string | null;
  imageUrl: string | null;
  isAdmin: boolean;
  isReady: boolean;
  totalScore: number;
  totalAnswers: number;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    ProfileImage: string | null;
  } | null;
  Answer: Answer[];
};

export default function ParticipantDetailPage() {
  const { groupId, participantId } = useParams();
  const router = useRouter();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParticipantData = async () => {
      try {
        // Fetch participant data
        const participantResponse = await fetch(`/api/interview-groups/${groupId}/participants/${participantId}`);
        if (!participantResponse.ok) {
          throw new Error("Failed to fetch participant data");
        }
        const participantData = await participantResponse.json();
        setParticipant(participantData.participant);

        // Fetch all questions for this group
        const questionsResponse = await fetch(`/api/interview-groups/${groupId}/questions`);
        if (!questionsResponse.ok) {
          throw new Error("Failed to fetch questions");
        }
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData.questions);
      } catch (err) {
        setError("Failed to load participant data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipantData();
  }, [groupId, participantId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !participant) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-500">Error</h2>
              <p className="mt-2">{error || "Could not load participant data"}</p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate participant stats
  const totalQuestions = questions.length;
  const answeredQuestions = participant.Answer.length;
  const completionPercentage = (answeredQuestions / totalQuestions) * 100;
  const averageScore = participant.Answer.length > 0
    ? participant.Answer.reduce((sum, answer) => sum + (answer.score || 0), 0) / participant.Answer.length
    : 0;

  // Create a map of answers by question ID for easier lookup
  const answersByQuestionId = participant.Answer.reduce((acc, answer) => {
    acc[answer.questionId] = answer;
    return acc;
  }, {} as Record<string, Answer>);

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        className="mb-4 flex items-center"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Group
      </Button>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={participant.user?.ProfileImage || participant.imageUrl || undefined} />
                <AvatarFallback>
                  {(participant.user?.name || participant.name || "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {participant.user?.name || participant.name || "Unknown"}
                </CardTitle>
                <p className="text-gray-500">
                  {participant.user?.email || participant.email || "No email"}
                </p>
              </div>
            </div>
            {participant.isAdmin && (
              <Badge variant="secondary" className="text-sm">Admin</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Completion</h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {completionPercentage.toFixed(0)}%
                </span>
                <span className="text-sm text-gray-500">
                  {answeredQuestions} / {totalQuestions} questions
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Average Score</h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {averageScore.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">
                  out of 10
                </span>
              </div>
              <Progress
                value={averageScore * 10}
                className="h-2"
                indicator={averageScore > 7 ? "bg-green-500" : averageScore > 4 ? "bg-yellow-500" : "bg-red-500"}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Total Score</h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {participant.totalScore}
                </span>
                <span className="text-sm text-gray-500">
                  points
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-4 text-xl font-bold">Answers</h2>

      <div className="space-y-6">
        {questions.map((question, index) => {
          const answer = answersByQuestionId[question.id];

          return (
            <Card key={question.id} className={answer ? "border-l-4 border-l-blue-500" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-sm">
                      {index + 1}
                    </span>
                    Question
                  </CardTitle>
                  {answer && (
                    <Badge variant={answer.score && answer.score > 7 ? "success" : answer.score && answer.score > 4 ? "warning" : "destructive"}>
                      Score: {answer.score || 0}/10
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-gray-800">{question.text}</p>
                  </div>

                  {answer ? (
                    <>
                      <div className="rounded-lg bg-blue-50 p-4">
                        <h4 className="mb-2 font-medium text-blue-700">Participant's Answer</h4>
                        <p className="text-gray-800">{answer.text}</p>
                        <div className="mt-2 text-sm text-gray-500">
                          Submitted at {new Date(answer.submittedAt).toLocaleString()}
                        </div>
                      </div>

                      {answer.feedback && (
                        <div className="rounded-lg bg-yellow-50 p-4">
                          <h4 className="mb-2 font-medium text-yellow-700">Feedback</h4>
                          <pre className="whitespace-pre-wrap text-gray-800">{
                            typeof answer.feedback === 'string'
                              ? answer.feedback
                              : JSON.stringify(answer.feedback, null, 2)
                          }</pre>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6">
                      <div className="text-center text-gray-500">
                        <XCircle className="mx-auto h-8 w-8" />
                        <p className="mt-2">No answer submitted</p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg bg-green-50 p-4">
                    <h4 className="mb-2 font-medium text-green-700">Correct Answer</h4>
                    <p className="text-gray-800">{question.correctAnswer}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
