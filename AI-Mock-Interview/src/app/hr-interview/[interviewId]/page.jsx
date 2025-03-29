"use client"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Mic, MicOff, Send, Video, VideoOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export default function HRInterviewPage({ params }) {
  const { interviewId } = React.use(params)
  const router = useRouter()

  const [interview, setInterview] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [userAnswer, setUserAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [messages, setMessages] = useState([])
  const [chatHistory, setChatHistory] = useState([]) // New state for chat history
  const [followUpQuestion, setFollowUpQuestion] = useState(null)
  const [isFollowUp, setIsFollowUp] = useState(false)
  const [interviewComplete, setInterviewComplete] = useState(false)

  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const chatContainerRef = useRef(null)

  // Fetch interview data and chat history
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch interview data
        const interviewResponse = await fetch(`/api/hrRound/${interviewId}`)
        if (!interviewResponse.ok) throw new Error('Failed to fetch interview')
        const interviewData = await interviewResponse.json()
        setInterview(interviewData)

        if (interviewData.questions && interviewData.questions.length > 0) {
          setCurrentQuestion(interviewData.questions[0])
          setMessages([
            {
              role: 'system',
              content: `Welcome to your HR interview for the ${interviewData.jobPosition} position. I'll be asking you some questions to get to know you better.`,
            },
            {
              role: 'interviewer',
              content: interviewData.questions[0].text,
            },
          ])
        }

        // Fetch chat history
        const chatResponse = await fetch(`/api/hrRound/${interviewId}/getChat`)
        if (!chatResponse.ok) throw new Error('Failed to fetch chat history')
        const chatData = await chatResponse.json()
        setChatHistory(chatData)

        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load interview data')
        setLoading(false)
      }
    }

    fetchData()
  }, [interviewId])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    let stream = null

    async function setupMedia() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoEnabled,
          audio: true,
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error('Error accessing media devices:', error)
        toast.error('Could not access camera or microphone')
        setIsVideoEnabled(false)
      }
    }

    if (isRecording || isVideoEnabled) {
      setupMedia()
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isRecording, isVideoEnabled])

  const startRecording = async () => {
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: true,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      mediaRecorderRef.current = new MediaRecorder(stream)

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        chunksRef.current = []
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return

    setSubmitting(true)
    stopRecording()

    try {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: userAnswer },
      ])

      let videoUrl = null
      if (chunksRef.current.length > 0) {
        const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' })
        videoUrl = URL.createObjectURL(videoBlob)
      }

      const endpoint = isFollowUp
        ? '/api/hrRound/answer/followup'
        : '/api/hrRound/answer'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hrQuestionId: isFollowUp ? followUpQuestion.id : currentQuestion.id,
          userAnswer,
          videoUrl,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit answer')
      }

      const data = await response.json()

      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `Score: ${data.analysis.score}/${isFollowUp ? followUpQuestion.maxScore : currentQuestion.maxScore}`,
          isScore: true,
        },
        {
          role: 'system',
          content: data.analysis.feedback,
        },
      ])

      if (data.nextQuestion && data.isEligibleForFollowUp) {
        setFollowUpQuestion(data.nextQuestion)
        setIsFollowUp(true)

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: 'interviewer',
              content: data.nextQuestion.text,
            },
          ])
        }, 1000)
      } else {
        const nextIndex = currentQuestionIndex + 1
        if (interview.questions[nextIndex]) {
          setCurrentQuestionIndex(nextIndex)
          setCurrentQuestion(interview.questions[nextIndex])
          setIsFollowUp(false)
          setUserAnswer('')

          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                role: 'interviewer',
                content: interview.questions[nextIndex].text,
              },
            ])
          }, 1000)
        } else {
          setInterviewComplete(true)

          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                role: 'system',
                content: 'Thank you for completing the interview! Your responses have been recorded. You can now view your results.',
              },
            ])
          }, 1000)
        }
      }

      setUserAnswer('')
    } catch (error) {
      console.error('Error submitting answer:', error)
      toast.error('Failed to submit answer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewResults = () => {
    router.push(`/hr-interview/${interviewId}/results`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg font-medium text-gray-700">Loading interview...</span>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Sidebar Chat History */}
      <div className="w-1/4 bg-white shadow-md p-6 fixed top-0 bottom-0 left-0 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Interview History</h2>
        <div className="space-y-4">
          {chatHistory.map((chat, index) => (
            <Card key={index} className="p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
              <p className="text-sm font-medium text-gray-800 mb-2">{chat.text}</p>
              <p className="text-sm text-gray-600">
                {chat.userAnswer ? chat.userAnswer : 'Not answered yet'}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-[25%]">
        {/* Header */}
        <header className="bg-white shadow-sm py-4 px-6 fixed top-0 left-[25%] right-0 z-10">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              HR Interview: {interview?.jobPosition}
            </h1>
            {interviewComplete && (
              <Button
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                onClick={handleViewResults}
              >
                View Results
              </Button>
            )}
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row pt-[80px] pb-[80px]">
          {/* Left Section: Fixed Video/Avatar */}
          <div className="w-full md:w-2/3 flex flex-col items-center fixed top-[80px] bottom-[80px] left-[25%] p-6">
            <div className="w-full max-w-lg relative h-full flex items-center">
              {isVideoEnabled ? (
                <div className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-gradient-to-br from-gray-800 to-black w-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-xl transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none rounded-xl" />
                  <div className="absolute bottom-4 left-4 flex items-center space-x-3">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                      <AvatarImage src="/interviewer.png" alt="Interviewer" />
                      <AvatarFallback>HR</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-semibold text-lg">Joanna</p>
                      <p className="text-gray-300 text-sm">HR Interviewer</p>
                    </div>
                  </div>
                  {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center bg-red-500 text-white px-3 py-1 rounded-full text-sm shadow-md">
                      <span className="animate-pulse mr-2">●</span> Recording
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex space-x-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white bg-black/50 hover:bg-black/70 rounded-full"
                      onClick={() => setIsVideoEnabled(false)}
                    >
                      <VideoOff className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative flex items-center justify-center h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-lg border border-gray-200 w-full">
                  <div className="text-center">
                    <Avatar className="h-32 w-32 mx-auto border-4 border-white shadow-lg">
                      <AvatarImage src="/interviewer.png" alt="Interviewer" />
                      <AvatarFallback>HR</AvatarFallback>
                    </Avatar>
                    <p className="mt-4 text-xl font-semibold text-gray-800">Joanna</p>
                    <p className="text-sm text-gray-500">HR Interviewer</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                    onClick={() => setIsVideoEnabled(true)}
                  >
                    <Video className="h-6 w-6" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Section: Scrollable Chat and Textarea */}
          <div className="w-full md:w-1/3 flex flex-col bg-white rounded-xl shadow-md p-6 ml-auto">
            {/* Chat Area */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4"
              style={{ maxHeight: 'calc(100vh - 240px)' }}
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <Card
                    className={`p-4 max-w-[85%] rounded-2xl shadow-sm transition-all duration-200 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : message.role === 'interviewer'
                        ? 'bg-gray-50 text-gray-800 border border-gray-200'
                        : message.isScore
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.content}
                  </Card>
                </div>
              ))}
            </div>

            {/* Textarea for User Input */}
            <div className="relative">
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className={`w-full p-4 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm resize-none transition-all duration-300 ${
                  submitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                rows={3}
                disabled={submitting}
              />
              <Button
                onClick={handleSubmitAnswer}
                disabled={submitting || !userAnswer.trim()}
                className="absolute right-3 bottom-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-lg p-2 transition-all duration-300"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="p-4 bg-white shadow-inner border-t flex justify-between items-center fixed bottom-0 left-[25%] right-0">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-lg transition-all duration-300"
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            >
              {isVideoEnabled ? <Video className="h-4 w-4 mr-2" /> : <VideoOff className="h-4 w-4 mr-2" />}
              {isVideoEnabled ? 'Disable Video' : 'Enable Video'}
            </Button>

            <Button
              variant={isRecording ? 'destructive' : 'outline'}
              className={`rounded-lg transition-all duration-300 ${
                isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-lg transition-all duration-300"
              onClick={() => router.push(`/hr-interview/${interviewId}`)}
            >
              Connect
            </Button>
            {interviewComplete && (
              <Button
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-300"
                onClick={handleViewResults}
              >
                Generate Feedback/Notes
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
