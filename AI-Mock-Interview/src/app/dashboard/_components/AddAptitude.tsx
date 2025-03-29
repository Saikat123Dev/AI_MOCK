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
import { chatSession, generateContent } from "../../../lib/AI/GeminiAIModel";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";

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



  useEffect(() => {
   
    setIsMounted(true);
    
    
    return () => {
      setIsMounted(false);
    };
  }, []);

  const aptitudeSections = [
    "Quantitative Aptitude",
    "Critical Reasoning",
    "CS Fundamentals",
  ];
  const [selectedSections, setSelectedSections] = useState([]);

  const handleSectionChange = (section: string) => {
    setSelectedSections((prev:any) =>
      prev.includes(section)
        ? prev.filter((s: string) => s !== section)
        : [...prev, section]
    );
  };

  const onSubmit = async (e: { preventDefault: () => void; }) => {
    setLoading(true);
    e.preventDefault();
  
    try {
     
  
      const prompt = `You are an expert AI-driven aptitude question generator specializing in company interview online assessment (OA) rounds. Generate a JSON response with the following specifications:

1. Total number of questions: [Number of Questions]
2. Difficulty level: '[Difficulty Level]'
3. Sections to include: [Selected Sections]

JSON Request Format: {
   "questions": [
     {
       "section": "Quantitative Aptitude",
       "difficulty": "medium",
       "questionText": "A train travels 360 kilometers in 4 hours. What is the speed of the train in meters per second?",
       "options": [
         {"id": "A", "text": "25 m/s"},
         {"id": "B", "text": "20 m/s"},
         {"id": "C", "text": "15 m/s"},
         {"id": "D", "text": "30 m/s"}
       ],
       "correctAnswer": "A"
     },
     {
       "section": "Critical Reasoning",
       "difficulty": "medium",
       "questionText": "If all managers are creative and some creative people are risk-takers, which of the following statements must be true?",
       "options": [
         {"id": "A", "text": "All managers are risk-takers"},
         {"id": "B", "text": "Some managers are risk-takers"},
         {"id": "C", "text": "No managers are risk-takers"},
         {"id": "D", "text": "Some creative people are not managers"}
       ],
       "correctAnswer": "B"
     }
   ]
}

Requirements for each question:
- Must be a multiple-choice question (MCQ)
- Exactly four options (A, B, C, D)
- Aligned with real-world company assessments
- Focus on problem-solving, logic, and relevant industry scenarios
- Distribute questions across the specified sections: [Selected Sections]

Strictly adhere to the JSON format. Do not include any additional text or any other symbols that affects the json format in between ,explanations outside the JSON structure.`;
  
      const mockJsonResponse = await generateContent(prompt);
      console.log(mockJsonResponse);

      function replaceColonsWithCommas(jsonData) {
        // Deep clone the original object to avoid modifying the source
        const processedData = JSON.parse(JSON.stringify(jsonData));
    
        // Recursive function to process each part of the JSON
        function processValue(value) {
            // If value is an object, process its properties
            if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value)) {
                    return value.map(processValue);
                }
                
                const processedObj = {};
                for (const key in value) {
                    // Replace colons in keys
                    const processedKey = key.replace(/:/g, ',');
                    
                    // Process the value recursively
                    processedObj[processedKey] = processValue(value[key]);
                }
                return processedObj;
            }
            
            // If value is a string, replace colons
            if (typeof value === 'string') {
                return value.replace(/:/g, ',');
            }
            
            // Return other types of values as is
            return value;
        }
    
        // Process the entire data structure
        return processValue(processedData);
    }
    
 
    
  
  
      const cleanedResponse = mockJsonResponse
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/^[^\{]*/, '')  
      .replace(/[^\}]*$/, '')  
      .trim();

        // Process the JSON
    const processedJson = replaceColonsWithCommas(cleanedResponse);
  
    
    // Log the result
    console.log(JSON.stringify(processedJson, null, 2));

      const parsedResponse = JSON.parse(processedJson);
  
      console.log("Parsed Response:", parsedResponse);
      setMockJsonResp(parsedResponse);
  
      // Your existing code for saving the interview data
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.log("Invalid JSON response:", error);
      } else {
        console.log("Error fetching interview questions:", error);
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
      
     
      </div>
      <div className="mb-4">
          <label className="block font-semibold">Select Aptitude Sections</label>
          {aptitudeSections.map((section) => (
            <div key={section} className="flex items-center gap-2 mt-2">
              <Checkbox
                checked={selectedSections.includes(section)}
                onCheckedChange={() => handleSectionChange(section)}
              />
              <span>{section}</span>
            </div>
          ))}
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