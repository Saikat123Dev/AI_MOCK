"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@clerk/nextjs";
import { CheckCircle, Crown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ParticipantsListProps {
  groupId: string;
  isCreator: boolean;
  onReadyStatusChange?: (allReady: boolean) => void;
}

type Participant = {
  id: string;
  userId: string;
  groupId: string;
  name?: string;
  email?: string;
  imageUrl?: string;
  isAdmin: boolean;
  isReady: boolean;
  totalScore: number;
  totalAnswers: number;
  createdAt: string;
  updatedAt: string;
  Answer: any[];
};

const ParticipantsList = ({ groupId, isCreator, onReadyStatusChange }: ParticipantsListProps) => {
  const { userId } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readyStatus, setReadyStatus] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await fetch(`/api/interview-groups/${groupId}/participants`);
        if (!response.ok) {
          throw new Error("Failed to fetch participants");
        }
        const data = await response.json();
        setParticipants(data.participants);

        // Find current user's ready status
        const currentUser = data.participants.find((p: Participant) => p.userId === userId);
        if (currentUser) {
          setReadyStatus(currentUser.isReady);
        }

        // Check if all participants are ready
        const allReady = data.participants.length > 0 &&
                         data.participants.every((p: Participant) => p.isReady);

        // Notify parent component about ready status
        if (onReadyStatusChange) {
          onReadyStatusChange(allReady);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchParticipants();

      // Set up polling to refresh participants list
      const intervalId = setInterval(fetchParticipants, 5000);

      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [groupId, userId, onReadyStatusChange]);

  const toggleReadyStatus = async () => {
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/interview-groups/${groupId}/ready`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        throw new Error("Failed to update ready status");
      }

      setReadyStatus(!readyStatus);
      toast.success(`You are now ${!readyStatus ? "ready" : "not ready"}`);

      // Refresh participants list
      const updatedResponse = await fetch(`/api/interview-groups/${groupId}/participants`);
      const updatedData = await updatedResponse.json();
      setParticipants(updatedData.participants);

      // Check if all participants are ready
      const allReady = updatedData.participants.length > 0 &&
                       updatedData.participants.every((p: Participant) => p.isReady);

      // Notify parent component about ready status
      if (onReadyStatusChange) {
        onReadyStatusChange(allReady);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <p className="text-red-700 font-medium">Error loading participants</p>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const allReady = participants.length > 0 && participants.every(p => p.isReady);
  const readyCount = participants.filter(p => p.isReady).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Participants ({participants.length})</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            {readyCount} of {participants.length} ready
          </p>
        </div>
        <button
          onClick={toggleReadyStatus}
          disabled={updatingStatus}
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
            readyStatus
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          } transition-colors disabled:opacity-50`}
        >
          {updatingStatus ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : readyStatus ? (
            <CheckCircle className="h-4 w-4" />
          ) : null}
          {readyStatus ? "Ready" : "Mark as Ready"}
        </button>
      </CardHeader>
      <CardContent>
        {allReady && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-center">
            <CheckCircle className="h-5 w-5 inline-block mr-2" />
            All participants are ready!
            {isCreator && " You can now start the interview."}
          </div>
        )}
        <div className="space-y-4">
          {participants.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No participants yet</p>
          ) : (
            participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={participant.imageUrl || ""} alt={participant.name || "Participant"} />
                    <AvatarFallback>
                      {participant.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{participant.name || participant.email || "Anonymous"}</p>
                      {participant.isAdmin && (
                        <Crown className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    {participant.email && (
                      <p className="text-sm text-gray-500">{participant.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {participant.isReady ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-500">
                      Not Ready
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ParticipantsList;
