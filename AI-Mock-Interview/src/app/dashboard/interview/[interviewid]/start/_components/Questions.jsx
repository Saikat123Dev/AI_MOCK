import { LightbulbIcon, LucideVolume2, LucidePauseCircle, LucidePlayCircle, LucideStopCircle, LucideRepeat } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

function InterviewQuestions({ mockInterviewQuestion, activeQuestionIndex, setActiveQuestionIndex, InterviewerId }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechInstance, setSpeechInstance] = useState(null);
  const [pulsateEffect, setPulsateEffect] = useState(false);

  const interviewers = [
    { id: 1, name: "Alenrex Maity", imgSrc: "/interviewer_1.png" },
    { id: 2, name: "John Smith", imgSrc: "/interviewer_2.png" },
    { id: 3, name: "Ethan Vox", imgSrc: "/interviewer_3.png" },
  ];

  // Find the current interviewer based on the provided ID
  const currentInterviewer = interviewers.find(interviewer => interviewer.id === InterviewerId) || interviewers[0];

  // Auto-speak the question when it changes
  useEffect(() => {
    if (mockInterviewQuestion && mockInterviewQuestion.length > 0) {
      textToSpeech(mockInterviewQuestion[activeQuestionIndex]?.question);
    }
  }, [activeQuestionIndex]);

  // Pulsate effect control
  useEffect(() => {
    if (isSpeaking && !isPaused) {
      setPulsateEffect(true);
    } else {
      setPulsateEffect(false);
    }
  }, [isSpeaking, isPaused]);

  const textToSpeech = (text) => {
    if ('speechSynthesis' in window) {
      if (speechInstance) {
        window.speechSynthesis.cancel();
      }


    
      const speech = new SpeechSynthesisUtterance(text);
     
      // speech.lang = voice[7].lang;

     
      setSpeechInstance(speech);
      speech.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(speech);
      setIsSpeaking(true);
      setIsPaused(false);
    } else {
      alert('Your browser does not support text-to-speech functionality.');
    }
  };

  const pauseSpeech = () => {
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeech = () => {
    if (isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const repeatQuestion = () => {
    textToSpeech(mockInterviewQuestion[activeQuestionIndex]?.question);
  };

  return (
    mockInterviewQuestion && (
      <div className='p-6 bg-white border rounded-lg shadow-lg max-w-4xl mx-auto'>
        {/* Question Navigation */}
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6'>
          {mockInterviewQuestion.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveQuestionIndex(index)}
              className={`py-2 px-4 rounded-full text-xs md:text-sm text-center cursor-pointer transition-colors duration-200
              ${activeQuestionIndex === index
                  ? 'bg-violet-600 text-white shadow-lg'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
            >
              Question #{index + 1}
            </button>
          ))}
        </div>

        {/* Interviewer Section with Speaking Animation */}
        <div className='flex flex-col items-center mb-8'>
          <div className={`relative w-64 h-64 mb-4 rounded-full overflow-hidden border-4 ${pulsateEffect ? 'border-blue-500' : 'border-gray-300'} shadow-lg transition-all duration-300`}>
            <div className={`absolute inset-0 ${isSpeaking && !isPaused  ? 'animate-pulse bg-blue-100 opacity-50' : 'opacity-0'} rounded-full transition-opacity duration-300`}></div>
            <div className="relative w-full h-full">
              <Image
                src={currentInterviewer.imgSrc}
                alt={currentInterviewer.name}
                layout="fill"
                objectFit="cover"
                className={`rounded-full ${isSpeaking && !isPaused && 'animate-pulse'}`}
              />
              <div className={`absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 rounded-full ${isSpeaking && !isPaused && 'animate-ping'}`}></div>
              <div className="absolute inset-0 border-2 border-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <h3 className='text-xl font-semibold text-gray-800'>{currentInterviewer.name}</h3>
          <p className={`text-sm ${isSpeaking && !isPaused ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>                                      
            {isSpeaking && !isPaused ? "Speaking..." : "Your Interviewer"}
          </p>
        </div>

       

        {/* Speech Controls */}
        <div className='flex justify-center gap-4 items-center mb-8'>
          <button
            onClick={repeatQuestion}
            className='p-3 bg-violet-500 hover:bg-violet-600 text-white rounded-full transition-colors duration-200 shadow-md flex items-center justify-center'
            aria-label="Repeat question"
          >
            <LucideRepeat size={24} />
          </button>

          {isSpeaking && !isPaused ? (
            <button
              onClick={pauseSpeech}
              className='p-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition-colors duration-200 shadow-md flex items-center justify-center'
              aria-label="Pause speech"
            >
              <LucidePauseCircle size={24} />
            </button>
          ) : isPaused ? (
            <button
              onClick={resumeSpeech}
              className='p-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors duration-200 shadow-md flex items-center justify-center'
              aria-label="Resume speech"
            >
              <LucidePlayCircle size={24} />
            </button>
          ) : (
            <button
              onClick={() => textToSpeech(mockInterviewQuestion[activeQuestionIndex]?.question)}
              className='p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-200 shadow-md flex items-center justify-center'
              aria-label="Start speech"
            >
              <LucideVolume2 size={24} />
            </button>
          )}

          {isSpeaking && (
            <button
              onClick={stopSpeech}
              className='p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors duration-200 shadow-md flex items-center justify-center'
              aria-label="Stop speech"
            >
              <LucideStopCircle size={24} />
            </button>
          )}
        </div>

        {/* Note Section */}
        <div className='border rounded-lg p-6 bg-blue-50 shadow-inner'>
          <h2 className='flex gap-2 items-center text-violet-600 text-lg font-semibold mb-3'>
            <LightbulbIcon />
            <strong>Note:</strong>
          </h2>
          <p className='text-gray-700 text-sm leading-relaxed'>
            The interviewer will automatically read each question. You can use the controls below the interviewer to repeat,
            pause, or stop the question being read. Click on <strong>Record Answer</strong> when you're ready to respond.
            At the end of the interview, we will provide feedback along with the correct answers
            for each question and your responses.
          </p>
        </div>
      </div>
    )
  );
}

export default InterviewQuestions;