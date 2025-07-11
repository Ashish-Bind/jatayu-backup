import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Modal from 'react-modal'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Navbar from './components/Navbar'
import Button from './components/Button'
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
  Camera,
  CheckCircle,
  Send,
  StopCircle,
  Star,
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
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false)
  const [proctoringRemarks, setProctoringRemarks] = useState([])
  const [showSnapshotNotification, setShowSnapshotNotification] =
    useState(false)
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

  // Function to schedule snapshots
  const scheduleSnapshots = () => {
    console.log('Scheduling snapshots', {
      attemptId,
      isAssessmentComplete,
      initialStartComplete: initialStartComplete.current,
      initialTimeLeft: initialTimeLeft.current,
      stream: !!streamRef.current,
      snapshotScheduled: snapshotScheduled.current,
    })

    if (!initialStartComplete.current) {
      console.log('Snapshot scheduling skipped: initialStartComplete is false')
      return
    }
    if (initialTimeLeft.current === null) {
      console.log('Snapshot scheduling skipped: initialTimeLeft is null')
      return
    }
    if (!streamRef.current) {
      console.log('Snapshot scheduling skipped: streamRef is null')
      return
    }
    if (isAssessmentComplete) {
      console.log('Snapshot scheduling skipped: isAssessmentComplete is true')
      return
    }
    if (snapshotScheduled.current) {
      console.log('Snapshot scheduling skipped: snapshotScheduled is true')
      return
    }

    snapshotScheduled.current = true
    const numSnapshots = Math.floor(Math.random() * 3) + 3
    const intervals = []
    for (let i = 0; i < numSnapshots; i++) {
      const time = Math.trunc(
        (Math.random() * initialTimeLeft.current * 1000) / 100
      )
      intervals.push(time)
    }
    intervals.sort((a, b) => a - b)

    console.log('Snapshot intervals:', intervals)

    snapshotTimersRef.current = intervals.map((interval, index) =>
      setTimeout(async () => {
        if (!isAssessmentComplete && streamRef.current) {
          console.log(`Capturing snapshot ${index + 1} at ${interval}ms`)
          try {
            await captureSnapshot(
              attemptId,
              videoRef.current,
              setProctoringRemarks,
              setShowSnapshotNotification
            )
            console.log(`Snapshot ${index + 1} captured successfully`)
          } catch (error) {
            console.error(`Snapshot ${index + 1} failed:`, error)
            setProctoringRemarks((prev) => [
              ...prev,
              `Snapshot failed at ${new Date().toISOString()}: ${
                error.message
              }`,
            ])
          }
        }
      }, interval)
    )
  }

  // Start assessment and initialize webcam
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
    setShowTabSwitchWarning(false)
    setProctoringRemarks([])
    setShowSnapshotNotification(false)
    setWebcamError('')
    initialStartComplete.current = false
    initialTimeLeft.current = null
    snapshotScheduled.current = false
    snapshotTimersRef.current.forEach(clearTimeout)
    snapshotTimersRef.current = []

    try {
      console.log('Requesting webcam access for attemptId:', attemptId)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      console.log('Webcam stream acquired:', !!stream)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      console.log('Starting assessment with attemptId:', attemptId)
      const response = await fetch(
        `http://localhost:5000/api/assessment/start/${attemptId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      )
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `HTTP error ${response.status}`)
      }
      const data = await response.json()
      console.log('Start assessment response:', data)
      if (!data.test_duration) {
        throw new Error('test_duration not provided in response')
      }
      setTotalQuestions(data.total_questions || 0)
      setTimeLeft(data.test_duration)
      initialTimeLeft.current = data.test_duration
      initialStartComplete.current = true

      // Schedule snapshots after assessment starts
      scheduleSnapshots()

      await requestFullscreen().catch((err) => {
        console.error('Fullscreen request failed:', err)
        setFullscreenPermissionError(true)
        setShowFullscreenWarning(true)
      })
    } catch (error) {
      console.error('Start assessment error:', error)
      if (
        error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError'
      ) {
        setWebcamError(
          'Webcam access denied. Please allow webcam access to continue.'
        )
        setProctoringRemarks((prev) => [
          ...prev,
          `Webcam access denied at ${new Date().toISOString()}`,
        ])
      } else {
        setErrorMessage(
          `Failed to start the assessment: ${error.message}. Please retry or return to dashboard.`
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Clean up snapshot timers and webcam stream
  useEffect(() => {
    return () => {
      console.log('Cleaning up snapshot timers and webcam stream')
      snapshotTimersRef.current.forEach(clearTimeout)
      snapshotTimersRef.current = []
      snapshotScheduled.current = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  // Handle fullscreen changes
  const handleFullscreenChange = () => {
    const isFullscreen =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    if (
      !isFullscreen &&
      !isAssessmentComplete &&
      initialStartComplete.current
    ) {
      setFullscreenWarnings((prev) => {
        const newCount = prev + 1
        setProctoringRemarks((prevRemarks) => [
          ...prevRemarks,
          `Exited fullscreen mode at ${new Date().toISOString()}`,
        ])
        if (newCount > MAX_FULLSCREEN_WARNINGS) {
          setProctoringRemarks((prevRemarks) => [
            ...prevRemarks,
            `Assessment terminated due to repeated fullscreen exits at ${new Date().toISOString()}`,
          ])
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
              proctoringRemarks,
            },
            () => navigate(`/candidate/assessment/${attemptId}/results`)
          )
        } else {
          setShowFullscreenWarning(true)
        }
        return newCount
      })
    }
  }

  // Handle tab/window switches
  const handleVisibilityChange = () => {
    if (
      document.hidden &&
      !isAssessmentComplete &&
      initialStartComplete.current
    ) {
      setTabSwitches((prev) => {
        const newCount = prev + 1
        setProctoringRemarks((prevRemarks) => [
          ...prevRemarks,
          `Tab switch or window minimization detected at ${new Date().toISOString()}`,
        ])
        if (newCount >= MAX_TAB_SWITCHES) {
          setProctoringRemarks((prevRemarks) => [
            ...prevRemarks,
            `Assessment terminated due to repeated tab switches at ${new Date().toISOString()}`,
          ])
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
              proctoringRemarks,
            },
            () => navigate(`/candidate/assessment/${attemptId}/results`)
          )
        } else {
          setShowTabSwitchWarning(true)
        }
        return newCount
      })
    }
  }

  // Focus modal button when opened
  useEffect(() => {
    if (showFullscreenWarning && modalButtonRef.current) {
      modalButtonRef.current.focus()
    }
  }, [showFullscreenWarning])

  // Handle navigation on assessment completion
  useEffect(() => {
    if (isAssessmentComplete) {
      navigate(`/candidate/assessment/${attemptId}/results`)
    }
  }, [isAssessmentComplete, attemptId, navigate])

  // Event listeners
  useEffect(() => {
    if (attemptId) startAssessment()
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    const preventCopyPaste = (e) => {
      e.preventDefault()
      setProctoringRemarks((prev) => [
        ...prev,
        `Attempted copy/paste at ${new Date().toISOString()}`,
      ])
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
                proctoringRemarks,
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
  }, [timeLeft, attemptId, navigate, proctoringRemarks])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div
      className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex flex-col"
      ref={assessmentContainerRef}
    >
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
            Assessment Chatbot
          </h1>
          <div className="bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
            Time Left: {formatTime(timeLeft)}
          </div>
        </div>
        {errorMessage && (
          <div
            className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-3 mb-6 rounded-md text-sm flex items-center gap-2"
            role="alert"
          >
            <XCircle className="w-4 h-4" />
            {errorMessage}
            <div className="ml-auto flex gap-2">
              <Button
                onClick={startAssessment}
                disabled={isLoading}
                variant="primary"
                size="sm"
                className="gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
              <Button
                onClick={() => navigate('/candidate/dashboard')}
                variant="secondary"
                size="sm"
                className="gap-1"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
            </div>
          </div>
        )}
        {webcamError && (
          <div
            className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-3 mb-6 rounded-md text-sm flex items-center gap-2"
            role="alert"
          >
            <XCircle className="w-4 h-4" />
            {webcamError}
            <Button
              onClick={() => navigate('/candidate/dashboard')}
              variant="secondary"
              size="sm"
              className="ml-auto gap-1"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
          </div>
        )}
        {showTabSwitchWarning && (
          <div
            className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-3 mb-6 rounded-md text-sm flex items-center gap-2"
            role="alert"
          >
            <XCircle className="w-4 h-4" />
            Warning: Tab switching detected ({tabSwitches}/{MAX_TAB_SWITCHES}).
            Please stay on this tab to avoid assessment termination.
            <Button
              onClick={() => setShowTabSwitchWarning(false)}
              variant="secondary"
              size="sm"
              className="ml-auto gap-1"
            >
              OK
            </Button>
          </div>
        )}
        {showSnapshotNotification && (
          <div
            className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-3 mb-6 rounded-md text-sm flex items-center gap-2"
            role="alert"
          >
            <Camera className="w-4 h-4" />
            Snapshot taken for proctoring.
            <Button
              onClick={() => setShowSnapshotNotification(false)}
              variant="secondary"
              size="sm"
              className="ml-auto gap-1"
            >
              OK
            </Button>
          </div>
        )}
        {(isLoading || isGeneratingQuestion) && (
          <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm border border-gray-200 dark:border-gray-600 mb-6 text-center text-sm text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            {isGeneratingQuestion
              ? 'Generating your next question...'
              : 'Loading...'}
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
                proctoringRemarks,
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
            if (!fullscreenPermissionError) {
              requestFullscreen()
            }
          }}
          className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-4 rounded-md max-w-md w-full mx-auto mt-20"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          aria={{
            labelledby: 'fullscreen-warning-title',
            describedby: 'fullscreen-warning-desc',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-5 h-5" />
            <h2 id="fullscreen-warning-title" className="text-lg font-semibold">
              Fullscreen Warning
            </h2>
          </div>
          <p id="fullscreen-warning-desc" className="text-sm mb-4">
            {fullscreenPermissionError
              ? 'Failed to enter fullscreen mode. Please enable fullscreen to continue the assessment.'
              : `Warning: You have exited fullscreen mode (${fullscreenWarnings}/${MAX_FULLSCREEN_WARNINGS}). Please stay in fullscreen to continue the assessment.`}
          </p>
          <div className="flex justify-end">
            <Button
              ref={modalButtonRef}
              onClick={() => {
                setShowFullscreenWarning(false)
                if (!fullscreenPermissionError) {
                  requestFullscreen()
                }
              }}
              variant="secondary"
              size="sm"
              className="gap-1"
            >
              {fullscreenPermissionError ? 'OK' : 'Re-enter Fullscreen'}
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default AssessmentChatbot
