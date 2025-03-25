'use client'
import { useEffect, useState } from 'react';
import InterviewCard from './InterviewCard';

function AllInterviews() {
  const [InterviewList, setInterviewList] = useState([]);
  useEffect(() => {
    const findinterviews = async () => {
      try {
        const response = await fetch('/api/mockInterview/mockInterviewList');
        if (!response) {
          console.log('error in fetching interview questions');

        }
        const resp = await response.json();
        console.log(resp);
        setInterviewList(resp);


      }

      catch (error) {
        console.log('error in fetching all interviews', error.message || error);

      }
    }
    findinterviews();
  }, [])



  return (
    <div className=" mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-gray-200 mb-6 text-center">
        Previous Interview Lists
      </h1>
      {InterviewList.length == 0 &&
        <h2>You haven't atempted any interviews,Start your first Interview</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {InterviewList && InterviewList.map((interview, index) => (
          <InterviewCard interview={interview} key={index} />
        ))}
      </div>
    </div>

  )
}

export default AllInterviews
