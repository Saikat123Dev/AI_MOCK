"use client"
import React from 'react'
import { Button } from '../../../components/ui/button'
import { useUser, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

function Navbar() {
  const { isSignedIn, user } = useUser();

  React.useEffect(() => {
    if (user) {
      console.log("User ID:", user.id); // Ensure user is defined before accessing properties
    }
  }, [user]);

  let links = [
    {
      link: "Home",
      path: "/"
    },
    {
      link: "About",
      path: "/about"
    },
    {
      link: "Contact",
      path: "/contact"
    },
    {
      link: "Dashboard",
      path: "/dashboard"
    }
  ]

  return (
    <div>
      <nav className="sticky top-0 shadow-sm z-50 bg-[#232a34]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                <img src="./logo.jpg" alt="" className='rounded-full'/>
              </div>
              <span className="text-xl font-bold text-white">
                ExcelInterview.AI
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {links.map((link, index) => (
                <a
                  key={index}
                  href={link.path}
                  className="text-white hover:text-blue-600 transition-colors duration-300 text-xl uppercase tracking-wider"
                >
                  {link.link}
                </a>
              ))}

              {isSignedIn ? (
                <div className="flex items-center space-x-4">
                  <UserButton />
                  {user && (
                    <Link
                      href={`/profile/${user.id}`}
                      className="relative bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-indigo-600 hover:to-blue-600 text-white text-lg font-semibold px-6 py-2 rounded-full shadow-lg backdrop-blur-md transition-all duration-300 ease-in-out transform hover:scale-110 border border-white/20 flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      View Profile
                    </Link>
                  )}
                </div>
              ) : (
                <Link className="bg-[#232a34] hover:bg-blue-800 text-blue-400 text-xl px-4 py-1 rounded-sm border-b-2 border-[#106c99] font-medium uppercase tracking-wider" href={'/sign-in'}>
                  Get Started
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                className="text-gray-600 hover:text-blue-600 focus:outline-none"
                variant="ghost"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}

export default Navbar
