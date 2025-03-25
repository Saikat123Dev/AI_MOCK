// app/interview-groups/[groupId]/page.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tab } from "@headlessui/react";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Type definitions based on your schema
type Question = {
  id: string;
  text: string;
  correctAnswer: string;
  timeLimit: number;
  createdAt: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  ProfileImage: string | null;
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
  user: User | null;
  Answer: {
    id: string;
    text: string;
    score: number | null;
    submittedAt: string;
    questionId: string;
    question: Question;
  }[];
  completionPercentage?: number;
  averageScore?: number;
};

type InterviewGroup = {
  id: string;
  name: string;
  dateTime: string;
  role: string;
  timeLimit: number;
  skills: string[];
  questionNo: number;
  experience: string;
  difficulty: string;
  createdAt: string;
};

type GroupData = {
  group: InterviewGroup;
  questions: Question[];
  participants: Participant[];
};

// Participant Score Chart Component
const ParticipantScoresChart = ({ participants }) => {
  const [sortBy, setSortBy] = useState('score'); // 'score' or 'name'

  // Convert participants to chart data format
  const chartData = participants.map(participant => ({
    name: participant.user?.name || participant.name || 'Unknown',
    score: participant.totalScore,
    averageScore: participant.averageScore || 0,
    id: participant.id,
    completionPercentage: participant.completionPercentage || 0
  }));

  // Sort the data based on current sorting preference
  const sortedData = [...chartData].sort((a, b) => {
    if (sortBy === 'score') {
      return b.score - a.score;
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  // Generate a color based on the score (green for high, red for low)
  const getBarColor = (score) => {
    // Maximum possible score is unknown, so using relative coloring
    const maxScore = Math.max(...chartData.map(item => item.score));
    const percentage = maxScore ? score / maxScore : 0;

    // Color gradient from red to yellow to green
    if (percentage > 0.7) return '#22c55e'; // Green
    if (percentage > 0.4) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <div>

    <Card className="mb-8">

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Participant Total Scores</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy('name')}
              className={sortBy === 'name' ? 'bg-gray-100' : ''}
            >
              Sort by Name
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy('score')}
              className={sortBy === 'score' ? 'bg-gray-100' : ''}
            >
              Sort by Score
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              margin={{ top: 10, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                label={{ value: 'Total Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                formatter={(value, name, props) => {
                  if (name === 'score') {
                    return [`Score: ${value}`, ''];
                  }
                }}
                labelFormatter={(label) => `Participant: ${label}`}
              />
              <Bar dataKey="score" name="Total Score">
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

export default function InterviewGroupDashboard() {
  const { groupId } = useParams();
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const response = await fetch(`/api/interview-groups/${groupId}/fetchAnsFeedback`);
        if (!response.ok) {
          throw new Error("Failed to fetch group data");
        }
        const data = await response.json();
        setGroupData(data);
      } catch (err) {
        setError("Failed to load interview group data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !groupData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-500">Error</h2>
              <p className="mt-2">{error || "Could not load interview group data"}</p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate completion percentage for each participant
  const participantsWithStats = groupData.participants.map(participant => {
    const answeredQuestions = participant.Answer.length;
    const completionPercentage = (answeredQuestions / groupData.questions.length) * 100;
    const averageScore = participant.Answer.length > 0
      ? participant.Answer.reduce((sum, answer) => sum + (answer.score || 0), 0) / participant.Answer.length
      : 0;

    return {
      ...participant,
      completionPercentage,
      averageScore
    };
  });

  // Sort participants by completion percentage and then by average score
  const sortedParticipants = [...participantsWithStats].sort((a, b) => {
    if (b.completionPercentage !== a.completionPercentage) {
      return b.completionPercentage - a.completionPercentage;
    }
    return b.averageScore - a.averageScore;
  });

  return (
    <div className="container mx-auto py-8">

      <header className="mb-8">
        <h1 className="text-3xl font-bold">Interview Group: {groupData.group.name}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline" className="text-sm">
            Role: {groupData.group.role}
          </Badge>
          <Badge variant="outline" className="text-sm">
            Difficulty: {groupData.group.difficulty}
          </Badge>
          <Badge variant="outline" className="text-sm">
            Experience: {groupData.group.experience}
          </Badge>
          <Badge variant="outline" className="text-sm">
            Questions: {groupData.questions.length}
          </Badge>
          <Badge variant="outline" className="text-sm">
            Time Limit: {groupData.group.timeLimit}s
          </Badge>
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Created on{" "}
            {new Date(groupData.group.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </header>

      {/* New Chart Section */}
      <ParticipantScoresChart participants={participantsWithStats} />

      <Tab.Group>
        <Tab.List className="mb-4 flex space-x-1 rounded-xl bg-gray-100 p-1">
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
              selected
                ? "bg-white shadow"
                : "text-gray-600 hover:bg-white/[0.12] hover:text-blue-600"
            }`
          }>
            Participants
          </Tab>
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
              selected
                ? "bg-white shadow"
                : "text-gray-600 hover:bg-white/[0.12] hover:text-blue-600"
            }`
          }>
            Questions
          </Tab>
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
              selected
                ? "bg-white shadow"
                : "text-gray-600 hover:bg-white/[0.12] hover:text-blue-600"
            }`
          }>
            Results
          </Tab>
        </Tab.List>
        <Tab.Panels>
          {/* Participants Panel */}
          <Tab.Panel>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedParticipants.map((participant) => (
                <Card key={participant.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={participant.user?.ProfileImage || participant.imageUrl || undefined} />
                          <AvatarFallback>
                            {(participant.user?.name || participant.name || "?").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {participant.user?.name || participant.name || "Unknown"}
                          </CardTitle>
                          <p className="text-sm text-gray-500">
                            {participant.user?.email || participant.email || "No email"}
                          </p>
                        </div>
                      </div>
                      {participant.isAdmin && (
                        <Badge variant="secondary">Admin</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Completion</span>
                        <span className="text-sm font-medium">
                          {participant.completionPercentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={participant.completionPercentage} className="h-2" />

                      <div className="flex justify-between pt-2">
                        <span className="text-sm text-gray-500">Average Score</span>
                        <span className="text-sm font-medium">
                          {participant.averageScore.toFixed(1)}
                        </span>
                      </div>
                      <Progress
                        value={participant.averageScore * 10}
                        className="h-2"
                        indicator={participant.averageScore > 7 ? "bg-green-500" : participant.averageScore > 4 ? "bg-yellow-500" : "bg-red-500"}
                      />

                      <div className="pt-2 text-sm">
                        <span className="font-medium">
                          {participant.Answer.length} / {groupData.questions.length} questions answered
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Tab.Panel>

          {/* Questions Panel */}
          <Tab.Panel>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead className="w-24 text-right">Time Limit</TableHead>
                      <TableHead className="w-24 text-right">Answers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupData.questions.map((question, index) => {
                      const answersCount = groupData.participants.reduce(
                        (count, participant) =>
                          count +
                          participant.Answer.filter(
                            (a) => a.questionId === question.id
                          ).length,
                        0
                      );

                      return (
                        <TableRow key={question.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div className="line-clamp-2">{question.text}</div>
                          </TableCell>
                          <TableCell className="text-right">{question.timeLimit}s</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={answersCount === 0 ? "outline" : "default"}>
                              {answersCount} / {groupData.participants.length}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Tab.Panel>

          {/* Results Panel */}
          <Tab.Panel>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Rank</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead className="text-center">Completion</TableHead>
                      <TableHead className="text-center">Avg. Score</TableHead>
                      <TableHead className="text-center">Total Score</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedParticipants.map((participant, index) => (
                      <TableRow key={participant.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={participant.user?.ProfileImage || participant.imageUrl || undefined} />
                              <AvatarFallback>
                                {(participant.user?.name || participant.name || "?").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {participant.user?.name || participant.name || "Unknown"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {participant.user?.email || participant.email || "No email"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-medium">
                              {participant.completionPercentage.toFixed(0)}%
                            </span>
                            <Progress
                              value={participant.completionPercentage}
                              className="h-2 w-24"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {participant.averageScore.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-center">
                          {participant.totalScore}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              router.push(`/interview-groups/${groupId}/participants/${participant.id}`);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
