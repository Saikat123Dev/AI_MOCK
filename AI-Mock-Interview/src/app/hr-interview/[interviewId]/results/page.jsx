"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle,
  Download,
  Loader2,
  ThumbsUp,
  Star,
  Book,
  BarChart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import styles from './Results.module.styl'

export default function InterviewResults() {
  const router = useRouter()
  const { interviewId } = useParams()
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/hrRound/${interviewId}/results`)
        if (!response.ok) throw new Error('Failed to fetch results')

        const data = await response.json()
        setResults(data)
      } catch (error) {
        console.error('Error fetching results:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [interviewId])

  const getTotalScore = () => {
    if (!results || !results.answers) return 0

    const totalScore = results.answers.reduce((sum, answer) => {
      return sum + (answer.score || 0)
    }, 0)

    return totalScore
  }

  const getMaxPossibleScore = () => {
    if (!results || !results.answers) return 0

    const maxScore = results.answers.reduce((sum, answer) => {
      return sum + answer.question.maxScore
    }, 0)

    return maxScore
  }

  const calculatePercentage = () => {
    const totalScore = getTotalScore()
    const maxScore = getMaxPossibleScore()

    return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
  }

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100

    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const downloadResults = () => {
    if (!results) return

    const jsonData = JSON.stringify(results, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `hr-interview-results-${interviewId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-2 text-xl">Loading results...</span>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Results Not Found</h1>
        <p className="mb-6">The results for this interview could not be found.</p>
        <Button onClick={() => router.push('/hr-interview')}>
          Return to Dashboard
        </Button>
      </div>
    )
  }

  const scorePercentage = calculatePercentage()
  const isPassing = scorePercentage >= 70

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => router.push('/hr-interview')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{results.interview.jobPosition}</h1>
          <p className="text-gray-500">Interview Results</p>
        </div>
        <Button
          variant="outline"
          onClick={downloadResults}
          className={styles.downloadButton}
        >
          <Download className="mr-2 h-4 w-4" /> Download Results
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className={styles.scoreCard}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-500">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <span className={`text-4xl font-bold ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
                {scorePercentage}%
              </span>
              <span className="text-sm text-gray-500 ml-2">
                ({getTotalScore()}/{getMaxPossibleScore()})
              </span>
            </div>
            <Progress
              value={scorePercentage}
              className={`h-2 mt-2 ${isPassing ? styles.passingProgress : styles.failingProgress}`}
            />
            <div className="mt-4 flex items-center">
              {isPassing ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-600 font-medium">Passed</span>
                </>
              ) : (
                <>
                  <Badge variant="destructive">Needs Improvement</Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-500">
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-2" /> Strengths
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.analysis?.strengths?.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <ThumbsUp className="h-4 w-4 text-green-600 mr-2 mt-1 shrink-0" />
                  <span className="text-sm">{strength}</span>
                </li>
              )) || (
                <li className="text-sm text-gray-500">No strengths analyzed</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-500">
              <div className="flex items-center">
                <Book className="h-4 w-4 mr-2" /> Areas to Improve
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.analysis?.improvements?.map((improvement, index) => (
                <li key={index} className="flex items-start">
                  <BarChart className="h-4 w-4 text-amber-600 mr-2 mt-1 shrink-0" />
                  <span className="text-sm">{improvement}</span>
                </li>
              )) || (
                <li className="text-sm text-gray-500">No improvement areas analyzed</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4">Question Analysis</h2>

      {results?.answers?.map((answer, index) => (
        <Card key={index} className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              Question {index + 1}: {answer.question.text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Score</span>
                <span className="text-sm font-medium">{answer.score}/{answer.question.maxScore}</span>
              </div>
              <Progress value={(answer.score / answer.question.maxScore) * 100} />
            </div>

            <div className="mb-4">
              <h4 className="font-medium mb-2">Your Answer:</h4>
              <p className="text-sm bg-gray-50 p-3 rounded-md">{answer.userAnswer}</p>
            </div>

            <div className="mb-4">
              <h4 className="font-medium mb-2">Feedback:</h4>
              <p className="text-sm">{answer.feedback}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Key Points Covered:</h4>
                <ul className="space-y-1">
                  {answer.keyPointsCovered?.map((point, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 shrink-0" />
                      {point}
                    </li>
                  )) || (
                    <li className="text-sm text-gray-500">No key points covered</li>
                  )}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Key Points Missed:</h4>
                <ul className="space-y-1">
                  {answer.keyPointsMissed?.map((point, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <BarChart className="h-4 w-4 text-amber-600 mr-2 shrink-0" />
                      {point}
                    </li>
                  )) || (
                    <li className="text-sm text-gray-500">No key points missed</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-center mt-12">
        <Button onClick={() => router.push('/hr-interview')} size="lg">
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
