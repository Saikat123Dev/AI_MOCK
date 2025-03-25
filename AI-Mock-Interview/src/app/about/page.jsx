import React from 'react'
import Navbar from '../dashboard/_components/navbar'
import Footer from '../dashboard/_components/Footer'

function page() {
  return (
    <div className="min-h-screen bg-[#232a34] text-white">
      <Navbar/>
      
      <main className="container mx-auto px-4 py-16">
        <section className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#019fe7]">About InterviewAI</h1>
            <div className="h-1 w-24 bg-[#0f6f9e] mx-auto mb-8"></div>
            <p className="text-xl text-gray-300">Revolutionizing technical interview preparation with AI</p>
          </div>
          
          <div className="space-y-12">
            <div className="bg-[#293240] p-8 rounded-xl border-l-4 border-[#019fe7] shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-[#019fe7]">Our Mission</h2>
              <p className="text-gray-300 leading-relaxed">
                At InterviewAI, we're transforming the way developers prepare for technical interviews. 
                Our platform leverages the power of Gemini AI to create personalized, realistic interview 
                experiences tailored to your specific tech stack and experience level.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[#293240] p-8 rounded-xl border-l-4 border-[#0f6f9e] shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-[#019fe7]">How It Works</h2>
                <ol className="list-decimal list-inside space-y-3 text-gray-300">
                  <li>Input your preferred tech stack and experience level</li>
                  <li>Our Gemini API generates relevant technical questions</li>
                  <li>Respond to questions as you would in a real interview</li>
                  <li>Receive AI-powered feedback and performance ratings</li>
                  <li>Track your progress with detailed performance analytics</li>
                </ol>
              </div>
              
              <div className="bg-[#293240] p-8 rounded-xl border-l-4 border-[#0f6f9e] shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-[#019fe7]">Key Features</h2>
                <ul className="list-disc list-inside space-y-3 text-gray-300">
                  <li>Personalized question generation based on tech stack</li>
                  <li>Real-time feedback on your responses</li>
                  <li>Comprehensive performance ratings</li>
                  <li>Visual performance analytics and progress tracking</li>
                  <li>Interview recordings for self-assessment</li>
                  <li>Customizable difficulty levels</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-[#293240] p-8 rounded-xl border-l-4 border-[#019fe7] shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-[#019fe7]">Our Technology</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Powered by Google's advanced Gemini API, our platform analyzes your responses using 
                sophisticated natural language processing algorithms to provide accurate and constructive 
                feedback. The system evaluates not just technical accuracy, but also communication clarity, 
                problem-solving approach, and solution efficiency.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Our performance analytics generate detailed visual graphs that track your improvement 
                over time, highlighting strengths and identifying areas that need additional focus.
              </p>
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-6 text-[#019fe7]">Ready to ace your next interview?</h2>
              <button className="bg-[#019fe7] hover:bg-[#0f6f9e] text-white font-bold py-3 px-8 rounded-lg transition duration-300">
                Start Practicing Today
              </button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer/>
    </div>
  )
}

export default page