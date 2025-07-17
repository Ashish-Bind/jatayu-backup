import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Modal from 'react-modal'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Navbar from './components/Navbar'
import Button from './components/Button'
import toast from 'react-hot-toast'
import { MAX_FULLSCREEN_WARNINGS, MAX_TAB_SWITCHES } from './utils/constants'
import AssessmentMessages from './components/AssessmentMessages'
import {
  formatTime,
  handleAnswerSubmit,
  fetchNextQuestion,
  endAssessment,
  captureSnapshot,
  requestFullscreen,
  parseContent,
  renderContent,
} from './utils/utils'
import {
  BookOpen,
  Clock,
  RefreshCw,
  XCircle,
  Home,
  Send,
  StopCircle,
} from 'lucide-react'

// Bind Modal to the root element for accessibility
Modal.setAppElement('#root')

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
  const [timeLeft, setTimeLeft] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [questionPending, setQuestionPending] = useState(false)
  const [awaitingNextQuestion, setAwaitingNextQuestion] = useState(false)
  const [fullscreenWarnings, setFullscreenWarnings] = useState(0)
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false)
  const [fullscreenPermissionError, setFullscreenPermissionError] =
    useState(false)
  const [tabSwitches, setTabSwitches] = useState(0)
  const [webcamError, setWebcamError] = useState('')
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(null)
  const [usedMcqIds, setUsedMcqIds] = useState([])
  const initialStartComplete = useRef(false)
  const currentMcqId = useRef(null)
  const chatContainerRef = useRef(null)
  const assessmentContainerRef = useRef(null)
  const modalButtonRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const initialTimeLeft = useRef(null)
  const snapshotScheduled = useRef(false)
  const snapshotTimersRef = useRef([])
  const tabSwitchesRef = useRef(tabSwitches)
  const fullscreenWarningsRef = useRef(fullscreenWarnings)

  useEffect(() => {
    tabSwitchesRef.current = tabSwitches
  }, [tabSwitches])

  useEffect(() => {
    fullscreenWarningsRef.current = fullscreenWarnings
  }, [fullscreenWarnings])

  const scheduleSnapshots = () => {
    if (
      !initialStartComplete.current ||
      initialTimeLeft.current === null ||
      !streamRef.current ||
      isAssessmentComplete ||
      snapshotScheduled.current
    )
      return

    snapshotScheduled.current = true
    const numSnapshots = Math.floor(Math.random() * 3) + 3
    const intervals = Array.from(
      { length: numSnapshots },
      () => Math.trunc(Math.random() * initialTimeLeft.current * 1000) / 100
    ).sort((a, b) => a - b)

    snapshotTimersRef.current = intervals.map((interval, index) =>
      setTimeout(async () => {
        if (!isAssessmentComplete && streamRef.current) {
          try {
            await captureSnapshot(
              attemptId,
              videoRef.current,
              () => {},
              () => toast.success('Snapshot taken for proctoring')
            )
          } catch (error) {
            toast.error('Failed to capture snapshot')
          }
        }
      }, interval)
    )
  }

  const startAssessment = async () => {
    setIsLoading(true)
    setErrorMessage('')
    setMessages([])
    setUserAnswer('')
    setQuestionNumber(0)
    setCurrentQuestion(null)
    setQuestionPending(false)
    setAwaitingNextQuestion(false)
    setIsAssessmentComplete(false)
    setIsGeneratingQuestion(false)
    setQuestionStartTime(null)
    setUsedMcqIds([])
    setFullscreenWarnings(0)
    setTabSwitches(0)
    setShowFullscreenWarning(false)
    setFullscreenPermissionError(false)
    setWebcamError('')
    initialStartComplete.current = false
    initialTimeLeft.current = null
    snapshotScheduled.current = false
    snapshotTimersRef.current.forEach(clearTimeout)
    snapshotTimersRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream

      const response = await fetch(
        `http://localhost:5000/api/assessment/start/${attemptId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      )
      if (!response.ok)
        throw new Error(
          (await response.json()).error || `HTTP error ${response.status}`
        )
      const data = await response.json()
      if (!data.test_duration) throw new Error('test_duration not provided')
      setTotalQuestions(data.total_questions || 0)
      setTimeLeft(data.test_duration)
      initialTimeLeft.current = data.test_duration
      initialStartComplete.current = true
      scheduleSnapshots()
      await requestFullscreen().catch((err) => {
        setFullscreenPermissionError(true)
        setShowFullscreenWarning(true)
        toast.error('Failed to enter fullscreen mode')
      })
    } catch (error) {
      if (
        error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError'
      ) {
        setWebcamError(
          'Webcam access denied. Please allow webcam access to continue.'
        )
        toast.error(webcamError)
      } else {
        setErrorMessage(
          `Failed to start the assessment: ${error.message}. Please retry or return to dashboard.`
        )
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      snapshotTimersRef.current.forEach(clearTimeout)
      snapshotTimersRef.current = []
      snapshotScheduled.current = false
      if (streamRef.current)
        streamRef.current.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const handleFullscreenChange = () => {
    if (
      !document.fullscreenElement &&
      !isAssessmentComplete &&
      initialStartComplete.current
    ) {
      setFullscreenWarnings((prev) => {
        const newCount = prev + 1
        if (newCount > MAX_FULLSCREEN_WARNINGS) {
          endAssessment(
            attemptId,
            true,
            'Terminated due to repeated fullscreen exits',
            setIsAssessmentComplete,
            setIsLoading,
            setErrorMessage,
            {
              tabSwitches: tabSwitchesRef.current,
              fullscreenWarnings: newCount,
            },
            () => navigate(`/candidate/assessment/${attemptId}/results`)
          )
        } else {
          setShowFullscreenWarning(true)
          toast(
            `Exited fullscreen mode (${newCount}/${MAX_FULLSCREEN_WARNINGS})`
          )
        }
        return newCount
      })
    }
  }

  const handleVisibilityChange = () => {
    if (
      document.hidden &&
      !isAssessmentComplete &&
      initialStartComplete.current
    ) {
      setTabSwitches((prev) => {
        const newCount = prev + 1
        if (newCount >= MAX_TAB_SWITCHES) {
          endAssessment(
            attemptId,
            true,
            'Terminated due to repeated tab switches',
            setIsAssessmentComplete,
            setIsLoading,
            setErrorMessage,
            {
              tabSwitches: newCount,
              fullscreenWarnings: fullscreenWarningsRef.current,
            },
            () => navigate(`/candidate/assessment/${attemptId}/results`)
          )
        } else {
          toast.warning(`Tab switch detected (${newCount}/${MAX_TAB_SWITCHES})`)
        }
        return newCount
      })
    }
  }

  useEffect(() => {
    if (showFullscreenWarning && modalButtonRef.current)
      modalButtonRef.current.focus()
  }, [showFullscreenWarning])

  useEffect(() => {
    if (isAssessmentComplete)
      navigate(`/candidate/assessment/${attemptId}/results`)
  }, [isAssessmentComplete, attemptId, navigate])

  useEffect(() => {
    if (attemptId) startAssessment()
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    const preventCopyPaste = (e) => {
      e.preventDefault()
      toast.error('Copy/paste is not allowed during the assessment')
    }
    document.addEventListener('copy', preventCopyPaste)
    document.addEventListener('paste', preventCopyPaste)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange
      )
      document.removeEventListener(
        'mozfullscreenchange',
        handleFullscreenChange
      )
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('copy', preventCopyPaste)
      document.removeEventListener('paste', preventCopyPaste)
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
      fetchNextQuestion(
        attemptId,
        setCurrentQuestion,
        setSkill,
        setQuestionNumber,
        setMessages,
        setIsAssessmentComplete,
        setIsLoading,
        setQuestionPending,
        setErrorMessage,
        setQuestionStartTime,
        setUsedMcqIds,
        usedMcqIds,
        questionNumber,
        setIsGeneratingQuestion
      )
    }
  }, [
    attemptId,
    initialStartComplete.current,
    questionPending,
    currentQuestion,
    isAssessmentComplete,
    awaitingNextQuestion,
    usedMcqIds,
    questionNumber,
  ])

  useEffect(() => {
    if (
      awaitingNextQuestion &&
      !questionPending &&
      !isLoading &&
      !isAssessmentComplete
    ) {
      setTimeout(() => {
        fetchNextQuestion(
          attemptId,
          setCurrentQuestion,
          setSkill,
          setQuestionNumber,
          setMessages,
          setIsAssessmentComplete,
          setIsLoading,
          setQuestionPending,
          setErrorMessage,
          setQuestionStartTime,
          setUsedMcqIds,
          usedMcqIds,
          questionNumber,
          setIsGeneratingQuestion
        )
        setAwaitingNextQuestion(false)
      }, 1500)
    }
  }, [
    awaitingNextQuestion,
    questionPending,
    isLoading,
    isAssessmentComplete,
    attemptId,
    questionNumber,
    usedMcqIds,
  ])

  useEffect(() => {
    if (timeLeft !== null) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) {
            clearInterval(timer)
            endAssessment(
              attemptId,
              false,
              '',
              setIsAssessmentComplete,
              setIsLoading,
              setErrorMessage,
              {
                tabSwitches: tabSwitchesRef.current,
                fullscreenWarnings: fullscreenWarningsRef.current,
              },
              () => navigate(`/candidate/assessment/${attemptId}/results`)
            )
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timeLeft, attemptId, navigate])

  useEffect(() => {
    if (chatContainerRef.current)
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
  }, [messages])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Navbar />
      <div className="px-2 sm:px-6 lg:px-8 py-8 flex-1 flex">
        {/* Sidebar (Sticky to Left) */}
        <div className="w-72 bg-white dark:bg-gray-800 shadow-2xl rounded-r p-6 border-r-2 border-gray-200 dark:border-gray-700 sticky top-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-indigo-600 dark:text-indigo-300" />
            Questions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: Math.min(totalQuestions, 10) }, (_, i) => (
              <div
                key={i}
                className={`w-16 h-16 flex items-center justify-center rounded-full text-base font-semibold ${
                  i + 1 === questionNumber
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
            <div>
              <p className="text-base text-gray-700 dark:text-gray-200">
                Time Left
              </p>
              <p className="text-base font-medium text-indigo-700 dark:text-indigo-300">
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>
        </div>

        {/* Chat Area (Sticks to Sidebar) */}
        <div className="flex-1 ml-6 bg-white dark:bg-gray-800 shadow-2xl rounded-l-lg p-6 border-l-2 border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-indigo-600 dark:text-indigo-300" />
            Chat Interface
          </h2>
          {errorMessage && (
            <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6 rounded-lg flex items-center gap-3">
              <XCircle className="w-6 h-6" />
              <span className="text-base">{errorMessage}</span>
              <div className="ml-auto flex gap-3">
                <Button
                  onClick={startAssessment}
                  disabled={isLoading}
                  variant="primary"
                  className="gap-2"
                >
                  <RefreshCw className="w-5 h-5" /> Retry
                </Button>
                <Button
                  onClick={() => navigate('/candidate/dashboard')}
                  variant="secondary"
                  className="gap-2"
                >
                  <Home className="w-5 h-5" /> Dashboard
                </Button>
              </div>
            </div>
          )}
          {webcamError && (
            <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6 rounded-lg flex items-center gap-3">
              <XCircle className="w-6 h-6" />
              <span className="text-base">{webcamError}</span>
              <Button
                onClick={() => navigate('/candidate/dashboard')}
                variant="secondary"
                className="ml-auto gap-2"
              >
                <Home className="w-5 h-5" /> Dashboard
              </Button>
            </div>
          )}
          {(isLoading || isGeneratingQuestion) && (
            <div className="bg-gray-100 dark:bg-gray-700 p-4 mb-6 rounded-lg flex items-center gap-3 justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-300" />
              <span className="text-base text-gray-700 dark:text-gray-200">
                {isGeneratingQuestion
                  ? 'Generating your next question...'
                  : 'Loading...'}
              </span>
            </div>
          )}
          <AssessmentMessages
            messages={messages}
            isLoading={isLoading}
            currentQuestion={currentQuestion}
            userAnswer={userAnswer}
            handleOptionSelect={(value) => {
              setUserAnswer(value)
              currentMcqId.current = currentQuestion?.mcq_id
            }}
            handleAnswerSubmit={(e) =>
              handleAnswerSubmit(
                e,
                attemptId,
                skill,
                userAnswer,
                currentQuestion,
                setMessages,
                setCurrentQuestion,
                currentMcqId,
                setUserAnswer,
                setAwaitingNextQuestion,
                setIsLoading,
                setErrorMessage,
                questionStartTime
              )
            }
            endAssessment={() =>
              endAssessment(
                attemptId,
                false,
                '',
                setIsAssessmentComplete,
                setIsLoading,
                setErrorMessage,
                {
                  tabSwitches: tabSwitchesRef.current,
                  fullscreenWarnings: fullscreenWarningsRef.current,
                },
                () => navigate(`/candidate/assessment/${attemptId}/results`)
              )
            }
            chatContainerRef={chatContainerRef}
          />
          <video ref={videoRef} className="hidden" autoPlay playsInline />
          <Modal
            isOpen={showFullscreenWarning}
            onRequestClose={() => {
              setShowFullscreenWarning(false)
              if (!fullscreenPermissionError) requestFullscreen()
            }}
            className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-6 rounded-lg max-w-md w-full mx-auto mt-20"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            aria={{
              labelledby: 'fullscreen-warning-title',
              describedby: 'fullscreen-warning-desc',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="w-6 h-6" />
              <h2
                id="fullscreen-warning-title"
                className="text-lg font-semibold"
              >
                Fullscreen Warning
              </h2>
            </div>
            <p id="fullscreen-warning-desc" className="text-base mb-6">
              {fullscreenPermissionError
                ? 'Failed to enter fullscreen mode. Please enable fullscreen to continue the assessment.'
                : `Warning: You have exited fullscreen mode (${fullscreenWarnings}/${MAX_FULLSCREEN_WARNINGS}). Please stay in fullscreen to continue.`}
            </p>
            <div className="flex justify-end">
              <Button
                ref={modalButtonRef}
                onClick={() => {
                  setShowFullscreenWarning(false)
                  if (!fullscreenPermissionError) requestFullscreen()
                }}
                variant="secondary"
                className="gap-2"
              >
                {fullscreenPermissionError ? 'OK' : 'Re-enter Fullscreen'}
              </Button>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  )
}

export default AssessmentChatbot
