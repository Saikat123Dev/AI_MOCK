"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { LoaderPinwheelIcon, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function AddMockInterview() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [selectedInterviewer, setSelectedInterviewer] = useState(0);

  const [openDialog, setOpenDialog] = useState(false);
  const [jobdesc, setJobdesc] = useState("");
  const [role, setRole] = useState("");
  const [years, setYears] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [difficultyLevel, setDifficultyLevel] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [isMounted, setIsMounted] = useState(false);
  const [interviewType, setInterviewType] = useState("technical");
  const [skills, setSkills] = useState("");

  const interviewers = [
    { id: 1, name: "Alenrex Maity", imgSrc: "/interviewer_1.png" },
    { id: 2, name: "John Smith", imgSrc: "/interviewer_2.png" },
    { id: 3, name: "Ethan Vox", imgSrc: "/interviewer_3.png" },
  ];

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const onSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();

    try {
      if (!numQuestions) return;

      let apiEndpoint = "/api/mockInterview";
      let requestBody = {
        jobPosition: role,
        jobDescription: jobdesc,
        skills: skills.split(',').map(skill => skill.trim()).filter(skill => skill),
        jobExperience: years,
        difficultyLevel: difficultyLevel,
        totalQuestions: numQuestions
      };

      switch(interviewType) {
        case "hr":
          apiEndpoint = "/api/hrRound";
          // No special handling needed for HR interviews
          break;

        case "technical":
          apiEndpoint = "/api/mockInterview";
          if (!resumeFile) {
            throw new Error("Resume is required for technical interview");
          }

          // Handle resume upload for technical interviews
          const formData = new FormData();
          formData.append('resume', resumeFile);

          const uploadResponse = await fetch('/api/upload-resume', {
            method: 'POST',
            body: formData
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload resume');
          }

          const { resumeUrl } = await uploadResponse.json();
          requestBody.resumeUrl = resumeUrl;
          break;

        case "aptitude":
          apiEndpoint = "/api/aptitudeRound";
          break;
      }

      // Send data to the appropriate API endpoint
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to save interview data: ${errorBody}`);
      }

      const savedResponse = await response.json();
      console.log("Saved interview data:", savedResponse);
      if (response.ok) {
        setOpenDialog(false);

        // Redirect based on interview type
        if (interviewType === "hr") {
          router.push(`/hr-interview/${savedResponse.hrInterview.id}`);
        } else if (interviewType === "technical") {
          router.push(`/dashboard/interview/${savedResponse.id}`);
        } else if (interviewType === "aptitude") {
          router.push(`/aptitude-interview/${savedResponse.id}`);
        }
      }
    } catch (error) {
      console.error("Error in interview generation:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Button to open the dialog */}
      <div
        className="p-10 border rounded-lg bg-slate-300 hover:scale-100 hover:shadow-md cursor-pointer transition-all"
        onClick={() => setOpenDialog(true)}
      >
        <h2 className="font-bold text-lg text-center">+ Add New</h2>
      </div>

      {/* Only render Dialog client-side to avoid hydration errors */}
      {isMounted && (
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tell us more about yourself</DialogTitle>
            </DialogHeader>

            <div className="mt-4">
              <h2 className="text-xl font-semibold">
                Add details about your job position/role and experience
              </h2>
              <form onSubmit={onSubmit}>
                {/* Interview Type Selection */}
                <div className="flex flex-col mt-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Interview Type
                  </label>
                  <div className="mt-2 flex gap-4">
                    {["technical", "hr", "aptitude"].map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="radio"
                          name="interviewType"
                          value={type}
                          checked={interviewType === type}
                          onChange={(e) => setInterviewType(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize">{type} Round</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Role Input */}
                <div className="flex flex-col mt-3">
                  <label
                    htmlFor="role"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Job Role/Position
                  </label>
                  <input
                    type="text"
                    id="role"
                    placeholder="Enter your Job Role/Position"
                    className="mt-2 rounded-lg border p-3 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition duration-200"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>

                {/* Job Description Input */}
                <div className="flex flex-col mt-3">
                  <label
                    htmlFor="description"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Job Description/Tech Stacks
                  </label>
                  <textarea
                    id="description"
                    placeholder="Eg:- React, TailwindCSS"
                    className="mt-2 rounded-lg border p-3 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition duration-200"
                    value={jobdesc}
                    onChange={(e) => setJobdesc(e.target.value)}
                  />
                </div>

                {/* Skills Input (New) */}
                <div className="flex flex-col mt-3">
                  <label
                    htmlFor="skills"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="skills"
                    placeholder="Eg:- React, TypeScript, Node.js"
                    className="mt-2 rounded-lg border p-3 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition duration-200"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                  />
                </div>

                {/* Years of Experience Input */}
                <div className="flex flex-col mt-3">
                  <label
                    htmlFor="years"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    id="years"
                    placeholder="Eg:- 5"
                    className="mt-2 rounded-lg border p-3 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition duration-200"
                    required
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                  />
                </div>

                {/* Conditionally render resume upload only for technical round */}
                {interviewType === "technical" && (
                  <div className="flex flex-col mt-3">
                    <label
                      htmlFor="resume"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      Upload Resume
                    </label>
                    <div
                      className="mt-2 rounded-lg border border-dashed p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        id="resume"
                        ref={fileInputRef}
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-2 text-sm text-gray-600">
                        {resumeFile ? resumeFile.name : "Drag and drop your resume here or click to browse"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Supported formats: PDF, DOC, DOCX, TXT
                      </div>
                    </div>
                  </div>
                )}

                {/* Difficulty Level Selection */}
                <div className="flex flex-col mt-3">
                  <label
                    htmlFor="difficulty"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Difficulty Level
                  </label>
                  <div className="mt-2 flex gap-4">
                    {["easy", "medium", "hard"].map((level) => (
                      <label key={level} className="flex items-center">
                        <input
                          type="radio"
                          name="difficulty"
                          value={level}
                          checked={difficultyLevel === level}
                          onChange={(e) => setDifficultyLevel(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Interviewer Selection */}
                <div className="mt-4">
                  <h2 className="text-xl font-semibold">Select an Interviewer</h2>
                  <div className="flex gap-4 mt-2">
                    {interviewers.map((interviewer) => (
                      <div
                        key={interviewer.id}
                        className={`p-2 border rounded-lg cursor-pointer transition-all ${
                          selectedInterviewer === interviewer.id
                            ? "border-blue-800 shadow-lg"
                            : "border-gray-500"
                        }`}
                        onClick={() => setSelectedInterviewer(interviewer.id)}
                      >
                        <Image
                          src={interviewer.imgSrc}
                          alt={interviewer.name}
                          width={60}
                          height={50}
                          className="rounded-full"
                        />
                        <p className="text-center text-sm mt-1">{interviewer.name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Number of Questions Input */}
                <div className="flex flex-col mt-3">
                  <label
                    htmlFor="numQuestions"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    id="numQuestions"
                    min="1"
                    max="20"
                    className="mt-2 rounded-lg border p-3 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition duration-200"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-5 justify-between mt-5">
                  <Button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-800"
                    disabled={loading || (interviewType === "technical" && !resumeFile)}
                  >
                    {loading ? (
                      <>
                        <LoaderPinwheelIcon className="animate-spin mr-2" />
                        <span>Generating from AI</span>
                      </>
                    ) : (
                      "Start Interview"
                    )}
                  </Button>
                  <Button type="button" onClick={() => setOpenDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default AddMockInterview;
