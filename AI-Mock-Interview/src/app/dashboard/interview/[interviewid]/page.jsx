"use client";

import { LightbulbIcon, LucideWebcam } from "lucide-react";
import Webcam from "react-webcam";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton"
import Image from 'next/image'

function Interview() {
  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [webcamenabled, setwebcamenabled] = useState(false);
  const [isTermsAccepted, setTermsAccepted] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const interviewers = [
    { id: 1, name: "Alenrex Maity", imgSrc: "/interviewer_1.png" },
    { id: 2, name: "John Smith", imgSrc: "/interviewer_2.png" },
    { id: 3, name: "Ethan Vox", imgSrc: "/interviewer_3.png" },
  ];
  
  const { interviewid } = useParams();
  console.log('interviewid:', interviewid);

  useEffect(() => {
    const getDetails = async () => {
      try {
        const response = await fetch(`/api/mock/${interviewid}`);
        if (!response.ok) {
          throw new Error("Failed to fetch interview details");
        }
        const data = await response.json();
        console.log("data", data);
        setInterviewData(data);
        console.log('interviewData',interviewData);
      } catch (err) {
        console.error("Error fetching interview data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Fetch interview details only if interviewid is defined
    if (interviewid) {
      getDetails();
    }
  }, [interviewid]);

  // Find matching interviewer based on interviewerImageId
  const currentInterviewer = interviewData && interviewers.find(
    interviewer => interviewer.id === interviewData.interviewerImageId
  );

  // Handle loading state
  if (loading)
    return (
      <div className="p-10 mt-0 rounded-lg shadow-lg space-y-6">
        {/* Skeleton for Interviewer Image */}
        <div className="flex justify-center mb-6">
          <Skeleton className="w-32 h-32 rounded-full bg-gray-200" />
        </div>
        {/* Skeleton for Interview Details Section */}
        <div className="flex flex-col lg:flex-row gap-10 items-start lg:items-center w-full">
          <Skeleton className="w-full lg:w-1/2 bg-gray-200 p-6 rounded-lg h-80 shadow-md border border-gray-200" />
          <Skeleton className="w-full lg:w-1/2 flex flex-col items-center justify-center h-80 bg-gray-200 p-8 rounded-lg shadow-md border border-gray-300" />
        </div>
      </div>
    );

  // Handle error state
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-10 mt-0 rounded-lg shadow-lg">
      {/* Heading Section */}
      <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-4">
        Let's Get Started
      </h1>
      
      {/* Interviewer Profile */}
      {currentInterviewer && (
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-40 h-40 mb-3 rounded-full overflow-hidden border-4 border-violet-500 shadow-lg">
            <Image 
              src={currentInterviewer.imgSrc} 
              alt={currentInterviewer.name}
              layout="fill"
              objectFit="cover"
              className="rounded-full"
            />
          </div>
          <h3 className="text-xl font-semibold text-gray-700">{currentInterviewer.name}</h3>
          <p className="text-violet-600 font-medium">Your Interviewer Today</p>
        </div>
      )}

      {/* Main Content Container */}
      <div className="flex flex-col lg:flex-row gap-10 items-start lg:items-center w-full">
        {/* Interview Details Section */}
        <div className="w-full lg:w-1/2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-semibold text-center text-gray-600 mb-12">
            Interview Details
          </h2>
          <div className="space-y-4">
            <p className="text-lg">
              <strong className="text-gray-800">Job Role/Position:</strong> {interviewData?.jobPosition}
            </p>
            <p className="text-lg">
              <strong className="text-gray-800">Job Description:</strong> {interviewData?.jobDesc}
            </p>
            <p className="text-lg">
              <strong className="text-gray-800">Years of Experience:</strong> {interviewData?.jobexperience}
            </p>
            <p className="text-lg">
              <strong className="text-gray-800">Difficulty Level:</strong> {interviewData?.difficultyLevel}
            </p>
            <p className="text-lg">
              <strong className="text-gray-800">Number of Questions:</strong> {interviewData?.numQuestions}
            </p>
          </div>
          <div className="mt-3 my-4 bg-yellow-200 border-yellow-300 p-4 shadow-lg rounded-lg">
            <h2 className="flex items-center">
              <LightbulbIcon />
              <strong className="ml-2">Information</strong>
            </h2>
            <p>
              Enable the webcam and microphone to start your AI Mock Interview.
              You will have 5 questions, and at the end, you'll receive a detailed report based on your answers. 
              <br />
              <strong>Note:</strong> We do not record your video, and you can disable the webcam at any time.
            </p>
          </div>
        </div>

        {/* Webcam Section */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-gray-200 p-8 rounded-lg shadow-md border border-gray-300">
          {webcamenabled ? (
            <Webcam
              onUserMedia={() => setwebcamenabled(true)}
              onUserMediaError={() => setwebcamenabled(false)}
              mirrored={true}
              className="rounded-lg shadow-lg border border-gray-300"
              style={{ width: 320, height: 240 }}
            />
          ) : (
            <>
              <div className="flex flex-col items-center justify-center h-80 w-80 bg-gray-300 rounded-lg border border-dashed border-gray-400 p-8">
                <LucideWebcam className="h-24 w-24 text-gray-500" />
                <p className="text-gray-700 mt-4">Web Camera Disabled</p>
              </div>
            </>
          )}
          <button
            onClick={() => setwebcamenabled(!webcamenabled)}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg shadow-md transition duration-200"
          >
            Enable Web Camera and Microphone
          </button>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center mt-5 my-3">
        {/* Terms Acceptance Section */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="terms"
            checked={isTermsAccepted}
            onChange={() => setTermsAccepted(!isTermsAccepted)}
            className="w-5 h-5 accent-violet-500 cursor-pointer"
          />
          <label
            onClick={() => setOpenDialog(true)}
            className="cursor-pointer text-gray-700 hover:underline"
          >
            Read Rules and Regulations
          </label>
        </div>

        {openDialog && (
          <div className="h-auto fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-lg p-5 max-w-5xl w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Interview Terms and Conditions
              </h2>
              <ul className="list-decimal list-inside text-gray-700 space-y-3">
                <li>
                  <strong className="font-semibold">Realistic Experience:</strong> To provide a
                  realistic interview experience, please ensure your webcam is turned on during the
                  interview session.
                </li>
                <li>
                  <strong className="font-semibold">Audio Feature:</strong> You can turn on the audio
                  option to hear the questions being read aloud. This can help you focus on
                  understanding the questions better.
                </li>
                <li>
                  <strong className="font-semibold">Answer Recording:</strong> After you complete your
                  answer, it will be recorded and displayed below the question. If you are not
                  satisfied with your response, you have the option to re-record it.
                </li>
                <li>
                  <strong className="font-semibold">Saving Answers:</strong> It is mandatory to save
                  each of your answers after recording to ensure that they are correctly evaluated.
                </li>
                <li>
                  <strong className="font-semibold">Navigation:</strong> You can move between
                  questions using the <span className="font-medium">"Next"</span> and{' '}
                  <span className="font-medium">"Previous"</span> buttons provided.
                </li>
                <li>
                  <strong className="font-semibold">Timer:</strong> A timer will be displayed at the
                  top of the screen to track the time taken for each question.
                </li>
                <li>
                  <strong className="font-semibold">Post-Interview Feedback:</strong> After completing
                  the interview, you will receive detailed feedback, including:
                  <ul className="list-disc list-inside mt-2 ml-5 space-y-1">
                    <li>Your overall rating.</li>
                    <li>Correct answers.</li>
                    <li>Feedback on your performance.</li>
                    <li>Your recorded answers.</li>
                  </ul>
                </li>
              </ul>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setOpenDialog(false)}
                  className="px-4 py-2 bg-violet-500 text-white font-semibold rounded-lg hover:bg-violet-600 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Start Interview Button */}
        <Link
          href={`/dashboard/interview/${interviewid}/start`}
          className={`mt-5 bg-violet-500 text-white font-semibold py-3 px-8 rounded-lg shadow-lg border border-violet-700 transition duration-300 ease-in-out transform ${
            isTermsAccepted
              ? 'hover:scale-105 hover:bg-violet-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2'
              : 'opacity-50 cursor-not-allowed'
          }`}
          onClick={(e) => {
            if (!isTermsAccepted) e.preventDefault();
          }}
        >
          Start Interview
        </Link>
      </div>
    </div>
  );
}

export default Interview;