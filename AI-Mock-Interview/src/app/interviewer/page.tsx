'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  Gender: 'MALE' | 'FEMALE' | 'OTHER';
  description?: string;
  ProfileImage?: string;
  Skills: string[];
  Type: string;
  Experience: {
    company: string;
    role: string;
    duration: string;
  }[];
  Linkedin?: string;
  Github?: string;
  AvgRating: number;
  createdAt: string;
}

export default function InterviewersPage() {
  const [interviewers, setInterviewers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInterviewers = async () => {
      try {
        const response = await fetch('/api/interviewer/getAllInterviewer');
        if (!response.ok) {
          throw new Error('Failed to fetch interviewers');
        }
        const data = await response.json();
        setInterviewers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchInterviewers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Our Interviewers
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interviewers.map((interviewer) => (
          <div
            key={interviewer.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center mb-4">
              {interviewer.ProfileImage && (
                <Image
                  src={interviewer.ProfileImage}
                  alt={`${interviewer.name}'s profile`}
                  width={64}
                  height={64}
                  className="rounded-full mr-4"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {interviewer.name}
                </h2>
                <p className="text-gray-600 text-sm">{interviewer.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-gray-600">
                <span className="font-medium">Gender:</span>{' '}
                {interviewer.Gender.toLowerCase()}
              </p>

              {interviewer.description && (
                <p className="text-gray-700 text-sm">{interviewer.description}</p>
              )}

              <div>
                <h3 className="font-medium text-gray-800 mb-1">Skills:</h3>
                <div className="flex flex-wrap gap-2">
                  {interviewer.Skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {interviewer.Experience.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Experience:</h3>
                  <div className="space-y-2">
                    {interviewer.Experience.map((exp, index) => (
                      <div
                        key={index}
                        className="text-sm text-gray-700 bg-gray-50 p-2 rounded"
                      >
                        <p className="font-medium">{exp.role}</p>
                        <p>{exp.company}</p>
                        <p className="text-gray-600">{exp.duration}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                {interviewer.Linkedin && (
                  <a
                    href={interviewer.Linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    LinkedIn
                  </a>
                )}
                {interviewer.Github && (
                  <a
                    href={interviewer.Github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-800 hover:text-gray-900 transition-colors"
                  >
                    GitHub
                  </a>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800">
                  Rating: {interviewer.AvgRating}/5
                </p>
                <p className="text-xs text-gray-500">
                  Joined: {new Date(interviewer.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
