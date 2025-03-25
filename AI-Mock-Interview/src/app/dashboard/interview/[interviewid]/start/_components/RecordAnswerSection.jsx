import { Button } from "@/components/ui/button";
import { chatSession, analyzeWithVideo, blobToBase64 } from "@/lib/AI/GeminiAIModel";
import { Loader2, Mic, PauseCircleIcon, Video, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import Webcam from "react-webcam";
import { toast } from "sonner";
import { CldUploadWidget } from 'next-cloudinary';

function RecordAnswerSection({ mockInterviewQuestion, activeQuestionIndex, interviewid }) {
  const [userAnswer, setUserAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [videoURL, setVideoURL] = useState(null);
  const [cloudinaryVideoURL, setCloudinaryVideoURL] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const videoChunksRef = useRef([]);
  const webcamRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const videoRecorderRef = useRef(null);
  
  
  // Video recording settings
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  // Start both audio and video recording
  const startRecording = async () => {
    try {
      setUserAnswer(""); // Clear previous answer
      setAnalysisResult(null);
      setIsRecording(true);
      audioChunksRef.current = [];
      videoChunksRef.current = [];

      // Release previous media URLs if they exist
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
        setAudioURL(null);
      }
      if (videoURL) {
        URL.revokeObjectURL(videoURL);
        setVideoURL(null);
      }
      
      // Reset Cloudinary URL
      setCloudinaryVideoURL(null);

      // Get audio stream
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      // Get video stream from webcam
      if (webcamRef.current) {
        const videoStream = webcamRef.current.stream;
        if (!videoStream) {
          throw new Error("Video stream not available");
        }
        
        // Combine audio and video tracks into a single stream for recording
        const combinedTracks = [...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()];
        mediaStreamRef.current = new MediaStream(combinedTracks);

        // Set up video recorder
        videoRecorderRef.current = new MediaRecorder(mediaStreamRef.current, {
          mimeType: 'video/webm; codecs=vp9,opus',
        });

        videoRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            videoChunksRef.current.push(event.data);
          }
        };

        videoRecorderRef.current.onstop = async () => {
          // Create proper video blob
          const videoFile = new Blob(videoChunksRef.current, { type: "video/webm" });
          setVideoBlob(videoFile);
          uploadVideoToCloudinary(videoFile);

          // Create and store video URL for playback
          const videoUrl = URL.createObjectURL(videoFile);
          console.log(
            `Video recorded and stored at URL: ${videoUrl} with blob size: ${videoFile.size}`
          );
          setVideoURL(videoUrl);
        };

        // Start video recording
        videoRecorderRef.current.start(100); // Collect data every 100ms
      }

      // Set up audio recorder (separate for transcription)
      mediaRecorderRef.current = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        // Create proper audio blob
        const audioFile = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioFile);

        // Create and store audio URL for playback
        const url = URL.createObjectURL(audioFile);
        setAudioURL(url);

        await transcribeAudio(audioFile);
      };

      // Start audio recording
      mediaRecorderRef.current.start(100);
      toast.success("Recording started (audio and video)");
      
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Could not access camera or microphone. Please check permissions.");
      setIsRecording(false);
    }
  };

  // Stop both audio and video recording
  const stopRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      
      // Stop video recording if active
      if (videoRecorderRef.current && videoRecorderRef.current.state !== "inactive") {
        videoRecorderRef.current.stop();
      }
      
      // Stop audio recording if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }

     
      toast.info("Recording stopped");
    }
  };

  // Transcribe audio using existing API
  const transcribeAudio = async (audioFile) => {
    if (!audioFile) return;
    setIsTranscribing(true);
    const formData = new FormData();
    formData.append("audio", audioFile);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      if (data.transcript) {
        setUserAnswer(data.transcript);
        toast.success("Audio transcribed successfully");
      } else {
        toast.error(data.error || "Failed to transcribe audio");
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast.error("Error processing your audio. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  // Upload video to Cloudinary
  const uploadVideoToCloudinary = async (file) => {
    if (!file) {
      toast.error("No video file to upload");
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'mockinterviews'); // Set your upload preset in Cloudinary dashboard

      const response = await fetch(`https://api.cloudinary.com/v1_1/dno7xkjeu/video/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload to Cloudinary failed');
      }

      const data = await response.json();
      return data.secure_url;
      if(data.success){
        console.log("successfully uploaded to cloudinary");
      }
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      toast.error('Failed to upload video');
      return null;
    }
  };

 

  // Analyze video with Gemini directly using the model
  const analyzeVideoWithGemini = async () => {
    const videoToAnalyze = videoBlob;
    
    if (!videoToAnalyze || !userAnswer) {
      toast.warning("Need both video and transcription to analyze");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Convert video blob to base64
      const videoBase64 = await blobToBase64(videoToAnalyze);
      
      // Create analysis prompt
      const analysisPrompt = `Analyze this interview video recording with the following transcript: "${userAnswer}". 
      Provide detailed feedback on:
      1. Voice tone and modulation - how confident, clear, and engaging is the speaker's voice?
      2. Confidence level - do they appear nervous or confident? What behaviors indicate this?
      3. Body language and posture - what does their posture and movement suggest?
      4. Facial expressions - are they animated, engaged, or flat?
      5. Speaking pace and clarity - do they speak at an appropriate pace and articulate clearly?
      6. Overall presentation - how professional and persuasive is their overall delivery?
      7. Improvement suggestions - what specific actions could improve their interview performance?
      
      Format your response as JSON with the following structure:
      {
        "voiceTone": "detailed analysis here",
        "confidence": "detailed analysis here",
        "bodyLanguage": "detailed analysis here",
        "facialExpressions": "detailed analysis here",
        "speakingPace": "detailed analysis here",
        "overallPresentation": "detailed analysis here",
        "improvementSuggestions": "specific actions for improvement strictly in a single string"
      }`;

      // Use the direct model method to analyze video
      const analysisResponse = await analyzeWithVideo(videoBase64, analysisPrompt);
      
      // Try to parse JSON from the response
      let jsonData;
      try {
       
        const jsonMatch = analysisResponse.match(/```(?:json)?([\s\S]*?)```/);
        const cleanedResponse = jsonMatch ? jsonMatch[1].trim() : analysisResponse.trim();
  
        // Ensure it is valid JSON before parsing
        if (cleanedResponse.startsWith("{") && cleanedResponse.endsWith("}")) {
          jsonData = JSON.parse(cleanedResponse);
        } else {
          throw new Error("Invalid JSON format received from Gemini model.");
        }
      } catch (error) {
        console.error("JSON Parsing Error:", error);
        // Create a structured format from unstructured text
        jsonData = {
          voiceTone: "Could not parse structured analysis",
          confidence: "Could not parse structured analysis",
          bodyLanguage: "Could not parse structured analysis",
          facialExpressions: "Could not parse structured analysis",
          speakingPace: "Could not parse structured analysis",
          overallPresentation: "Could not parse structured analysis",
          improvementSuggestions: "Could not parse structured analysis",
          rawAnalysis: analysisResponse
        };
      }

      setAnalysisResult(jsonData);
      toast.success("Video analysis completed");
      
    } catch (error) {
      console.error("Error analyzing video:", error);
      toast.error("Failed to analyze video: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save answer and analysis to database
  const updateAnswerToDB = async () => {
    if (userAnswer.length <= 10) {
      toast.warning("Answer is too short to be saved");
      return;
    }
  
    setLoading(true);
    try {
      
      // Upload video to Cloudinary if not already done
      let videoCloudinaryUrl = cloudinaryVideoURL;
      
      if (!videoCloudinaryUrl && videoBlob) {
        toast.info("Uploading video to Cloudinary...");
        videoCloudinaryUrl = await uploadVideoToCloudinary(videoBlob);
        if (videoCloudinaryUrl) {
          setCloudinaryVideoURL(videoCloudinaryUrl);
          console.log("video uploaded successfully");
        } else {
          throw new Error("Failed to upload video to Cloudinary");
        }
      }
      
      const feedbackPrompt = `Question: ${mockInterviewQuestion[activeQuestionIndex]?.question}, User Answer: ${userAnswer}.
      Give rating, feedback for improvement, and correct answer in JSON format with key correctAnswer`;
  
      const result = await chatSession.sendMessage(feedbackPrompt);
      const responseText = result.response.text();
  
      let jsonData;
      try {
        // Extract JSON using regex or fallback
        const jsonMatch = responseText.match(/```(?:json)?([\s\S]*?)```/);
        const cleanedResponse = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
  
        // Ensure it is valid JSON before parsing
        if (cleanedResponse.startsWith("{") && cleanedResponse.endsWith("}")) {
          jsonData = JSON.parse(cleanedResponse);
        } else {
          throw new Error("Invalid JSON format received from AI model.");
        }
      } catch (error) {
        console.error("JSON Parsing Error:", error);
        toast.error("Error parsing AI response. Please try again.");
        setLoading(false);
        return;
      } 
  
      // Combine text analysis with video analysis
      const combinedAnalysis = {
        ...jsonData,
        videoAnalysis: analysisResult
      };
      
      // console.log(combinedAnalysis);
  
      const mockUserAns = {
        mockInterviewId: interviewid,
        question: mockInterviewQuestion[activeQuestionIndex]?.question,
        answer: mockInterviewQuestion[activeQuestionIndex]?.answer,
        userAnswer,
        feedback: combinedAnalysis,
        videoUrl: videoCloudinaryUrl, // Add the Cloudinary URL to the database entry
      };
      console.log(mockUserAns);
      const resetForm = () => {
       
        setUserAnswer("");
        
       
        setAudioBlob(null);
        setVideoBlob(null);
        
        
        if (audioURL) {
          URL.revokeObjectURL(audioURL);
          setAudioURL(null);
        }
        if (videoURL) {
          URL.revokeObjectURL(videoURL);
          setVideoURL(null);
        }
        
       
        setCloudinaryVideoURL(null);
        
       
        setAnalysisResult(null);
      };
  
      const response = await fetch(`/api/mock/${interviewid}/ans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockUserAns),
      });
  
      if (response.ok) {
        toast.success("Answer and video analysis saved successfully!");
        resetForm();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error while saving your answer");
      }
    } catch (error) {
      console.error("Error saving answer:", error);
      toast.error(error.message || "Error while saving your answer");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden shadow-lg w-full max-w-2xl">
        <Image src="/webcam1.png" alt="webcam background" width={640} height={480} className="absolute z-0 opacity-50" />
        <Webcam 
          audio={false}
          ref={webcamRef}
          videoConstraints={videoConstraints}
          mirrored={true} 
          className="relative z-10 rounded-lg" 
          style={{ width: "100%", height: 400 }} 
        />
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing || isAnalyzing}
          className={`px-6 py-3 text-lg font-semibold rounded-full shadow-md ${
            isRecording ? "bg-red-600 hover:bg-red-700" : "bg-violet-600 hover:bg-violet-700"
          }`}
        >
          {isRecording ? (
            <><PauseCircleIcon className="mr-2" /> Stop Recording</>
          ) : (
            <><Mic className="mr-2" /> Start Recording</>
          )}
        </Button>

        {videoURL && (
          <Button
            onClick={analyzeVideoWithGemini}
            disabled={isAnalyzing || !videoURL || !userAnswer}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg font-semibold rounded-full shadow-md"
          >
            {isAnalyzing ? (
              <><Loader2 className="animate-spin mr-2" /> Analyzing...</>
            ) : (
              <><Video className="mr-2" /> Analyze Video</>
            )}
          </Button>
        )}

        
      </div>

      {(isTranscribing || isAnalyzing) && (
        <div className="flex items-center justify-center text-violet-700">
          <Loader2 className="animate-spin mr-2" />
          <span>{isTranscribing ? "Transcribing your answer..." : "Analyzing your performance..."}</span>
        </div>
      )}

      <div className="w-full max-w-2xl space-y-4">
        {(videoURL || cloudinaryVideoURL) && (
          <div className="bg-gray-100 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Your Video:</h2>
            {cloudinaryVideoURL ? (
              // Cloudinary video with optimized delivery
              <video 
                src={cloudinaryVideoURL} 
                controls 
                className="w-full rounded-md"
                poster={cloudinaryVideoURL.replace('/video/upload/', '/video/upload/q_auto,f_auto,so_auto,c_fill,w_640,h_480/')}
              />
            ) : (
              // Local video from recording
              <video src={videoURL} controls className="w-full rounded-md" />
            )}
          </div>
        )}

        {audioURL && (
          <div className="bg-gray-100 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Audio Playback:</h2>
            <audio src={audioURL} controls className="w-full" />
          </div>
        )}

        {(
          <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg shadow-inner">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Your Transcribed Answer:</h2>
            <textarea
  value={userAnswer}
  onChange={(e) => setUserAnswer(e.target.value)}
  placeholder="Type your answer..."
  className="w-full p-4 text-gray-700 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none whitespace-pre-wrap"
/>

          </div>
        )}

       
      </div>

      <Button
        onClick={updateAnswerToDB}
        disabled={loading || !userAnswer || userAnswer.length <= 10}
        className="bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-2 rounded-md"
      >
        {loading ? (
          <><Loader2 className="animate-spin mr-2" /> Processing...</>
        ) : (
          "Save Analysis & Answer"
        )}
      </Button>
    </div>
  );
}

export default RecordAnswerSection;