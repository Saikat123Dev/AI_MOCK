'use client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import React from 'react';

function InterviewCard({ interview }) {
    const router=useRouter();
    const onStart=()=>{
        router.push(`/dashboard/interview/${interview.id}/`);
    }
    const getFeedback=()=>{
        router.push(`/dashboard/interview/${interview.id}/feedback`);
    }
  return (
    <div 
      className="rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300 hover:scale-105 flex flex-col backdrop-blur-md"
      style={{ backgroundColor: 'rgba(80, 110, 150, 0.4)' }} // Lighter navy blue with transparency
    >
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-1" style={{ color: '#01a1e8' }}>{interview.jobPosition}</h2>
        <p className="text-sm text-gray-200">{interview.jobexperience} Years of Experience</p>
      </div>
      
      <div className="text-sm text-gray-200 mb-4">
        <span className="font-semibold" style={{ color: '#01a1e8' }}>Created At: </span>
        {new Date(interview.createdAt).toLocaleDateString()}
      </div>
      
      <div className="flex flex-col gap-3">
        <Button
          size="sm"
          onClick={onStart}
          className="bg-blue-500 text-white font-medium w-full hover:bg-blue-600 transition-colors"
        >
          Restart Interview
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={getFeedback}
          className="text-white font-medium w-full transition-colors border border-blue-300"
          style={{ backgroundColor: 'rgba(1, 161, 232, 0.6)', borderColor: '#01a1e8' }}
        >
          View Feedback
        </Button>
      </div>
    </div>
  );
}

export default InterviewCard;