"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isPast } from "date-fns";
import { Briefcase, Calendar, Clock, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function InterviewGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<InterviewGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/interview-groups/list');
        if (!response.ok) {
          throw new Error("Failed to fetch interview groups");
        }
        const data = await response.json();
        setGroups(data.groups);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const upcomingGroups = groups.filter(
    (group) => !isPast(new Date(group.dateTime)) && group.isActive
  );

  const pastGroups = groups.filter(
    (group) => isPast(new Date(group.dateTime)) || !group.isActive
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700 font-medium">Error loading interview groups</p>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Interview Groups</h1>
        <Button
          onClick={() => router.push('/interview-groups/create')}
          className="bg-violet-600 hover:bg-violet-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">Upcoming ({upcomingGroups.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastGroups.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingGroups.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-700 mb-2">No upcoming interview groups</h3>
              <p className="text-gray-500 mb-6">Create a new group to get started</p>
              <Button
                onClick={() => router.push('/interview-groups/create')}
                className="bg-violet-600 hover:bg-violet-700"
              >
                Create Group
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingGroups.map(group => (
                <GroupCard key={group.id} group={group} isPast={false} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastGroups.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-700">No past interview groups</h3>
              <p className="text-gray-500">Your completed interviews will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastGroups.map(group => (
                <GroupCard key={group.id} group={group} isPast={true} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GroupCard({ group, isPast }: { group: InterviewGroup, isPast: boolean }) {
  const interviewDate = new Date(group.dateTime);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50 border-b border-gray-100">
        <CardTitle className="truncate">{group.name}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{format(interviewDate, "MMMM d, yyyy")}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{format(interviewDate, "h:mm a")}</span>
          </div>

          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{group.role}</span>
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            {group.skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="secondary" className="bg-violet-100 text-violet-800">
                {skill}
              </Badge>
            ))}
            {group.skills.length > 3 && (
              <Badge variant="outline" className="text-gray-600">
                +{group.skills.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 border-t border-gray-100 pt-3 pb-3">
        <Link
          href={`/interview-groups/${group.id}`}
          className="w-full"
        >
          <Button
            variant={isPast ? "outline" : "default"}
            className={`w-full ${!isPast ? "bg-violet-600 hover:bg-violet-700" : ""}`}
          >
            {isPast ? "View Details" : "Join Session"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
