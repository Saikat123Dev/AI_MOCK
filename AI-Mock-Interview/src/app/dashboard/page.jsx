"use client"
import Link from "next/link"
import { useState } from "react"
import AddMockInterview from './_components/AddMockInterview'
import Footer from './_components/Footer'
import AllInterviews from './_components/allInterviews'
function page() {
  const[state , setState] = useState(false)
  return (
    <div className='min-h-screen flex flex-col relative'>

      <div className='flex flex-col md:flex-row flex-1'>
        {/* Dashboard Side */}
        <div
          className='w-full md:w-1/2 min-h-screen relative'
          style={{
            backgroundColor: "#232a34",
            color: "#01a1e8",
            backgroundImage: "url('./Dashboard.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }}
        >
          <div className='absolute inset-0 bg-black bg-opacity-60'></div>
          <div className='relative z-10 p-10'>
            <div className='text-center mb-10 mt-10'>
              <h2 className='font-bold text-4xl mb-4'>Dashboard</h2>
              <h1 className='text-gray-400 text-xl'>Create and Start your AI Mock Interview</h1>
              <p className='mt-4 max-w-xl mx-auto text-gray-300'>
                Prepare for your next job interview with our AI-powered mock interviews.
                Practice responding to common interview questions and receive instant feedback.
              </p>
            </div>

            {/* Add Mock Interview Component */}
            <div className='max-w-md mx-auto'>
              <AddMockInterview />
            </div>

            <div className='py-10'>
              <AllInterviews/>
            </div>
          </div>
        </div>

        {/* Battle Royale Side */}
        <div
          className='w-full md:w-1/2 min-h-screen relative'
          style={{
            backgroundImage: "url('./img2.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }}
        >

          <div className='absolute inset-0 bg-black bg-opacity-50'></div>

          {/* Battle Royale Content */}
          <div className='relative z-10 p-10 flex flex-col items-center justify-center h-full'>
            <h2 className='font-bold text-4xl mb-4 text-white'>Battle Royale</h2>
            <p className='text-gray-200 text-xl mb-8 text-center max-w-md'>
              Challenge your friends to interview battles and see who performs better!
            </p>
            <Link href="/interview-groups/create">
        <button className='bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-xl transform transition duration-300 hover:scale-105 shadow-lg'>
          Start Battle
        </button>
      </Link>


          </div>
        </div>
      </div>

      <Footer className='relative z-10'/>
    </div>
  );
}

export default page
