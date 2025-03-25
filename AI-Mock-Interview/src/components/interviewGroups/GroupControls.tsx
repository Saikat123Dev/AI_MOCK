"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Ban, Brain, Loader2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface GroupControlsProps {
  groupId: string;
  isActive: boolean;
  allParticipantsReady: boolean;
  interviewDate: Date;
}

const GroupControls = ({ groupId, isActive, allParticipantsReady, interviewDate }: GroupControlsProps) => {
  const router = useRouter();
  const [startingInterview, setStartingInterview] = useState(false);
  const [cancellingGroup, setCancellingGroup] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [isInterviewTime, setIsInterviewTime] = useState(false);
  console.log(interviewDate);
  useEffect(() => {
    const checkInterviewTime = () => {
      const currentTime = new Date();
      const interviewTime = new Date(interviewDate);

      console.log("Current time:", currentTime);
      console.log("Interview time:", interviewTime);

      if (isNaN(interviewTime.getTime())) {
        console.error("Invalid interview date format");
        return;
      }

      // Simple comparison of timestamps
      setIsInterviewTime(currentTime.getTime() >= interviewTime.getTime());
      console.log("Is interview time:", currentTime.getTime() >= interviewTime.getTime());
    };

    checkInterviewTime();
    const intervalId = setInterval(checkInterviewTime, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, [interviewDate]); // Add interviewDate as a dependency

  const handleStartInterview = async () => {
    setStartingInterview(true);
    try {
      router.push(`/interview-groups/${groupId}/session`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start interview");
    } finally {
      setStartingInterview(false);
    }
  };

  const handleCancelGroup = async () => {
    setCancellingGroup(true);
    try {
      const response = await fetch(`/api/interview-groups/${groupId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel group");
      }

      toast.success("Interview group cancelled successfully");
      router.refresh(); // Refresh the page or redirect as needed
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel group");
    } finally {
      setCancellingGroup(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setGeneratingQuestions(true);
    try {
      const response = await fetch(`/api/interview-groups/${groupId}/QuestionGenerate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate questions");
      }

      toast.success("Interview questions generated successfully");
      router.refresh(); // Refresh to show new questions
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate questions");
    } finally {
      setGeneratingQuestions(false);
    }
  };
   console.log("time:",isInterviewTime);
  // Button should be enabled only when all participants are ready AND it's interview time
  const canStartInterview = allParticipantsReady && isInterviewTime;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Controls</CardTitle>
      </CardHeader>
      <CardContent>
        {isActive ? (
          <div className="flex flex-col gap-4">
            <Button
              onClick={handleStartInterview}
              disabled={ !canStartInterview}
              className={`w-full ${!canStartInterview ? "bg-gray-400 cursor-not-allowed" : "bg-violet-600 hover:bg-violet-700"}`}
            >
              {startingInterview ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {startingInterview ? "Starting..." : "Start Interview"}
            </Button>

            <Button
              onClick={handleGenerateQuestions}
              disabled={generatingQuestions }
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {generatingQuestions ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              {generatingQuestions ? "Generating Questions..." : "Generate AI Questions"}
            </Button>

            {!allParticipantsReady && (
              <p className="text-amber-600 text-sm mt-2">
                Waiting for all participants to mark themselves as ready.
              </p>
            )}
            {!isInterviewTime && (
              <p className="text-amber-600 text-sm mt-2">
                The interview can start at the scheduled time: {interviewDate.toLocaleTimeString()}.
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-medium">Group Cancelled</h3>
              <p className="text-red-700 text-sm">
                This interview group has been cancelled and is no longer active.
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="w-full"
              disabled={cancellingGroup || !isActive}
            >
              {cancellingGroup ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              {cancellingGroup ? "Cancelling..." : "Cancel Group"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently cancel the interview group
                and notify all participants.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelGroup}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, cancel group
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default GroupControls;
