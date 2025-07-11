import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Bar } from 'react-chartjs-2'
import {
  CheckCircle,
  BookOpen,
  Star,
  BarChart2,
  TrendingUp,
  Home,
  RefreshCw,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { ThemeContext } from '../context/ThemeContext'
import { isMajoritySnapshotsValid } from '../utils/utils'

const CandidateResult = () => {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [candidateReport, setCandidateReport] = useState(null)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [proctoringData, setProctoringData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const { theme } = useContext(ThemeContext)

  useEffect(() => {
    setIsLoading(true)
    fetch(`http://localhost:5000/api/assessment/results/${attemptId}`, {
      method: 'GET',
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
        setCandidateReport(data.candidate_report)
        setTotalQuestions(data.total_questions)
        setProctoringData(data.proctoring_data)
        setErrorMessage('')
      })
      .catch((error) => {
        setErrorMessage(`Failed to load results: ${error.message}`)
      })
      .finally(() => setIsLoading(false))
  }, [attemptId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex flex-col">
        <Navbar userType={user.role} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center items-center">
          <div className="text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Loading results...
          </div>
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex flex-col">
        <Navbar userType={user.role} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-3 mb-6 rounded-md text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            {errorMessage}
            <div className="ml-auto">
              <Button
                onClick={() => navigate('/candidate/dashboard')}
                variant="secondary"
                size="sm"
                className="flex justify-center items-center gap-1"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!candidateReport) {
    return null
  }

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
        backgroundColor: 'rgba(79, 70, 229, 0.6)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(79, 70, 229, 0.8)',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'Space Grotesk',
            size: 12,
          },
          color: theme === 'dark' ? '#F9FAFB' : '#1F2937',
        },
      },
      title: {
        display: true,
        text: 'Skill-wise Accuracy',
        color: theme === 'dark' ? '#F9FAFB' : '#1F2937',
        font: {
          size: 16,
          weight: 'bold',
          family: 'Space Grotesk',
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#1F2937' : '#F3F4F6',
        titleColor: theme === 'dark' ? '#F9FAFB' : '#1F2937',
        bodyColor: theme === 'dark' ? '#E5E7EB' : '#111827',
        titleFont: {
          size: 12,
          family: 'Space Grotesk',
        },
        bodyFont: {
          family: 'Space Grotesk',
          size: 12,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Accuracy (%)',
          color: theme === 'dark' ? '#F9FAFB' : '#1F2937',
          font: {
            size: 12,
            family: 'Space Grotesk',
          },
        },
        ticks: {
          color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
          font: {
            family: 'Space Grotesk',
          },
        },
        grid: {
          color:
            theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Skills',
          color: theme === 'dark' ? '#F9FAFB' : '#1F2937',
          font: {
            size: 12,
            family: 'Space Grotesk',
          },
        },
        ticks: {
          color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
          font: {
            family: 'Space Grotesk',
          },
        },
        grid: {
          display: false,
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuad',
    },
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
    totalAttempted > 0 ? ((totalCorrect / totalAttempted) * 100).toFixed(2) : 0

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 flex flex-col">
      <Navbar userType={user.role} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
          Assessment Results
        </h1>
        <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
          <p className="text-green-700 dark:text-green-300 text-sm font-medium mb-6 flex items-center gap-2">
            <Star className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
            Congratulations! You've completed the assessment.
          </p>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                Performance Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-md border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                    Questions Attempted
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {totalAttempted} / {totalQuestions}
                  </p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-md border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                    Correct Answers
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {totalCorrect}
                  </p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-md border border-gray-200 dark:border-gray-800 hover:hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                    Overall Accuracy
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {overallAccuracy}%
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                Skill-wise Breakdown
              </h3>
              <div className="space-y-4">
                {Object.entries(candidateReport).map(([skill, stats]) => (
                  <div
                    key={skill}
                    className="bg-white dark:bg-gray-900 p-5 rounded-md border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
                  >
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Star className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                      {skill.replace('_', ' ')}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-200">
                      <div>
                        <p className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                          Questions Attempted: {stats.questions_attempted}
                        </p>
                        <p className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                          Correct Answers: {stats.correct_answers}
                        </p>
                      </div>
                      <div>
                        <p className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                          Accuracy: {stats.accuracy_percent}%
                        </p>
                        <p className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                          Performance Band:{' '}
                          <span className="capitalize">{stats.final_band}</span>
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                        <div
                          className="bg-indigo-600 dark:bg-indigo-300 h-2.5 rounded-full transition-all duration-1000 ease-in-out"
                          style={{ width: `${stats.accuracy_percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                Performance Visualization
              </h3>
              <div className="bg-white dark:bg-gray-900 p-5 rounded-md border border-gray-200 dark:border-gray-800">
                <Bar
                  data={chartData}
                  options={chartOptions}
                  className="text-white"
                />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                Insights & Recommendations
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-200">
                {Object.entries(candidateReport).map(([skill, stats]) => (
                  <li key={skill} className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-indigo-600 dark:text-indigo-300 mt-1" />
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
            {proctoringData && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                  Proctoring Information
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-200">
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-indigo-600 dark:text-indigo-300 mt-1" />
                    <span>
                      <p className="flex items-center gap-2">
                        Termination Reason:{' '}
                        <span className="text-red-500">
                          {proctoringData.termination_reason || 'None'}
                        </span>
                      </p>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-indigo-600 dark:text-indigo-300 mt-1" />
                    <span>
                      <p className="flex items-center gap-2">
                        Forced Termination:{' '}
                        {proctoringData.forced_termination ? 'Yes' : 'No'}
                      </p>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-indigo-600 dark:text-indigo-300 mt-1" />
                    <span>
                      <p className="flex items-center gap-2">
                        Fullscreen Warnings:{' '}
                        {proctoringData.fullscreen_warnings}
                      </p>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-indigo-600 dark:text-indigo-300 mt-1" />
                    <span>
                      <p className="flex items-center gap-2">
                        Tab Switches: {proctoringData.tab_switches}
                      </p>
                    </span>
                  </li>
                </ul>
              </div>
            )}
            {proctoringData && proctoringData.snapshots && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                  Snapshot Face Match Summary
                </h3>
                <div className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  {isMajoritySnapshotsValid(proctoringData.snapshots) ? (
                    <span className="text-green-600 dark:text-green-300 font-bold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Majority of webcam snapshots matched the candidate's
                      profile picture.
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-300 font-bold flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Majority of webcam snapshots did NOT match the candidate's
                      profile picture.
                    </span>
                  )}
                  <span className="ml-3">
                    ({proctoringData.snapshots.filter((s) => s.is_valid).length}{' '}
                    of {proctoringData.snapshots.length} matched)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() => navigate('/candidate/dashboard')}
            variant="primary"
            className="flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CandidateResult
