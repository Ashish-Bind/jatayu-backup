import { CheckCircle, Star, BookOpen, Send, XCircle } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export function capitalizeFirstLetter(str) {
  if (typeof str !== 'string' || str.length === 0) {
    return '' // Handle empty or non-string inputs
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const parseContent = (content) => {
  if (typeof content !== 'string') return [{ type: 'text', value: content }]

  const parts = []
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g
  const inlineCodeRegex = /`([^`]+)`/g

  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const [fullMatch, language, code] = match
    const startIndex = match.index

    if (startIndex > lastIndex) {
      parts.push({
        type: 'text',
        value: content.slice(lastIndex, startIndex),
      })
    }

    parts.push({
      type: 'code',
      language: language || 'text',
      value: code.trim(),
    })

    lastIndex = codeBlockRegex.lastIndex
  }

  let remainingText = lastIndex === 0 ? content : content.slice(lastIndex)

  if (remainingText) {
    let inlineLastIndex = 0
    let inlineMatch

    while ((inlineMatch = inlineCodeRegex.exec(remainingText)) !== null) {
      const [fullMatch, code] = inlineMatch
      const startIndex = inlineMatch.index

      if (startIndex > inlineLastIndex) {
        parts.push({
          type: 'text',
          value: remainingText.slice(inlineLastIndex, startIndex),
        })
      }

      parts.push({
        type: 'code',
        language: 'text',
        value: code.trim(),
        inline: true,
      })

      inlineLastIndex = inlineCodeRegex.lastIndex
    }

    if (inlineLastIndex < remainingText.length) {
      parts.push({
        type: 'text',
        value: remainingText.slice(inlineLastIndex),
      })
    }
  }

  return parts
}

export const renderContent = (content) => {
  const parts = parseContent(content)

  return parts.map((part, index) => {
    if (part.type === 'code') {
      return (
        <div
          key={`part-${index}`}
          className={part.inline ? 'inline-block' : 'my-2'}
          style={{ maxWidth: '100%' }}
        >
          <SyntaxHighlighter
            language={part.language}
            style={vscDarkPlus}
            customStyle={
              part.inline
                ? {
                    display: 'inline-block',
                    padding: '0.2em 0.4em',
                    margin: '0',
                    fontSize: '0.9em',
                    background: '#1f2937',
                    borderRadius: '4px',
                  }
                : {
                    padding: '0.5em',
                    margin: '0.5em 0',
                    borderRadius: '4px',
                    overflowX: 'auto',
                    maxWidth: '100%',
                    whiteSpace: 'pre-wrap',
                  }
            }
            codeTagProps={
              part.inline ? { style: { background: 'transparent' } } : undefined
            }
          >
            {part.value}
          </SyntaxHighlighter>
        </div>
      )
    }
    return <span key={`part-${index}`}>{part.value}</span>
  })
}

export const downloadAsPDF = (elementId, fileName) => {
  const input = document.getElementById(elementId)
  if (!input) {
    console.error(`Element with ID ${elementId} not found`)
    return
  }

  html2canvas(input).then((canvas) => {
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF()
    const imgProps = pdf.getImageProperties(imgData)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`${fileName}.pdf`)
  })
}

export const requestFullscreen = () => {
  const elem = document.documentElement
  if (elem.requestFullscreen) {
    return elem.requestFullscreen().catch((err) => {
      console.error('Fullscreen request failed:', err)
      throw err
    })
  } else if (elem.webkitRequestFullscreen) {
    return elem.webkitRequestFullscreen().catch((err) => {
      console.error('Fullscreen request failed (webkit):', err)
      throw err
    })
  } else if (elem.mozRequestFullScreen) {
    return elem.mozRequestFullScreen().catch((err) => {
      console.error('Fullscreen request failed (moz):', err)
      throw err
    })
  } else if (elem.msRequestFullscreen) {
    return elem.msRequestFullscreen().catch((err) => {
      console.error('Fullscreen request failed (ms):', err)
      throw err
    })
  }
}

export const isMajoritySnapshotsValid = (snapshots) => {
  if (!snapshots || snapshots.length === 0) return false
  const validCount = snapshots.filter((s) => s.is_valid).length
  return validCount > snapshots.length / 2
}

export const exitFullscreen = () => {
  const isFullscreen =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  if (isFullscreen && document.exitFullscreen) {
    return document.exitFullscreen().catch((err) => {
      console.error('Exit fullscreen failed:', err)
    })
  } else if (isFullscreen && document.webkitExitFullscreen) {
    return document.webkitExitFullscreen().catch((err) => {
      console.error('Exit fullscreen failed (webkit):', err)
    })
  } else if (isFullscreen && document.mozCancelFullScreen) {
    return document.mozCancelFullScreen().catch((err) => {
      console.error('Exit fullscreen failed (moz):', err)
    })
  } else if (isFullscreen && document.msExitFullscreen) {
    return document.msExitFullscreen().catch((err) => {
      console.error('Exit fullscreen failed (ms):', err)
    })
  }
}

export const formatTime = (seconds) => {
  if (seconds === null || isNaN(seconds)) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
}

export const formatDate = (isoString) => {
  if (!isoString) return 'N/A'
  try {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Invalid Date'
  }
}

export const calculateTotalScore = (candidateReport) => {
  if (!candidateReport) return 0
  return Object.values(candidateReport).reduce(
    (total, skillData) => total + skillData.correct_answers,
    0
  )
}

export const preventCopyPaste = (e, setProctoringRemarks) => {
  e.preventDefault()
  setProctoringRemarks((prev) => [
    ...prev,
    `Attempted copy/paste at ${new Date().toISOString()}`,
  ])
}

export const captureSnapshot = async (
  attemptId,
  videoElement,
  setProctoringRemarks,
  setShowSnapshotNotification
) => {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 480
    canvas
      .getContext('2d')
      .drawImage(videoElement, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.8)
    )

    const formData = new FormData()
    formData.append('snapshot', blob, `snapshot.jpg`)

    const response = await fetch(
      `http://localhost:5000/api/assessment/capture-snapshot/${attemptId}`,
      {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }
    )

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || `HTTP error ${response.status}`)
    }

    setProctoringRemarks((prev) => [
      ...prev,
      `Snapshot captured at ${new Date().toISOString()}`,
    ])
    setShowSnapshotNotification(true)
  } catch (error) {
    throw new Error(`Failed to capture snapshot: ${error.message}`)
  }
}

export const fetchNextQuestion = (
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
) => {
  setQuestionPending(true)
  setIsLoading(true)
  if (questionNumber > 0) {
    setIsGeneratingQuestion(true)
  }
  const queryParams =
    usedMcqIds.length > 0 ? `?used_mcq_ids=${JSON.stringify(usedMcqIds)}` : ''
  fetch(
    `http://localhost:5000/api/assessment/next-question/${attemptId}${queryParams}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }
  )
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
        setMessages((prev) => [
          ...prev,
          {
            type: 'bot',
            content: (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-300" />
                Assessment completed! Redirecting to results...
              </div>
            ),
          },
        ])
      } else if (data.question) {
        setCurrentQuestion(data.question)
        setSkill(data.skill)
        setQuestionNumber(data.question_number)
        setQuestionStartTime(Date.now())
        setUsedMcqIds((prev) => [...prev, data.question.mcq_id])
        const newMessages = []
        if (questionNumber === 0 || data.question_number === 1) {
          newMessages.push({
            type: 'bot',
            content: (
              <div className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                {data.greeting}
              </div>
            ),
          })
        }
        newMessages.push({
          type: 'bot',
          content: (
            <div className="text-sm">
              Q{data.question_number}: {renderContent(data.question.question)}
            </div>
          ),
        })
        newMessages.push({
          type: 'bot',
          content: (
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
              Skill: {data.skill.replace('_', ' ')}
            </div>
          ),
        })
        newMessages.push({
          type: 'bot',
          content: 'Options:',
          options: data.question.options.map((opt, index) => ({
            value: (index + 1).toString(),
            label: renderContent(opt),
          })),
          mcqId: data.question.mcq_id,
        })
        setMessages((prev) => [...prev, ...newMessages])
        setErrorMessage('')
      } else {
        setErrorMessage('No more questions available.')
      }
    })
    .catch((error) => {
      setErrorMessage(`Failed to fetch the next question: ${error.message}`)
    })
    .finally(() => {
      setIsLoading(false)
      setQuestionPending(false)
      setIsGeneratingQuestion(false)
    })
}

export const handleAnswerSubmit = (
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
) => {
  e.preventDefault()
  if (!userAnswer) {
    setErrorMessage('Please select an answer.')
    return
  }
  setIsLoading(true)
  setMessages((prev) => [
    ...prev,
    {
      type: 'user',
      content: (
        <div className="flex items-center justify-end gap-2 text-sm">
          Selected option {userAnswer}
          <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
        </div>
      ),
    },
  ])
  fetch(`http://localhost:5000/api/assessment/submit-answer/${attemptId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      skill,
      answer: userAnswer,
      time_taken: questionStartTime
        ? (Date.now() - questionStartTime) / 1000
        : 0,
      mcq_id: currentMcqId.current,
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
              {data.feedback.includes('✅') ? (
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-300" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 dark:text-red-300" />
              )}
              {renderContent(data.feedback)}
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
      setErrorMessage(`Failed to submit your answer: ${error.message}`)
    })
    .finally(() => setIsLoading(false))
}

export const endAssessment = (
  attemptId,
  forced,
  remark,
  setIsAssessmentComplete,
  setIsLoading,
  setErrorMessage,
  proctoringData,
  onSuccess
) => {
  setIsLoading(true)
  fetch(`http://localhost:5000/api/assessment/end/${attemptId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      proctoring_data: {
        tab_switches: proctoringData.tabSwitches,
        fullscreen_warnings: proctoringData.fullscreenWarnings,
        remarks: proctoringData.proctoringRemarks,
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
    .then(() => {
      setIsAssessmentComplete(true)
      if (onSuccess) onSuccess()
    })
    .catch((error) => {
      setErrorMessage(`Failed to end assessment: ${error.message}`)
    })
    .finally(() => {
      setIsLoading(false)
      const isFullscreen =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      if (isFullscreen) {
        exitFullscreen()
      }
    })
}
