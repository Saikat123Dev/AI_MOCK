// JoinGroupPage.tsx
import JoinGroup from "@/components/interviewGroups/JoinGroup";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
interface JoinGroupPageProps {
  params: {
    publicId: string;
  };
}

export default async function JoinGroupPage({ params }: JoinGroupPageProps) {
  const user = await auth();
  console.log("user",user);
  if (!user) {
    redirect("/sign-in");
  }
  const { publicId } = params;

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
        Join Interview Group
      </h1>
      <JoinGroup publicId={params.publicId} />
    </div>
  );
}
