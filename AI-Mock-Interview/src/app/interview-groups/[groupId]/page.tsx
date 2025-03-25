import GroupDetails from "@/components/interviewGroups/GroupDetails";

interface GroupPageProps {
  params: {
    groupId: string;
  };
}

export default function GroupPage({ params }: GroupPageProps) {
  const { groupId } = params;
  return (
    <div className="container mx-auto py-8 px-4">
      <GroupDetails groupId={groupId} />
    </div>
  );
}
