'use client'
import {useEffect}from 'react';
import { Button } from "@/components/ui/button";
import Footer from '@/app/dashboard/_components/Footer'
import Navbar from '@/app/dashboard/_components/navbar';
import Link from 'next/link';
import { useUser } from "@clerk/nextjs";




const Home = () => {
  const user=useUser();
   useEffect(() => {
      if (user) {
        saveUserToDB(user);
      }
    }, [user]);

    const saveUserToDB = async (user: any) => {
      console.log("I am BATMAN :",user);
      console.log("I am BATMAN :",user.user?.emailAddresses[0]?.emailAddress);
      try {
        await fetch("/api/save-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: user.user.id,
            email: user.user.emailAddresses[0].emailAddress,
            name: user.user.fullName,
            image: user.user.imageUrl,
          }),
        });
      } catch (error) {
        console.log("Error saving user:", error.message|| error);
      }
    };
  return (
    <div className="relative min-h-screen font-sans ">
      {/* Navbar */}
     

      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8 bg-cover bg-center" 
        style={{
          backgroundImage: 'linear-gradient(rgba(35, 42, 52, 0.85), rgba(35, 42, 52, 0.85)), url(./Interview.jpg)',
          backgroundColor: "#232a34", 
          color: "#01a1e8",
        }}>
        <div className="absolute inset-0 bg-opacity-70"></div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-8">
              Ace Your Next
              <br />
              <span className="text-[#00a2eb]">
                Interview Today
              </span>
            </h1>
            <p className="mt-4 text-lg sm:text-xl lg:text-2xl text-yellow-300 max-w-3xl mx-auto leading-relaxed">
              Transform your interview skills with dynamic mock interviews and
              personalized feedback powered by advanced AI technology.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                className="w-full sm:w-auto px-8 py-6 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-200" href={'/dashboard'}              >
                Start Your Journey
              </Link>
              <Link
                className="w-full sm:w-auto px-8 py-6 bg-gray-100 hover:bg-gray-200 text-gray-900 text-lg font-semibold rounded-xl transform hover:scale-105 transition-all duration-300 shadow-lg" href={'/about'}              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The rest of your component remains unchanged */}
      <div className="relative bg-[#232a34] text-white">
        {/* Content */}
        <div className="container mx-auto px-6 py-16 text-center">
          <h5 className="text-[#03a0e6] font-semibold uppercase mb-4">Tailored Preparation</h5>
          <h1 className="text-4xl font-bold mb-6">Prepare For Your Next Interview</h1>
          <p className="text-gray-300 max-w-2xl mx-auto mb-12">
            Our platform customizes mock interviews using AI, providing essential tools for better performance during real interviews.
          </p>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#04a3eb] p-6 rounded-lg text-gray-800 shadow-md">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-teal-200 flex items-center justify-center rounded-full">
                  <svg className="w-8 h-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 9.75L12 12m0 0l2.25 2.25M12 12l-2.25 2.25M12 12l2.25-2.25M15 3h4a1 1 0 011 1v4m-1-1L3 21M16 7H7v9" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg text-white font-semibold mb-2">Dynamic Practice</h3>
              <p className='text-white'>
                Engage with AI-generated questions for hands-on practice that adapts to your unique experience level.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#04a3eb] p-6 rounded-lg text-gray-800 shadow-md">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-teal-200 flex items-center justify-center rounded-full">
                  <svg className="w-8 h-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10l9-4m0 0l9 4m-9-4v11M12 12l-6 3m6-3l6 3" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg  text-white font-semibold mb-2">Expert Feedback</h3>
              <p className='text-white'>
                Receive detailed feedback and question-wise analysis to enhance your interview techniques effectively.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#04a3eb] p-6 rounded-lg text-gray-800 shadow-md">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-teal-200 flex items-center justify-center rounded-full">
                  <svg className="w-8 h-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 010 8M8 7a4 4 0 010 8m8-4H8" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg text-white font-semibold mb-2">Realistic Experience</h3>
              <p className='text-white'>
                Invite friends as interviewers and simulate real-world experiences to strengthen your confidence.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#04a3eb] p-6 rounded-lg text-gray-800 shadow-md">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-teal-200 flex items-center justify-center rounded-full">
                  <svg className="w-8 h-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v8m-4-4h8" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg  text-white font-semibold mb-2">Convenient Scheduling</h3>
              <p className='text-white'>
                Schedule interviews with ease using Calendly, allowing you to practice whenever it suits you.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#232a34] py-16 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
          {/* Text Section */}
          <div className="border-2 border-[#0a84bd] rounded-lg p-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
              {/* Text Section */}
              <div className="md:w-1/2 mb-8 md:mb-0">
                <p className="text-teal-500 font-semibold uppercase text-xl mb-4">
                  Holistic Skill Building
                </p>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Comprehensive Interview Solutions
                </h1>
                <p className="text-gray-400 mb-6">
                  Master Your Interviews offers a fully integrated platform that
                  prepares you for real interviews through AI-driven mock sessions and
                  personalized insights to boost your confidence.
                </p>
                <ul className="space-y-4 text-gray-400 ">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✔</span>
                    Real-Time Analysis
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✔</span>
                    Personalized Insights
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✔</span>
                    Receive immediate insights during mock sessions to refine your
                    performance on the spot.
                  </li>
                </ul>
                <div className="mt-6">
                  <button className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-green-600 transition">
                    Schedule Now
                  </button>
                </div>
              </div>
              {/* Illustration Section */}
              <div className="md:w-1/2 flex justify-center">
                <div className="relative">
                  <div className="absolute -top-10 -left-10 w-32 h-32 bg-teal-100 rounded-full" />
                  <div className="w-64 h-64 bg-yellow-300 rounded-lg"></div>
                  <div className="absolute -bottom-5 -right-5 w-24 h-32 bg-green-300 rounded-lg shadow-md"></div>
                  <div className="absolute bottom-10 left-10">
                    <div className="w-12 h-12 bg-blue-200 rounded-full"></div>
                    <div className="mt-2 w-6 h-12 bg-blue-400 rounded-md"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Features Grid */}
      <section className="py-20 bg-[#232a34]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#00a4ed]">Why Choose Us</h2>
            <p className="mt-4 text-xl text-white">Comprehensive interview preparation tools at your fingertips</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "AI-Powered Practice",
                description: "Get personalized feedback from our advanced AI system",
                icon: "🤖"
              },
              {
                title: "Real-time Analytics",
                description: "Track your progress with detailed performance metrics",
                icon: "📊"
              },
              {
                title: "Expert Guidance",
                description: "Learn from industry professionals and their experiences",
                icon: "👨‍🏫"
              }
            ].map((feature) => (
              <div key={feature.title} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-[#01a3eb] mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );
};

export default Home;