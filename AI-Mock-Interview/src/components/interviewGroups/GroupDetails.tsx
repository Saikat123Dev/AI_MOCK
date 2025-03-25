"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@clerk/nextjs";
import { format } from "date-fns";
import { Award, Briefcase, Calendar, Clock, Loader2, Share2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import GroupControls from "./GroupControls";
import ParticipantsList from "./ParticipantsList";

interface GroupDetailsProps {
  groupId: string;
}

type InterviewGroup = {
  id: string;
  name: string;
  dateTime: string;
  role: string;
  skills: string[];
  experience: string;
  difficulty: string;
  questionNo: number;
  timeLimit: number;
  createdBy: string;
  publicId: string;
  isActive: boolean;
  InterviewGroupUser: any[];
};

const GroupDetails = ({ groupId }: GroupDetailsProps) => {
  const router = useRouter();
  const { userId } = useAuth();
  const [group, setGroup] = useState<InterviewGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [allParticipantsReady, setAllParticipantsReady] = useState(false);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const response = await fetch(`/api/interview-groups/${groupId}/details`);
        if (!response.ok) {
          throw new Error("Failed to fetch group details");
        }
        const data = await response.json();
        setGroup(data.group);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId]);

  const handleCopyInviteLink = () => {
    if (!group) return;

    const inviteLink = `${window.location.origin}/interview-groups/join/${group.publicId}`;
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        setCopySuccess(true);
        toast.success("Invite link copied to clipboard");
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => {
        toast.error("Failed to copy invite link");
      });
  };

  const handleReadyStatusChange = (allReady: boolean) => {
    setAllParticipantsReady(allReady);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <p className="text-red-700 font-medium">Error loading group details</p>
        <p className="text-red-600">{error || "Group not found"}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/interview-groups")}
        >
          Back to Groups
        </Button>
      </div>
    );
  }

  const interviewDate = new Date(group.dateTime);
  const isCreator = group.createdBy === userId;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{format(interviewDate, "EEEE, MMMM d, yyyy")}</span>
            <Clock className="h-4 w-4 ml-2" />
            <span>{format(interviewDate, "h:mm a")}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleCopyInviteLink}
          >
            <Share2 className="h-4 w-4" />
            {copySuccess ? "Copied!" : "Share Invite"}
          </Button>

          {isCreator && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => router.push(`/interview-groups/${groupId}/results`)}
            >
              View Results
            </Button>
          )}
           {!isCreator && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => router.push(`/interview-groups/${groupId}/session`)}
            >
             Join Now
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          {isCreator && <TabsTrigger value="controls">Controls</TabsTrigger>}
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Interview Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Job Role</h3>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">{group.role}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Experience Level</h3>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">{group.experience} years</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Time Limit</h3>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">{group.timeLimit} minutes</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Difficulty</h3>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      group.difficulty === "easy"
                        ? "bg-green-100 text-green-800"
                        : group.difficulty === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }>
                      {group.difficulty.charAt(0).toUpperCase() + group.difficulty.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {group.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-violet-100 text-violet-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Participants</h3>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span>{group.InterviewGroupUser.length} participants</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="mt-4">
          <ParticipantsList
            groupId={groupId}
            isCreator={isCreator}
            onReadyStatusChange={handleReadyStatusChange}
          />
        </TabsContent>

        {isCreator && (
          <TabsContent value="controls" className="mt-4">
            <GroupControls
              groupId={groupId}
              isActive={group.isActive}
              interviewDate={interviewDate}
              allParticipantsReady={allParticipantsReady}

            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default GroupDetails;
