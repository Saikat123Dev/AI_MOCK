"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { LoaderPinwheelIcon, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { chatSession } from "../../../lib/AI/GeminiAIModel";
import Image from "next/image";

function AddMockInterview() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const[selectedInterviewer,setSelectedInterviewer]=useState(0)
  
  const [openDialog, setOpenDialog] = useState(false);
  const [jobdesc, setJobdesc] = useState("");
  const [role, setRole] = useState("");
  const [years, setYears] = useState("");
  const [loading, setLoading] = useState(false);
  const [mockJsonresp, setMockJsonResp] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [isMounted, setIsMounted] = useState(false);

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

  const saveUserToDB = async (user) => {
    try {
      await fetch("/api/save-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          email: user.emailAddresses[0],
          name: user.fullName,
          image: user.imageUrl,
        }),
      });
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

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
  
  };

  const onSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();

   

    try {
      if (!numQuestions) return;

      // Send the message to the chat session
     const fileData = await resumeFile.arrayBuffer();
    const fileBytes = new Uint8Array(fileData);
    
    // Create content parts array with both text and file
    const contentParts = [
      {
        text: `You are an expert interviewer tasked with creating a set of tailored interview questions and answers for a candidate. Consider the following details:
        - Job Position: ${role}
        - Job Description: ${jobdesc}
        - Experience Required: ${years} years
        - Difficulty Level: ${difficultyLevel}
        - Number of Questions: ${numQuestions}
        
        I'm attaching the candidate's resume as a file. Use it to generate personalized interview questions.
        
        Task:
        Generate exactly ${numQuestions} interview questions and their corresponding answers in JSON format with the following structure:
        {
          "interviewQuestions": [
            {
              "question": "Your question here",
              "answer": "Your answer here"
            }
          ]
        }

       Guidelines:
1. Craft the questions based on the candidate's resume, aligning with the job description,Job Role and required experience.  
2. Vary the difficulty level accordingly, ensuring a progression from foundational concepts to more complex scenarios.  
3. Include a balance of:
   - Technical questions relevant to the job role.  
   - Behavioral questions to assess soft skills and experience.  
   - Situational or problem-solving questions related to past work experience.  
4. Ensure the response strictly adheres to the provided JSON structure without additional fields, formatting, or preambles.  
Note: The questions should be realistic and designed to assess the candidate's skills in alignment with their resume, work history, and the job's key responsibilities.  
Output only the JSON structure without any preamble or explanations.
`
      },
      {
        inlineData: {
          mimeType: resumeFile.type,
          data: Buffer.from(fileBytes).toString('base64')
        }
      }
    ];

    // Send the message with file to the chat session
    const res = await chatSession.sendMessageStream(contentParts);
    
    // Process response and continue with your existing logic
    let mockJsonResponse = '';
    for await (const chunk of res.stream) {
      mockJsonResponse += chunk.text();
    }


    const cleanedResponse = mockJsonResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedResponse = JSON.parse(cleanedResponse);

    console.log("Parsed Response:", parsedResponse);
    setMockJsonResp(parsedResponse);
      const mockData = {
        jobDesc: jobdesc,
        jobPosition: role,
        jobexperience: years,
        interviewerImageId:selectedInterviewer,
       
        difficultyLevel: difficultyLevel,
        numQuestions: numQuestions,
        MockResponse: parsedResponse
      };
      console.log("Mock Data:", mockData); 

      
      const response = await fetch("/api/mockInterview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockData),
      });

      if (!response.ok) {
        throw new Error("Failed to save interview data");
      }

      const savedResponse = await response.json();
      if (response) {
        setOpenDialog(false);
        router.push(`/dashboard/interview/${savedResponse.id}`)
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.log("Invalid JSON response:", error);
        // Display a user-friendly error message
      } else {
        console.log("Error fetching interview questions:", error);
        // Handle other errors
      }
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
            
            {/* Removed DialogDescription to fix hydration error */}
            <div className="mt-4">
              <h2 className="text-xl font-semibold">
                Add details about your job position/role and experience
              </h2>
              <form onSubmit={onSubmit}>
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

                {/* Resume Upload */}
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
                    disabled={loading}
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