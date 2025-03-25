import { Button } from "@/components/ui/button";
import React from 'react';
import Footer from '../dashboard/_components/Footer';

function page() {
  return (
    <div>

      <section className="py-20 bg-[#232a34]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-6xl font-bold text-[#01a3eb]">Get Started Today</h2>
            <p className="mt-4 text-xl text-white">Take the first step towards interview success</p>
          </div>
          <form className="bg-[#232a34] rounded-xl shadow-lg p-8 border-2 border-[#01a1e8]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <input
                type="text"
                placeholder="First name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#232a34] text-white"
              />
              <input
                type="email"
                placeholder="Email address"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#232a34] text-white"
              />
            </div>
            <textarea
              placeholder="Your message"
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6 bg-[#232a34] text-white"
            ></textarea>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg"
            >
              Send Message
            </Button>
          </form>
        </div>
      </section>
      <Footer/>
    </div>
  )
}

export default page
