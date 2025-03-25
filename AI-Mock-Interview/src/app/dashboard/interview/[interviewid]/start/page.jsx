"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import InterviewQuestions from "./_components/Questions";
import RecordAnswerSection from "./_components/RecordAnswerSection";
import { Button } from "@/components/ui/button";
import { useStopwatch } from "react-timer-hook";
import Link from "next/link";
import ClockLoader from "react-spinners/ClockLoader";

function StartInterview() {
  const [interviewData, setInterviewData] = useState();
  const [loading, setLoading] = useState(true);
  const [mockInterviewQuestion, setmockInterviewQuestion] = useState([]);
  const [error, setError] = useState();
  const { interviewid } = useParams();
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const[InterviewerId,setInterviewerId]=useState(0);

  // console.log("interviewid:", interviewid);
  const { seconds, minutes, hours, start, pause, reset } = useStopwatch({
    autoStart: true,
  });

  useEffect(() => {
    const getDetails = async () => {
      try {
        const response = await fetch(`/api/mock/${interviewid}`);
        if (!response.ok) {
          throw new Error("Failed to fetch interview details");
        }
        const data = await response.json();
        console.log("data:", data);
        setInterviewData(data);

        // Ensure MockResponse is an array
        const parsedQuestions = data.MockResponse || [];
        const InterviewerId=data.interviewerImageId;
        setInterviewerId(InterviewerId);
        setmockInterviewQuestion(parsedQuestions);
        console.log("mockInterviewQuestion:", parsedQuestions);
      } catch (err) {
        console.error("Error fetching interview data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (interviewid) {
      getDetails();
    }
  }, [interviewid]);

  const handleNext = () => {
    if (activeQuestionIndex < mockInterviewQuestion.length - 1) {
      setActiveQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex((prev) => prev - 1);
    }
  };

  const handleEnd = () => {
    console.log("End of the interview.");
    // Handle end-of-interview logic here
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
       <ClockLoader
  color="rgba(78, 29, 29, 1)"
  cssOverride={{}}
  loading
  size={120}
  speedMultiplier={2}
/>
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        Error: {error}
      </div>
    );

  return (
    <div className="min-h-screen">
      <div className="flex flex-col items-center justify-center bg-white shadow-lg rounded-lg max-w-2xl mx-auto mt-2 p-6">
        <p className="text-lg font-semibold text-gray-700">Interview Timer</p>
        <div className="text-4xl font-bold text-gray-800 mt-2">
          {hours}:{minutes}:{seconds}
        </div>
        <div className="flex gap-4 mt-4">
          <button
            onClick={start}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md shadow transition-all"
          >
            Start
          </button>
          <button
            onClick={pause}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-md shadow transition-all"
          >
            Pause
          </button>
          <button
            onClick={reset}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md shadow transition-all"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto mt-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <InterviewQuestions
            mockInterviewQuestion={mockInterviewQuestion}
            activeQuestionIndex={activeQuestionIndex}
            setActiveQuestionIndex={setActiveQuestionIndex}
            InterviewerId={InterviewerId}
          />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <RecordAnswerSection
            mockInterviewQuestion={mockInterviewQuestion}
            // correctAnswers={}
            activeQuestionIndex={activeQuestionIndex}
            interviewid={interviewid}
          />
        </div>
      </div>

      {/* Buttons Section */}
      <div className="flex justify-center items-center gap-6 mt-6 mb-5">
        <Button
          onClick={handlePrevious}
          className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg shadow transition-all"
          disabled={activeQuestionIndex === 0}
        >
          Previous
        </Button>
        <Link
         href={`/dashboard/interview/${interviewid}/feedback`}
          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition-all"
        >
          End
        </Link>
        <Button
          onClick={handleNext}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow transition-all"
          disabled={activeQuestionIndex === mockInterviewQuestion.length - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default StartInterview;
