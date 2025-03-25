"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Award, Briefcase, Calendar, CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface JoinGroupProps {
  publicId: string;
}

const JoinGroup = ({ publicId }: JoinGroupProps) => {
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const response = await fetch(`/api/interview-groups/join/${publicId}`);
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

    if (publicId) {
      fetchGroupDetails();
    }
  }, [publicId]);

  const handleJoinGroup = async () => {
    if (!group) return;

    setJoining(true);
    try {
      const response = await fetch(`/api/interview-groups/join/${publicId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join group");
      }

      toast.success("Successfully joined the interview group");
      router.push(`/interview-groups/${group.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join group");
    } finally {
      setJoining(false);
    }
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
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
          <CardDescription>
            We couldn't find the interview group you're looking for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{error || "The group may have been deleted or the link is invalid."}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => router.push("/sign-in")}>
            login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const interviewDate = new Date(group.dateTime);
  const isUpcoming = interviewDate > new Date();
  const alreadyJoined = group.InterviewGroupUser.some(
    (user: any) => user.userId === "current-user-id" // Replace with actual user ID check
  );

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{group.name}</CardTitle>
            <CardDescription className="mt-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{format(interviewDate, "PPP 'at' p")}</span>
              </div>
            </CardDescription>
          </div>
          <Badge
            variant={isUpcoming ? "default" : "destructive"}
            className={isUpcoming ? "bg-green-100 text-green-800" : ""}
          >
            {isUpcoming ? "Upcoming" : "Past"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Job Role</h3>
            <p className="flex items-center gap-2 mt-1">
              <Briefcase className="h-4 w-4 text-gray-600" />
              {group.role}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Experience</h3>
            <p className="flex items-center gap-2 mt-1">
              <Award className="h-4 w-4 text-gray-600" />
              {group.experience} years
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Questions</h3>
            <p className="mt-1">{group.questionNo}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Time Limit</h3>
            <p className="flex items-center gap-2 mt-1">
              <Clock className="h-4 w-4 text-gray-600" />
              {group.timeLimit} minutes
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">Required Skills</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {group.skills.map((skill: string, index: number) => (
              <Badge key={index} variant="secondary" className="bg-violet-100 text-violet-800">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">Difficulty</h3>
          <Badge
            variant="outline"
            className={`mt-1 ${
              group.difficulty === "easy"
                ? "bg-green-50 text-green-700 border-green-200"
                : group.difficulty === "medium"
                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {group.difficulty.charAt(0).toUpperCase() + group.difficulty.slice(1)}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        {!isUpcoming ? (
          <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md text-center text-red-700">
            <XCircle className="h-5 w-5 mx-auto mb-1" />
            This interview has already taken place
          </div>
        ) : alreadyJoined ? (
          <div className="w-full p-3 bg-green-50 border border-green-200 rounded-md text-center text-green-700">
            <CheckCircle className="h-5 w-5 mx-auto mb-1" />
            You've already joined this group
          </div>
        ) : (
          <Button
            className="w-full bg-violet-600 hover:bg-violet-700"
            onClick={handleJoinGroup}
            disabled={joining}
          >
            {joining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Interview Group"
            )}
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/interview-groups")}
        >
          Back to Groups
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JoinGroup;
