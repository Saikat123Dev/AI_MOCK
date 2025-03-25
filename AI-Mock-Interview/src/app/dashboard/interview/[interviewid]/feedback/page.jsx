"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronsUpDown,
  Star,
  Video,
  BarChart2,
  Mic,
  Smile,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

function Feedback() {
  const router = useRouter();
  const { interviewid } = useParams();
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    const getFeedback = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/mock/${interviewid}/feedback`);
        if (!response.ok) {
          throw new Error("Failed to fetch interview details");
        }
        const data = await response.json();
        console.log("data", data);
        setFeedbackList(data);

        
        if (data.length > 0) {
          const validRatings = data.filter(
            (item) =>
              item.Intervieweerating && !isNaN(parseInt(item.Intervieweerating))
          );
          if (validRatings.length > 0) {
            const avgRating =
              validRatings.reduce(
                (sum, item) => sum + parseInt(item.Intervieweerating),
                0
              ) / validRatings.length;
            setOverallScore(Math.round(avgRating * 10) / 10);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    getFeedback();
  }, [interviewid]);

  const renderStars = (rating) => {
    const numRating = parseInt(rating);
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < numRating
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-gray-700">{numRating}/5</span>
      </div>
    );
  };

  const renderFeedbackCategory = (title, content, icon, colorClass) => {
    return (
      <div className={`p-4 ${colorClass} rounded-lg mb-3`}>
        <div className="flex items-center mb-2">
          {icon}
          <h3 className="font-semibold ml-2">{title}</h3>
        </div>
        <p className="text-gray-700">{content}</p>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-4 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-violet-600 mb-4">
          Interview Feedback
        </h1>

        {loading ? (
          <div className="py-10 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your feedback...</p>
          </div>
        ) : feedbackList.length > 0 ? (
          <>
            <div className="bg-gradient-to-r from-violet-50 to-blue-50 border-l-4 border-violet-400 p-4 rounded-lg mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <p className="text-lg font-semibold text-violet-800 mb-2 md:mb-0">
                  Overall Interview Rating
                </p>
                <div className="flex items-center">
                  <div className="mr-4">
                    <Progress
                      value={overallScore * 20}
                      className="h-2 w-32 bg-gray-200"
                    />
                  </div>
                  <span className="font-bold text-2xl text-violet-600">
                    {overallScore}/5
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                Interview Questions & Answers
              </h2>

              {feedbackList.map((item, index) => (
                <Collapsible
                  key={index}
                  className="mb-6 border border-gray-200 rounded-lg overflow-hidden"
                >
                  <CollapsibleTrigger className="flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition w-full text-left">
                    <div className="flex items-center">
                      <div className="bg-violet-100 text-violet-800 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-800">
                        {item.question}
                      </span>
                    </div>
                    <div className="flex items-center">
                      {item.Intervieweerating && (
                        <div className="hidden md:flex mr-4">
                          {renderStars(item.Intervieweerating)}
                        </div>
                      )}
                      <ChevronsUpDown className="w-5 h-5 text-gray-500" />
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="p-4 border-t border-gray-200">
                      <Tabs defaultValue="video">
                        <TabsList className="mb-4">
                          <TabsTrigger
                            value="video"
                            className="flex items-center"
                          >
                            <Video className="w-4 h-4 mr-1" /> Video Response
                          </TabsTrigger>
                          <TabsTrigger
                            value="feedback"
                            className="flex items-center"
                          >
                            <BarChart2 className="w-4 h-4 mr-1" /> Detailed
                            Feedback
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="video" className="mt-2">
                          <div className="bg-gray-900 rounded-lg overflow-hidden">
                            {item.videoUrl ? (
                              <video
                                src={item.videoUrl}
                                controls
                                className="w-full max-h-96 object-contain"
                                poster="/api/placeholder/640/360"
                              />
                            ) : (
                              <div className="h-48 flex items-center justify-center text-gray-400">
                                <p>No video available</p>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="font-medium text-gray-800 mb-2">
                              Your Answer:
                            </p>
                            <p className="text-gray-700">
                              {item.userAnswer || "No answer recorded"}
                            </p>
                          </div>
                        </TabsContent>

                        <TabsContent
                          value="feedback"
                          className="space-y-4 mt-2"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              {item.Intervieweefeedback &&
                                renderFeedbackCategory(
                                  "Feedback on Your Answer",
                                  item.Intervieweefeedback,
                                  <User className="w-5 h-5 text-blue-600" />,
                                  "bg-blue-50 border border-blue-200"
                                )}

                              {item.correctAnswer &&
                                renderFeedbackCategory(
                                  "Suggested Better Answer",
                                  item.correctAnswer,
                                  <Star className="w-5 h-5 text-green-600" />,
                                  "bg-green-50 border border-green-200"
                                )}
                              {item.speakingPace &&
                                renderFeedbackCategory(
                                  "Speaking Pace",
                                  item.speakingPace,
                                  <Mic className="w-5 h-5 text-indigo-600" />,
                                  "bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm transition hover:shadow-md"
                                )}
                            </div>

                            <div>
                              {item.voiceTone &&
                                renderFeedbackCategory(
                                  "Voice Tone",
                                  item.voiceTone,
                                  <Mic className="w-5 h-5 text-purple-600" />,
                                  "bg-purple-50 border border-purple-200"
                                )}

                              {item.bodyLanguage &&
                                renderFeedbackCategory(
                                  "Body Language",
                                  item.bodyLanguage,
                                  <User className="w-5 h-5 text-orange-600" />,
                                  "bg-orange-50 border border-orange-200"
                                )}

                              {item.facialExpressions &&
                                renderFeedbackCategory(
                                  "Facial Expressions",
                                  item.facialExpressions,
                                  <Smile className="w-5 h-5 text-yellow-600" />,
                                  "bg-yellow-50 border border-yellow-200"
                                )}
                              {item.confidence &&
                                renderFeedbackCategory(
                                  "Confidence Level",
                                  item.confidence,
                                  <User className="w-5 h-5 text-emerald-600" />,
                                  "bg-emerald-50 border border-emerald-200 rounded-lg shadow-sm transition hover:shadow-md"
                                )}
                            </div>
                          </div>
                          {item.overallPresentation &&
                            renderFeedbackCategory(
                              "Overall Presentation",
                              item.overallPresentation,
                              <BarChart2 className="w-5 h-5 text-rose-600" />,
                              "bg-rose-50 border border-rose-200 rounded-lg shadow-sm transition hover:shadow-md"
                            )}
                          {item.improvementSuggestions && (
                            <div className="bg-violet-50 border border-violet-200 p-4 rounded-lg">
                              <h3 className="font-semibold text-violet-800 mb-2">
                                Improvement Suggestions
                              </h3>
                              <div className="text-gray-700 whitespace-pre-line">
                                {item.improvementSuggestions}
                              </div>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </>
        ) : (
          <div className="py-10 text-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              No interview feedback available for this session.
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Button
            className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-6 py-3 rounded-lg shadow-lg"
            onClick={() => router.replace("/dashboard")}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Feedback;
