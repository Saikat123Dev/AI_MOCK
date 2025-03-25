"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useInterviewStore } from "@/lib/socket";
import { useAuth } from "@clerk/nextjs";
import { CheckCircle, Clock, Code, FileText, Loader2, Mic, MicOff, Volume2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Add code editor import
import dynamic from "next/dynamic";
import InterviewStandingsGraph from "../../../../components/interviewGroups/ScoreLeaderBoard";

// Dynamically import the code editor to avoid SSR issues
const CodeEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  { ssr: false }
);

interface SessionPageProps {
  params: {
    groupId: string;
  };
}

type Question = {
  id: string;
  text: string;
  timeLimit: number;
  groupId: string;
  correctAnswer?: string;
  difficulty?: number;
  skills?: string[];
  commonMistakes?: string[];
  maxScore?: number;
  type?: "text" | "code"; // Add question type
  language?: string; // Add programming language for code questions
};

type Participant = {
  id: string;
  userId: string;
  name?: string;
  email?: string;
  imageUrl?: string;
  isAdmin: boolean;
  isReady: boolean;
  totalScore: number;
  totalAnswers: number;
};

export default function InterviewSessionPage({ params }: SessionPageProps) {
  const router = useRouter();
  const { userId, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"text" | "code">("text");
  const [codeContent, setCodeContent] = useState<string>("");
  const [codeLanguage, setCodeLanguage] = useState<string>("javascript");

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use the interview store for WebSocket state
  const {
    isConnected,
    joinInterview,
    startInterview,
    submitAnswer,
    setCurrentAnswer,
    nextQuestion,
    currentQuestionIndex,
    timeRemaining,
    inProgress,
    isSubmitted,
    currentAnswer,
    usersInRoom,
    submittedUsers,
    interviewComplete
  } = useInterviewStore();
  const unwrappedParams = use(params);
  const { groupId } = unwrappedParams;

  // Fetch initial session data and connect to WebSocket
  useEffect(() => {
    const initSession = async () => {
      try {
        // Fetch questions
        const questionsResponse = await fetch(`/api/interview-groups/${groupId}/questions`);
        if (!questionsResponse.ok) {
          throw new Error("Failed to fetch questions");
        }
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData.questions);

        // Fetch participants and determine if current user is admin
        const participantsResponse = await fetch(`/api/interview-groups/${groupId}/participants`);
        if (!participantsResponse.ok) {
          throw new Error("Failed to fetch participants");
        }
        const participantsData = await participantsResponse.json();
        console.log("Fetched participants:", participantsData);
        setParticipants(participantsData.participants);
        console.log("participants", participants);
        // Determine if current user is admin/host
        const currentUser = participantsData.participants.find(
          (p: Participant) => p.userId === userId
        );
        setIsAdmin(currentUser?.isAdmin || false);
        setUsername(currentUser?.name || currentUser?.email || "User");

        if (currentUser?.isAdmin) {
          // Store the host ID in localStorage for persistence
          localStorage.setItem(`group_${groupId}_host`, userId || "");
        }

        // Connect to WebSocket and join the interview room
        if (userId && username) {
          joinInterview(groupId, userId, username);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      initSession();
    }

    // Cleanup function
    return () => {
      stopRecording();
      cleanupAudio();
    };
  }, [groupId, userId, joinInterview, username]);

  useEffect(() => {
    const checkInterviewStatus = async () => {
      try {
        const response = await fetch(`/api/interview-groups/${groupId}/status`);
        if (!response.ok) {
          throw new Error("Failed to fetch interview status");
        }
        const data = await response.json();

        // If the interview is already in progress, force update the store
        if (data.inProgress) {
          useInterviewStore.getState().setInterviewInProgress(true);

          // Optionally, sync other interview state
          if (data.currentQuestionIndex !== undefined) {
            useInterviewStore.getState().setCurrentQuestionIndex(data.currentQuestionIndex);
          }

          // Sync time remaining if applicable
          if (data.timeRemaining !== undefined) {
            useInterviewStore.getState().setTimeRemaining(data.timeRemaining);
          }
        }
      } catch (error) {
        console.error("Error checking interview status:", error);
      }
    };

    // Only check if not already in progress and user is not an admin
    if (!inProgress && !isAdmin) {
      checkInterviewStatus();
    }
  }, [groupId, inProgress, isAdmin]);

  // Listen for interview complete event
  useEffect(() => {
    if (interviewComplete) {
      setSessionComplete(true);
    }
  }, [interviewComplete]);

  // Effect to detect code questions and set appropriate tab and language
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex >= 0) {
      const currentQuestion = questions[currentQuestionIndex];

      // Check if question is a code question based on content or type
      const isCodeQuestion =
        currentQuestion.type === "code" ||
        /write a (function|program|code|algorithm|class)/i.test(currentQuestion.text) ||
        /implement|programming|coding challenge/i.test(currentQuestion.text);

      // Set active tab based on question type
      setActiveTab(isCodeQuestion ? "code" : "text");

      // Set language based on question content or default to JavaScript
      if (isCodeQuestion) {
        const detectedLanguage = detectLanguageFromQuestion(currentQuestion.text);
        setCodeLanguage(detectedLanguage || currentQuestion.language || "javascript");
      }
    }
  }, [questions, currentQuestionIndex]);

  // Function to detect programming language from question text
  const detectLanguageFromQuestion = (questionText: string): string | null => {
    const languagePatterns = [
      { pattern: /python|pandas|numpy|def\s+\w+\s*\(/i, language: "python" },
      { pattern: /javascript|js|function\s+\w+\s*\(/i, language: "javascript" },
      { pattern: /typescript|ts|interface/i, language: "typescript" },
      { pattern: /java|public\s+class/i, language: "java" },
      { pattern: /c\+\+|cpp|#include/i, language: "cpp" },
      { pattern: /sql|select|from|where/i, language: "sql" },
      { pattern: /html|css|<div>/i, language: "html" },
      { pattern: /react|jsx|tsx|component/i, language: "tsx" },
    ];

    for (const { pattern, language } of languagePatterns) {
      if (pattern.test(questionText)) {
        return language;
      }
    }

    return null;
  };

  // Clean up audio resources
  const cleanupAudio = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (audioLevelTimerRef.current) {
      clearInterval(audioLevelTimerRef.current);
      audioLevelTimerRef.current = null;
    }

    if (transcriptionTimeoutRef.current) {
      clearTimeout(transcriptionTimeoutRef.current);
      transcriptionTimeoutRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }

    audioContextRef.current = null;
    analyserRef.current = null;
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsTranscribing(false);
    setIsRecording(false);
    setAudioLevel(0);
    setRecordingTime(0);
  };

  // Monitor audio levels
  const startAudioLevelMonitoring = (stream: MediaStream) => {
    try {
      // Create audio context and analyzer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Connect stream to analyzer
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Start monitoring audio levels
      audioLevelTimerRef.current = setInterval(() => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average volume level
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          setAudioLevel(average);
        }
      }, 100);
    } catch (err) {
      console.error("Failed to start audio monitoring:", err);
    }
  };

  // Request permissions for audio recording
  const requestAudioPermission = async () => {
    try {
      // Request audio permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false // Set to true if you want video recording as well
      });

      setHasAudioPermission(true);
      streamRef.current = stream;
      startAudioLevelMonitoring(stream);

      toast.success("Microphone access granted!");
      return true;
    } catch (err) {
      console.error("Audio permission error:", err);
      toast.error("Unable to access microphone. Please check your permissions.");
      return false;
    }
  };

  // Start recording audio
  const startRecording = async () => {
    // Clean up any existing recording state first
    cleanupAudio();

    // First request permissions
    const permissionGranted = await requestAudioPermission();
    if (!permissionGranted || !streamRef.current) return;

    try {
      // Reset the audio chunks and recording time
      audioChunksRef.current = [];
      setRecordingTime(0);

      // Create a media recorder
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Only transcribe if we have audio data
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          transcribeAudio(audioBlob);
        } else {
          toast.warning("No audio was recorded. Please try again and speak clearly.");
          setIsTranscribing(false);
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data in 1-second chunks
      setIsRecording(true);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success("Recording started. Speak clearly!");
    } catch (err) {
      console.error("Error starting recording:", err);
      toast.error("Failed to start recording. Please try again.");
      setIsTranscribing(false);
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (isRecording) {
      setIsTranscribing(true);
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error("Error stopping media recorder:", err);
        setIsTranscribing(false);
      }
    } else if (isTranscribing) {
      // If there's no active media recorder but we're in transcribing state,
      // we need to reset it to prevent getting stuck
      setIsTranscribing(false);
    }

    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setAudioLevel(0);

    // Set a safety timeout to ensure we don't get stuck in transcribing state
    if (transcriptionTimeoutRef.current) {
      clearTimeout(transcriptionTimeoutRef.current);
    }

    transcriptionTimeoutRef.current = setTimeout(() => {
      if (isTranscribing) {
        setIsTranscribing(false);
        toast.error("Transcription timed out. Please try again.");
      }
    }, 30000); // 30 second safety timeout
  };

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Transcribe the recorded audio
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      // Log the blob size to help with debugging
      console.log(`Audio blob size: ${audioBlob.size} bytes`);

      // Only proceed if we have actual audio data
      if (audioBlob.size < 100) {
        toast.warning("No speech detected. Please try again and speak clearly.");
        setIsTranscribing(false);
        return;
      }

      // Create form data to send the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Log the form data to help with debugging
      console.log("Sending audio data:", formData);

      // Send to the transcription API with extended timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        toast.error("Transcription request timed out. Please try again.");
        setIsTranscribing(false);
      }, 30000); // 30 second timeout

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Transcription error response:", errorData);
        throw new Error(errorData.message || 'Transcription failed');
      }

      const data = await response.json();
      console.log("Transcription result:", data);

      // Clear the safety timeout since we got a response
      if (transcriptionTimeoutRef.current) {
        clearTimeout(transcriptionTimeoutRef.current);
        transcriptionTimeoutRef.current = null;
      }

      // Update the answer text with the transcription
      if (data.transcript && data.transcript.trim()) {
        // Log before updating to see the data
        console.log('Received transcript:', data.transcript);

        // Use a local variable first for debugging
        const newText = data.transcript.trim();
        const currentText = currentAnswer || ''; // Use the component state directly
        console.log('Current answer before update:', currentText);

        // Create the new answer text
        const updatedText = currentText.trim()
          ? `${currentText.trim()}\n\n${newText}`
          : newText;
        console.log('Updated answer will be:', updatedText);

        // Update the state
        setCurrentAnswer(updatedText);

        // Also log after the update attempt
        console.log('State update attempted, current answer:', currentAnswer);

        toast.success("Successfully transcribed your answer!");
      } else {
        toast.warning("No speech detected in the recording. Please try again and speak clearly.");
      }
    } catch (err) {
      console.error("Transcription error:", err);
      toast.error("Failed to transcribe audio. Please try again or type your answer.");
    } finally {
      setIsTranscribing(false);
    }
  };

  // Start interview if admin
  const handleStartInterview = async () => {
    try {
      if (!isAdmin || !questions || questions.length === 0) {
        throw new Error("You must be an admin and have questions to start the interview.");
      }

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication failed. Please log in again.");
      }

      const response = await fetch(`/api/interview-groups/${groupId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ groupId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start group");
      }

      // Format questions for socket.io format
      const formattedQuestions = questions.map((q) => ({
        text: q.text,
        correctAnswer: q.correctAnswer || "",
        timeLimit: q.timeLimit || 60, // Default timeLimit to 60 seconds if not provided
        difficulty: q.difficulty || 1,
        skills: q.skills || [],
        commonMistakes: q.commonMistakes || [],
        maxScore: q.maxScore || 10,
        type: q.type || "text",
        language: q.language || "javascript",
      }));

      startInterview(formattedQuestions);
    } catch (error) {
      console.error("Error starting interview:", error);
      alert(error.message); // Optional: Show an error message to the user
    }
  };


  // Handle submitting answer
  const handleSubmitAnswer = async () => {
    if (submitting || isSubmitted) return;

    // Stop recording if it's still going
    if (isRecording) {
      stopRecording();
    }

    // Prepare the final answer content based on active tab
    const finalAnswer = activeTab === "code"
      ? `\`\`\`${codeLanguage}\n${codeContent}\n\`\`\`\n\n${currentAnswer || ''}`
      : currentAnswer || '';

    setSubmitting(true);
    try {
      // Submit to WebSocket - add a placeholder score to trigger update
      submitAnswer(finalAnswer);

      // Get the current question ID
      const currentQuestionId = questions[currentQuestionIndex].id;

      // Also save to database via API for persistence
      const response = await fetch(`/api/interview-groups/${groupId}/${currentQuestionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({
          userAnswer: finalAnswer,
          groupId,
          questionId: currentQuestionId,
          answerType: activeTab,
          codeLanguage: activeTab === "code" ? codeLanguage : undefined
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit answer");
      }

      // Get the analysis result
      const analysisResult = await response.json();
      console.log("Answer analysis:", analysisResult);

      if (!userId || !username) {
        console.log("No userId or username found, not updating score");
        return;
      }

      // If there's a score from analysis, update it in the socket
      if (analysisResult.userScore && analysisResult.userScore.totalScore !== undefined) {
        // Send dedicated score update event
        useInterviewStore.getState().updateScore(
          userId,
          analysisResult.userScore.totalScore,
          username
        );
      }

      toast.success("Answer submitted and analyzed successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle admin moving to next question
  const handleNextQuestion = () => {
    if (!isAdmin) return;
    if (isRecording) {
      stopRecording();
    }
    setCodeContent("");
  if (currentQuestionIndex >= questions.length - 1) {

      setSessionComplete(true);
      // Also trigger in the socket store
      useInterviewStore.getState().completeInterview();
      return;
    }

    nextQuestion();
  };


  const handleEndInterview =async () => {
    if (!isAdmin) return;
    const response = await fetch(`/api/interview-groups/${groupId}/endInterview`, {
      method: "POST",
      body: JSON.stringify({ groupId }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to end group");
    }
    setSessionComplete(true);
    useInterviewStore.getState().completeInterview();
  };

  const handleCodeChange = (value: string | undefined) => {
    setCodeContent(value || "");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading interview session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700 font-medium">Error loading interview session</p>
          <p className="text-red-600">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push(`/interview-groups/${groupId}`)}
          >
            Back to Group
          </Button>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <p className="text-yellow-700 font-medium">Connecting to session...</p>
          <p className="text-yellow-600">Attempting to establish a connection to the interview server.</p>
          <div className="flex items-center mt-4">
            <Loader2 className="h-4 w-4 animate-spin mr-2 text-yellow-600" />
            <span>Please wait...</span>
          </div>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Interview Session Complete</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg text-gray-700 mb-4">
              You've completed all questions in this interview session!
            </p>
            <p className="text-gray-600 mb-8">
              Your answers have been submitted and analyzed.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Session Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Questions</p>
                  <p className="text-xl font-semibold">{questions.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Participants</p>
                  <p className="text-xl font-semibold">{participants.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push(`/interview-groups/${groupId}/results`)}
              className="bg-violet-600 hover:bg-violet-700"
            >
              View Results
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/interview-groups")}
            >
              Back to Groups
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <p className="text-yellow-700 font-medium">No questions available</p>
          <p className="text-yellow-600">This interview session doesn't have any questions.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push(`/interview-groups/${groupId}`)}
          >
            Back to Group
          </Button>
        </div>
      </div>
    );
  }

  if (!inProgress && isAdmin) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Start Interview Session</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg text-gray-700 mb-4">
              You are the host of this interview session.
            </p>
            <p className="text-gray-600 mb-8">
              {usersInRoom.length} participant(s) are waiting to start.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Session Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Questions</p>
                  <p className="text-xl font-semibold">{questions.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Participants</p>
                  <p className="text-xl font-semibold">{usersInRoom.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              onClick={handleStartInterview}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Start Interview
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
23
  // Update the conditional rendering for non-admin users
  if (!inProgress && !isAdmin) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {inProgress ? "Interview in Progress" : "Waiting for Host"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {inProgress ? (
              <p className="text-lg text-gray-700 mb-4">
                The interview is currently ongoing. You will be joined momentarily.
              </p>
            ) : (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-violet-600 mx-auto mb-4" />
                <p className="text-lg text-gray-700 mb-4">
                  The interview session hasn't started yet.
                </p>
                <p className="text-gray-600 mb-8">
                  Waiting for the host to begin the session...
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex] || {
    text: "Loading question...",
    timeLimit: 0
  };

  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className={`font-mono ${timeRemaining < 30 ? "text-red-600 font-bold" : ""}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Question {currentQuestionIndex + 1}</span>
                  {isSubmitted ? null : (
                    <div className="flex gap-2">
                      {isRecording ? (
                        <Button
                          onClick={stopRecording}
                          variant="destructive"
                          className="flex items-center gap-1 px-3 py-1 h-8"
                          disabled={isTranscribing}
                        >
                          <MicOff className="h-4 w-4" /> Stop ({formatRecordingTime(recordingTime)})
                        </Button>
                      ) : (
                        <Button
                        onClick={startRecording}
                        variant="secondary"
                        className="flex items-center gap-1 px-3 py-1 h-8"
                        disabled={isTranscribing || isRecording}
                      >
                        <Mic className="h-4 w-4" /> Record
                      </Button>
                    )}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow pb-4">
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <p className="whitespace-pre-wrap">{currentQuestion.text}</p>
              </div>
                <InterviewStandingsGraph groupId={groupId} />
              <div className="mt-4">
                {isSubmitted ? (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center text-green-600 mb-2">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">Answer submitted</span>
                    </div>
                    <p className="text-gray-600">
                      Waiting for the interviewer to move to the next question.
                    </p>
                  </div>
                ) : (
                  <div>
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "text" | "code")}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="text" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Text
                        </TabsTrigger>
                        <TabsTrigger value="code" className="flex items-center gap-2">
                          <Code className="h-4 w-4" /> Code
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="text" className="mt-0">
                        <div className="mb-2 flex items-center gap-2">
                          <Label htmlFor="answer">Your Answer</Label>
                          {isTranscribing && (
                            <div className="flex items-center text-amber-600 text-sm">
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Transcribing...
                            </div>
                          )}
                          {audioLevel > 0 && isRecording && (
                            <div className="flex items-center gap-1">
                              <Volume2 className="h-3 w-3 text-green-600" />
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-green-600 h-1.5 rounded-full"
                                  style={{ width: `${Math.min(100, audioLevel)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <Textarea
                          id="answer"
                          placeholder="Type your answer here..."
                          className="min-h-[200px]"
                          value={currentAnswer || ""}
                          onChange={(e) => setCurrentAnswer(e.target.value)}
                          disabled={isSubmitted || isTranscribing}
                        />
                      </TabsContent>
                      <TabsContent value="code" className="mt-0">
                        <div className="mb-2">
                          <Label>Programming Language</Label>
                          <select
                            value={codeLanguage}
                            onChange={(e) => setCodeLanguage(e.target.value)}
                            className="ml-2 border rounded p-1 text-sm"
                            disabled={isSubmitted}
                          >
                            <option value="javascript">JavaScript</option>
                            <option value="typescript">TypeScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="csharp">C#</option>
                            <option value="cpp">C++</option>
                            <option value="php">PHP</option>
                            <option value="ruby">Ruby</option>
                            <option value="go">Go</option>
                            <option value="sql">SQL</option>
                            <option value="html">HTML</option>
                            <option value="css">CSS</option>
                          </select>
                        </div>
                        <div className="h-[300px] border rounded">
                          <CodeEditor
                            height="300px"
                            language={codeLanguage}
                            value={codeContent}
                            onChange={handleCodeChange}
                            options={{
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              fontSize: 14,
                              readOnly: isSubmitted
                            }}
                          />
                        </div>
                        {activeTab === "code" && (
                          <div className="mt-4">
                            <Label htmlFor="notes">Additional Notes (Optional)</Label>
                            <Textarea
                              id="notes"
                              placeholder="Add any explanations or notes about your code..."
                              className="min-h-[100px] mt-1"
                              value={currentAnswer || ""}
                              onChange={(e) => setCurrentAnswer(e.target.value)}
                              disabled={isSubmitted}
                            />
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">

            {isAdmin && (
                  <Button
                    variant="outline"
                    onClick={handleNextQuestion}
                    disabled={submitting || isTranscribing}
                  >
                    Skip/Next Question
                  </Button>
                )}

                <div className="ml-auto">
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={submitting || isSubmitted || isTranscribing}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : isSubmitted ? (
                      "Answer Submitted"
                    ) : (
                      "Submit Answer"
                    )}
                  </Button>
                </div>
              </CardFooter>
          </Card>
        </div>

        <div className="hidden lg:block">
            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">


                  {participants.map((participant) => {
                    const hasSubmitted = submittedUsers.has(participant.userId);

                    return (
                      <div key={participant.id} className="flex items-center gap-3">
                       <Avatar>
                          <AvatarImage src={participant.imageUrl || ""} alt={participant.name || "Participant"} />
                          <AvatarFallback>{(participant.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">
                            {participant.name || participant.email || "Unnamed Participant"}
                            {participant.isAdmin && (
                              <span className="ml-2 text-xs bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full">
                                Host
                              </span>
                            )}
                          </div>
                        </div>
                        {hasSubmitted ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-200"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
    </div>
  </div>
);
}
