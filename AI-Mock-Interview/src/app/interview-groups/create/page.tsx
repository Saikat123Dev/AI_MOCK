import CreateInterviewGroup from "@/components/interviewGroups/Create-group";


export default function CreateInterviewGroupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Create a New Interview Group
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Set up a collaborative interview session with customized questions based on job role, skills, and experience level.
          </p>

          <CreateInterviewGroup />
        </div>
      </div>

    </div>
  );
}
