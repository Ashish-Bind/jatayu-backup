import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import {
  CheckCircle,
  XCircle,
  Clock,
  Send,
  StopCircle,
  RefreshCw,
  Home,
  BarChart2,
  Star,
  BookOpen,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const AssessmentChatbot = () => {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [skill, setSkill] = useState('')
  const [userAnswer, setUserAnswer] = useState('')
  const [isAssessmentComplete, setIsAssessmentComplete] = useState(false)
  const [candidateReport, setCandidateReport] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [questionPending, setQuestionPending] = useState(false)
  const [awaitingNextQuestion, setAwaitingNextQuestion] = useState(false)
  const initialStartComplete = useRef(false)
  const chatContainerRef = useRef(null)
  const currentMcqId = useRef(null)

  const [fullscreenWarnings, setFullscreenWarnings] = useState(0)
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false)
  const [tabSwitches, setTabSwitches] = useState(0)
  const [proctoringRemarks, setProctoringRemarks] = useState([])
  const MAX_FULLSCREEN_WARNINGS = 2

  const { user } = useAuth()

  const requestFullscreen = () => {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.error('Fullscreen request failed:', err)
        setErrorMessage(
          'Failed to enter fullscreen mode. Please enable fullscreen manually.'
        )
      })
    }
  }

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document
        .exitFullscreen()
        .catch((err) => console.error('Exit fullscreen failed:', err))
    }
  }

  const handleFullscreenChange = () => {
    if (
      !document.fullscreenElement &&
      !isAssessmentComplete &&
      initialStartComplete.current
    ) {
      if (fullscreenWarnings < MAX_FULLSCREEN_WARNINGS) {
        setShowFullscreenWarning(true)
        setFullscreenWarnings((prev) => prev + 1)
        setProctoringRemarks((prev) => [
          ...prev,
          `Exited fullscreen mode at ${new Date().toISOString()}`,
        ])
      } else {
        console.log('Ending Assessment due to repeated fullscreen exits')
        setProctoringRemarks((prev) => [
          ...prev,
          `Assessment terminated due to repeated fullscreen exits at ${new Date().toISOString()}`,
        ])
        endAssessment(true, 'Terminated due to repeated fullscreen exits')
      }
    }
  }

  const handleVisibilityChange = () => {
    if (
      document.hidden &&
      !isAssessmentComplete &&
      initialStartComplete.current
    ) {
      setTabSwitches((prev) => prev + 1)
      setProctoringRemarks((prev) => [
        ...prev,
        `Tab switch or window minimization detected at ${new Date().toISOString()}`,
      ])
    }
  }

  const preventCopyPaste = (e) => {
    e.preventDefault()
    setProctoringRemarks((prev) => [
      ...prev,
      `Attempted copy/paste at ${new Date().toISOString()}`,
    ])
  }

  const startAssessment = () => {
    setIsLoading(true)
    setErrorMessage('')
    setMessages([])
    setUserAnswer('')
    setQuestionNumber(0)
    setCurrentQuestion(null)
    setQuestionPending(false)
    setAwaitingNextQuestion(false)
    setIsAssessmentComplete(false)
    setFullscreenWarnings(0)
    setTabSwitches(0)
    setProctoringRemarks([])
    initialStartComplete.current = false
    currentMcqId.current = null
    requestFullscreen()
    console.log('Starting assessment for attemptId:', attemptId)
    fetch(`http://localhost:5000/api/assessment/start/${attemptId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error || `HTTP error ${response.status}`)
          })
        }
        return response.json()
      })
      .then((data) => {
        setTotalQuestions(data.total_questions)
        setTimeLeft(data.test_duration)
        initialStartComplete.current = true
      })
      .catch((error) => {
        console.error('Error starting assessment session:', error)
        setErrorMessage(
          `Failed to start the assessment: ${error.message}. Please retry or return to dashboard.`
        )
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    if (attemptId) {
      startAssessment()
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      exitFullscreen()
    }
  }, [attemptId])

  useEffect(() => {
    if (
      initialStartComplete.current &&
      !questionPending &&
      !currentQuestion &&
      !isAssessmentComplete &&
      !awaitingNextQuestion
    ) {
      fetchNextQuestion()
    }
  }, [
    initialStartComplete.current,
    questionPending,
    currentQuestion,
    isAssessmentComplete,
    awaitingNextQuestion,
  ])

  useEffect(() => {
    if (
      awaitingNextQuestion &&
      !questionPending &&
      !isLoading &&
      !isAssessmentComplete
    ) {
      setTimeout(() => {
        fetchNextQuestion()
        setAwaitingNextQuestion(false)
      }, 1500)
    }
  }, [awaitingNextQuestion, questionPending, isLoading, isAssessmentComplete])

  useEffect(() => {
    if (timeLeft !== null) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) {
            clearInterval(timer)
            endAssessment()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timeLeft])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const fetchNextQuestion = () => {
    if (isLoading || isAssessmentComplete || questionPending) {
      console.log('Blocked fetchNextQuestion:', {
        isLoading,
        isAssessmentComplete,
        questionPending,
      })
      return
    }
    setQuestionPending(true)
    setIsLoading(true)
    setUserAnswer('')
    console.log('Simulating question generation for attemptId:', attemptId)
    // Simulate 2-second delay for question generation
    setTimeout(() => {
      console.log('Fetching next question for attemptId:', attemptId)
      fetch(`http://localhost:5000/api/assessment/next-question/${attemptId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((data) => {
              throw new Error(data.error || `HTTP error ${response.status}`)
            })
          }
          return response.json()
        })
        .then((data) => {
          if (data.message === 'Assessment completed') {
            setIsAssessmentComplete(true)
            setCandidateReport(data.candidate_report)
            setMessages((prev) => [
              ...prev,
              {
                type: 'bot',
                content: (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Assessment completed! Check your results below.
                  </div>
                ),
              },
            ])
          } else if (data.question) {
            setCurrentQuestion(data.question)
            setSkill(data.skill)
            setQuestionNumber(data.question_number)
            currentMcqId.current = data.question.mcq_id
            const newMessages = []
            if (questionNumber === 0 || data.question_number === 1) {
              newMessages.push({
                type: 'bot',
                content: (
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-indigo-600" />
                    {data.greeting}
                  </div>
                ),
              })
            }
            newMessages.push({
              type: 'bot',
              content: `Q${data.question_number}: ${data.question.question}`,
            })
            newMessages.push({
              type: 'bot',
              content: (
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Skill: {data.skill.replace('_', ' ')}
                </div>
              ),
            })
            newMessages.push({
              type: 'bot',
              content: 'Options:',
              options: data.question.options,
              mcqId: data.question.mcq_id,
            })
            setMessages((prev) => [...prev, ...newMessages])
            setErrorMessage('')
          } else {
            setErrorMessage('No more questions available.')
          }
        })
        .catch((error) => {
          console.error('Error fetching next question:', error)
          setErrorMessage(`Failed to fetch the next question: ${error.message}`)
        })
        .finally(() => {
          setIsLoading(false)
          setQuestionPending(false)
        })
    }, 2000) // 2-second delay
  }

  const handleAnswerSubmit = (e) => {
    e.preventDefault()
    if (!userAnswer) {
      setErrorMessage('Please select an answer.')
      return
    }
    if (isLoading || questionPending) {
      console.log('Blocked handleAnswerSubmit:', { isLoading, questionPending })
      return
    }
    setIsLoading(true)
    const startTime = Date.now()
    setMessages((prev) => [
      ...prev,
      {
        type: 'user',
        content: (
          <div className="flex items-center justify-end gap-2 text-sm">
            Selected option {userAnswer}
            <Send className="w-4 h-4 text-indigo-600" />
          </div>
        ),
      },
    ])
    console.log('Submitting answer:', {
      skill,
      answer: userAnswer,
      mcq_id: currentQuestion.mcq_id,
    })
    fetch(`http://localhost:5000/api/assessment/submit-answer/${attemptId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skill: skill,
        answer: userAnswer,
        time_taken: (Date.now() - startTime) / 1000,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error || `HTTP error ${response.status}`)
          })
        }
        return response.json()
      })
      .then((data) => {
        setMessages((prev) => [
          ...prev,
          {
            type: 'bot',
            content: (
              <div className="flex items-center gap-2 text-sm">
                {data.feedback}
              </div>
            ),
          },
        ])
        setCurrentQuestion(null)
        currentMcqId.current = null
        setUserAnswer('')
        setAwaitingNextQuestion(true)
      })
      .catch((error) => {
        console.error('Error submitting answer:', error)
        setErrorMessage(`Failed to submit your answer: ${error.message}`)
      })
      .finally(() => setIsLoading(false))
  }

  const endAssessment = (forced = false, remark = '') => {
    if (isLoading || questionPending) {
      console.log('Blocked endAssessment:', { isLoading, questionPending })
      return
    }
    setIsLoading(true)
    fetch(`http://localhost:5000/api/assessment/end/${attemptId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proctoring_data: {
          tab_switches: tabSwitches,
          fullscreen_warnings: fullscreenWarnings,
          remarks: proctoringRemarks,
          forced_termination: forced,
          termination_reason: remark,
        },
      }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error || `HTTP error ${response.status}`)
          })
        }
        return response.json()
      })
      .then((data) => {
        setIsAssessmentComplete(true)
        setCandidateReport(data.candidate_report)
        setMessages((prev) => [
          ...prev,
          {
            type: 'bot',
            content: (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Assessment completed! Check your results below.
              </div>
            ),
          },
        ])
      })
      .catch((error) => {
        console.error('Error ending assessment:', error)
        setErrorMessage(`Failed to end assessment: ${error.message}`)
      })
      .finally(() => {
        setIsLoading(false)
        exitFullscreen()
      })
  }

  const formatTime = (seconds) => {
    if (seconds === null) return '0:00'
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
  }

  const handleOptionSelect = (value) => {
    console.log('Selected option:', value, 'for mcq_id:', currentMcqId.current)
    setUserAnswer(value)
  }

  if (isAssessmentComplete && candidateReport) {
    const chartData = {
      labels: Object.keys(candidateReport).map((skill) =>
        skill.replace('_', ' ')
      ),
      datasets: [
        {
          label: 'Accuracy (%)',
          data: Object.values(candidateReport).map(
            (stats) => stats.accuracy_percent
          ),
          backgroundColor: 'rgba(79, 70, 229, 0.6)', // indigo-600
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 1,
          hoverBackgroundColor: 'rgba(79, 70, 229, 0.8)',
        },
      ],
    }

    const chartOptions = {
      responsive: true,
      plugins: {
        legend: { position: 'top', labels: { font: { size: 12 } } },
        title: {
          display: true,
          text: 'Skill-wise Accuracy',
          font: { size: 16, weight: 'bold' },
          padding: { top: 10, bottom: 20 },
        },
        tooltip: { backgroundColor: '#1f2937', titleFont: { size: 12 } },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Accuracy (%)',
            font: { size: 12 },
          },
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
        },
        x: {
          title: {
            display: true,
            text: 'Skills',
            font: { size: 12 },
          },
          grid: { display: false },
        },
      },
      animation: { duration: 1000, easing: 'easeInOutQuad' },
    }

    const totalAttempted = Object.values(candidateReport).reduce(
      (sum, stats) => sum + stats.questions_attempted,
      0
    )
    const totalCorrect = Object.values(candidateReport).reduce(
      (sum, stats) => sum + stats.correct_answers,
      0
    )
    const overallAccuracy =
      totalAttempted > 0
        ? ((totalCorrect / totalAttempted) * 100).toFixed(2)
        : 0

    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar userType={user.role} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-600" />
            Assessment Completed
          </h1>
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-gray-200 mb-8">
            <p className="text-green-700 text-sm font-medium mb-6 flex items-center gap-2">
              <Star className="w-4 h-4 text-indigo-600" />
              Congratulations! You've completed the assessment.
            </p>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-600" />
                  Performance Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-indigo-50 p-5 rounded-md border border-gray-200 hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Questions Attempted
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {totalAttempted} / {totalQuestions}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-5 rounded-md border border-gray-200 hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-600" />
                      Correct Answers
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {totalCorrect}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-5 rounded-md border border-gray-200 hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      Overall Accuracy
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {overallAccuracy}%
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Skill-wise Breakdown
                </h3>
                <div className="space-y-4">
                  {Object.entries(candidateReport).map(([skill, stats]) => (
                    <div
                      key={skill}
                      className="bg-white p-5 rounded-md border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4 text-indigo-600" />
                        {skill.replace('_', ' ')}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                        <div>
                          <p className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-indigo-600" />
                            Questions Attempted: {stats.questions_attempted}
                          </p>
                          <p className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-indigo-600" />
                            Correct Answers: {stats.correct_answers}
                          </p>
                        </div>
                        <div>
                          <p className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-indigo-600" />
                            Accuracy: {stats.accuracy_percent}%
                          </p>
                          <p className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-indigo-600" />
                            Performance Band:{' '}
                            <span className="capitalize">
                              {stats.final_band}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000 ease-in-out"
                            style={{ width: `${stats.accuracy_percent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-600" />
                  Performance Visualization
                </h3>
                <div className="bg-white p-5 rounded-md border border-gray-200">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Insights & Recommendations
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                  {Object.entries(candidateReport).map(([skill, stats]) => (
                    <li key={skill} className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-indigo-600 mt-1" />
                      <span>
                        <span className="font-semibold">
                          {skill.replace('_', ' ')}:
                        </span>{' '}
                        {stats.accuracy_percent >= 80
                          ? `Excellent performance! Consider advanced roles requiring ${skill.replace(
                              '_',
                              ' '
                            )}.`
                          : stats.accuracy_percent >= 50
                          ? `Good effort. Review ${skill.replace(
                              '_',
                              ' '
                            )} concepts to boost your score.`
                          : `Focus on ${skill.replace(
                              '_',
                              ' '
                            )} fundamentals to improve your performance.`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => navigate('/candidate/dashboard')}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Assessment Chatbot
          </h1>
          <div className="bg-indigo-50 px-3 py-2 rounded-md text-sm font-medium text-gray-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Time Left: {formatTime(timeLeft)}
          </div>
        </div>
        {errorMessage && (
          <div
            className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-6 rounded-md text-sm flex items-center gap-2"
            role="alert"
          >
            <XCircle className="w-4 h-4" />
            {errorMessage}
            <div className="ml-auto flex gap-2">
              <button
                onClick={startAssessment}
                disabled={isLoading}
                className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
              <button
                onClick={() => navigate('/candidate/dashboard')}
                className="flex items-center px-3 py-1 bg-gray-500 text-white rounded-md text-xs font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 gap-1"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </button>
            </div>
          </div>
        )}
        {showFullscreenWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Fullscreen Mode Required
              </h2>
              <p className="mt-2 text-sm text-gray-700">
                You have exited fullscreen mode. Please return to fullscreen to
                continue the assessment. Warning {fullscreenWarnings} of{' '}
                {MAX_FULLSCREEN_WARNINGS}.
              </p>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setShowFullscreenWarning(false)
                    handleFullscreenChange()
                    requestFullscreen()
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                  spellCheck={false}
                >
                  {' '}
                  Return to Fullscreen
                </button>
              </div>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 mb-6 text-center text-sm text-gray-700 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Generating with AI...
          </div>
        )}
        <div
          ref={chatContainerRef}
          onCopy={preventCopyPaste}
          onPaste={preventCopyPaste}
          onCut={preventCopyPaste}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-[32rem] w-[48rem] overflow-y-auto mb-6 relative"
        >
          {messages.map((msg, index) => (
            <div
              key={`message-${index}`}
              className={`mb-4 flex ${
                msg.type === 'bot' ? 'justify-start' : 'justify-end'
              } animate-slide-in`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-md text-sm ${
                  msg.type === 'bot'
                    ? 'bg-indigo-50 text-gray-700'
                    : 'bg-indigo-100 text-gray-900'
                }`}
              >
                {msg.content}
                {msg.options && (
                  <div className="mt-2 space-y-2">
                    {msg.options.map((option, optIndex) => (
                      <label
                        key={`option-${msg.mcqId}-${optIndex}`}
                        className="flex items-center cursor-pointer p-2 rounded-md hover:bg-indigo-100 transition-colors"
                      >
                        <input
                          type="radio"
                          name={`question-${msg.mcqId}`}
                          value={(optIndex + 1).toString()}
                          checked={userAnswer === (optIndex + 1).toString()}
                          onChange={() =>
                            handleOptionSelect((optIndex + 1).toString())
                          }
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-gray-300"
                          disabled={isLoading}
                        />
                        <span className="ml-2 text-gray-700">
                          {optIndex + 1}. {option}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {!messages.length && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-700">
              <BookOpen className="w-4 h-4 mr-2 text-indigo-600" />
              Waiting for the first question...
            </div>
          )}
        </div>
        {currentQuestion && !isAssessmentComplete && (
          <form
            onSubmit={handleAnswerSubmit}
            className="flex justify-end space-x-3"
          >
            <button
              type="submit"
              disabled={isLoading || !userAnswer}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 gap-2"
            >
              <Send className="w-4 h-4" />
              Submit Answer
            </button>
            <button
              type="button"
              onClick={endAssessment}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 gap-2"
            >
              <StopCircle className="w-4 h-4" />
              End Assessment
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default AssessmentChatbot
