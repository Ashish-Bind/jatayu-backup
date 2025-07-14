import React, { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Modal from 'react-modal'
import { useAuth } from './context/AuthContext'
import {
  User,
  Clock,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  BookOpen,
  Briefcase,
  Award,
  Calendar,
  FileText,
  X,
  Check,
  Loader2,
  Code,
} from 'lucide-react'
import Navbar from './components/Navbar'
import { ThemeContext } from './context/ThemeContext'
import { format } from 'date-fns'
import LinkButton from './components/LinkButton'
import Button from './components/Button'

// Bind modal to your appElement (for accessibility)
Modal.setAppElement('#root')

const formatDate = (date) => {
  return format(new Date(date), 'MMM d, yyyy')
}

const getPriorityColor = (priority) => {
  switch (priority) {
    case 5:
      return 'bg-green-300 text-green-800 dark:bg-green-900 dark:text-green-200' // Low priority
    case 3:
      return 'bg-blue-300 text-blue-800 dark:bg-blue-900 dark:text-blue-200' // Medium priority
    case 2:
      return 'bg-yellow-300 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' // High priority
    default:
      return 'bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

const CandidateDashboard = () => {
  const { user } = useAuth()
  const { theme } = useContext(ThemeContext)
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [assessments, setAssessments] = useState({
    eligible: [],
    all: [],
    attempted: [],
  })
  const [selectedAssessment, setSelectedAssessment] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isIneligibleModalOpen, setIsIneligibleModalOpen] = useState(false)
  const [ineligibleMessage, setIneligibleMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [activeTab, setActiveTab] = useState('recommended')

  useEffect(() => {
    if (!user || user.role !== 'candidate') {
      navigate('/candidate/login')
      return
    }

    // Fetch candidate data
    fetch(`http://localhost:5000/api/candidate/profile/${user.id}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to fetch profile: ${response.status} ${response.statusText}`
          )
        }
        return response.json()
      })
      .then((data) => {
        setCandidate(data)
        if (!data.is_profile_complete) {
          navigate('/candidate/complete-profile')
        }
      })
      .catch((error) => {
        console.error('Error fetching candidate:', error)
        setErrorMessage(`Failed to load candidate profile: ${error.message}`)
      })

    // Fetch assessments
    fetch(
      `http://localhost:5000/api/candidate/eligible-assessments/${user.id}`,
      {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to fetch assessments: ${response.status} ${response.statusText}`
          )
        }
        return response.json()
      })
      .then((data) => {
        setAssessments({
          eligible: data.eligible_assessments || [],
          all: data.all_assessments || [],
          attempted: data.attempted_assessments || [],
        })
      })
      .catch((error) => {
        console.error('Error fetching assessments:', error)
        setErrorMessage(`Failed to load assessments: ${error.message}`)
      })
  }, [navigate, user])

  const handleRegisterAssessment = (assessment) => {
    setErrorMessage('')
    setSuccessMessage('')
    setIneligibleMessage('')
    if (!assessment.is_eligible) {
      setIneligibleMessage(
        `You are not eligible for this job. Required: ${assessment.experience_min}-${assessment.experience_max} years of experience, Degree: ${assessment.degree_required || 'None'}`
      )
      setIsIneligibleModalOpen(true)
      return
    }

    fetch('http://localhost:5000/api/candidate/register-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        candidate_id: user.id,
        job_id: assessment.job_id,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Registration failed: ${response.status} ${response.statusText}`
          )
        }
        return response.json()
      })
      .then((data) => {
        if (data.message) {
          setSuccessMessage(data.message)
          // Refresh assessments
          fetch(
            `http://localhost:5000/api/candidate/eligible-assessments/${user.id}`,
            {
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            }
          )
            .then((response) => {
              if (!response.ok) {
                throw new Error(
                  `Failed to refresh assessments: ${response.status} ${response.statusText}`
                )
              }
              return response.json()
            })
            .then((data) => {
              setAssessments({
                eligible: data.eligible_assessments || [],
                all: data.all_assessments || [],
                attempted: data.attempted_assessments || [],
              })
            })
            .catch((error) => {
              console.error('Error refreshing assessments:', error)
              setErrorMessage(`Failed to refresh assessments: ${error.message}`)
            })
        } else {
          setErrorMessage(
            data.error || 'Failed to register for the assessment.'
          )
        }
      })
      .catch((error) => {
        console.error('Error registering for assessment:', error)
        setErrorMessage(
          `Failed to register for the assessment: ${error.message}`
        )
      })
  }

  const handleStartAssessment = (assessment) => {
    const scheduleTime = new Date(
      assessment.schedule || assessment.schedule_start
    )
    const currentTime = new Date()

    if (currentTime < scheduleTime) {
      setErrorMessage(
        `This assessment has not yet started. It is scheduled for ${scheduleTime.toLocaleString()}.`
      )
      setSelectedAssessment(null)
      return
    }

    setSelectedAssessment(assessment)
    setErrorMessage('')
    setSuccessMessage('')
    setIsModalOpen(true)
  }

  const confirmStartAssessment = () => {
    if (!selectedAssessment) return

    fetch('http://localhost:5000/api/candidate/start-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        user_id: user.id,
        job_id: selectedAssessment.job_id,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to start assessment: ${response.status} ${response.statusText}`
          )
        }
        return response.json()
      })
      .then((data) => {
        if (data.attempt_id) {
          navigate(`/candidate/assessment/${data.attempt_id}`)
        } else {
          setErrorMessage(data.error || 'Failed to start the assessment.')
        }
      })
      .catch((error) => {
        console.error('Error starting assessment:', error)
        setErrorMessage(`Failed to start the assessment: ${error.message}`)
      })

    setIsModalOpen(false)
  }

  if (!candidate) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-300 animate-spin" />
      </div>
    )
  }

  return (
    <div
      className={
        'min-h-screen transition-colors duration-300 bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800'
      }
    >
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {errorMessage && (
          <div
            className="bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6 rounded-md flex items-start gap-3"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div
            className="bg-green-50 dark:bg-green-900/50 border-l-4 border-green-500 text-green-700 dark:text-green-300 p-4 mb-6 rounded-md flex items-start gap-3"
            role="alert"
          >
            <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        {!candidate.is_profile_complete ? (
          <div
            className="bg-yellow-50 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-4 mb-6 rounded-md flex items-start gap-3"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p>Please complete your profile to access assessments.</p>
              <Link
                to="/candidate/complete-profile"
                className="inline-flex items-center mt-2 text-yellow-800 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-400 font-medium text-sm"
              >
                Complete Profile <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'recommended'
                      ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-300'
                      : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300'
                  }`}
                  onClick={() => setActiveTab('recommended')}
                >
                  Recommended Jobs
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'explore'
                      ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-300'
                      : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300'
                  }`}
                  onClick={() => setActiveTab('explore')}
                >
                  Explore Jobs
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'attempted'
                      ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-300'
                      : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300'
                  }`}
                  onClick={() => setActiveTab('attempted')}
                >
                  Attempted Assessments
                </button>
              </div>
            </div>

            {activeTab === 'recommended' && (
              <>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Recommended Jobs
                </h2>
                {assessments.eligible.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {assessments.eligible.map((assessment) => (
                      <div
                        key={assessment.job_id}
                        className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 max-w-md w-full"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-indigo-100 dark:bg-indigo-950 p-3 rounded-lg">
                            <Briefcase className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                              {assessment.job_title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Company: {assessment.company}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 mb-3">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-sm">
                              {assessment.experience_min}-
                              {assessment.experience_max} years
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span>
                              Degree: {assessment.degree_required || 'None'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span>Questions: {assessment.num_questions}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span>Duration: {assessment.duration} minutes</span>
                          </div>
                          {assessment.schedule_start && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              <div className="inline-flex items-center rounded-md">
                                {formatDate(assessment.schedule_start)} -{' '}
                                {assessment.schedule_end
                                  ? formatDate(assessment.schedule_end)
                                  : 'Ongoing'}
                              </div>
                            </div>
                          )}
                          {assessment.skills && assessment.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 items-center">
                              <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              {assessment.skills.map((skill, index) => (
                                <span
                                  key={index}
                                  className={`inline-flex items-center px-3 py-1 rounded-full font-medium text-xs ${getPriorityColor(
                                    skill.priority
                                  )}`}
                                >
                                  {skill.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => {
                            if (assessment.is_eligible) {
                              setIsModalOpen(true)
                              setSelectedAssessment(assessment)
                            } else {
                              handleRegisterAssessment(assessment)
                            }
                          }}
                          variant="primary"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-md text-sm font-medium transition-colors w-full"
                        >
                          {assessment.is_registered
                            ? 'Start Assessment'
                            : 'Register'}
                          <ArrowRight className="w-5 h-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm text-center border border-gray-200 dark:border-gray-800 mb-8">
                    <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">
                      No recommended jobs available at the moment.
                    </p>
                    <Link
                      to="/candidate/complete-profile"
                      className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm"
                    >
                      Update your profile for more opportunities{' '}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                )}
              </>
            )}

            {activeTab === 'explore' && (
              <>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Explore Jobs
                </h2>
                {assessments.all.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {assessments.all.map((assessment) => (
                      <div
                        key={assessment.job_id}
                        className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 max-w-md w-full"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-indigo-100 dark:bg-indigo-950 p-3 rounded-lg">
                            <Briefcase className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                              {assessment.job_title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Company: {assessment.company}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 mb-3">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-sm">
                              {assessment.experience_min}-
                              {assessment.experience_max} years
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span>
                              Degree: {assessment.degree_required || 'None'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span>Questions: {assessment.num_questions}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span>Duration: {assessment.duration} minutes</span>
                          </div>
                          {assessment.schedule_start && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              <div className="inline-flex items-center rounded-md">
                                {formatDate(assessment.schedule_start)} -{' '}
                                {assessment.schedule_end
                                  ? formatDate(assessment.schedule_end)
                                  : 'Ongoing'}
                              </div>
                            </div>
                          )}
                          {assessment.skills && assessment.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 items-center">
                              <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              {assessment.skills.map((skill, index) => (
                                <span
                                  key={index}
                                  className={`inline-flex items-center px-3 py-1 rounded-full font-medium text-xs ${getPriorityColor(
                                    skill.priority
                                  )}`}
                                >
                                  {skill.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => {
                            if (assessment.is_eligible) {
                              setIsModalOpen(true)
                              setSelectedAssessment(assessment)
                            } else {
                              handleRegisterAssessment(assessment)
                            }
                          }}
                          variant="primary"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-md text-sm font-medium transition-colors w-full"
                          disabled={!assessment.is_eligible && !candidate.is_profile_complete}
                        >
                          {assessment.is_registered
                            ? 'Start Assessment'
                            : 'Register'}
                          <ArrowRight className="w-5 h-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm text-center border border-gray-200 dark:border-gray-800 mb-8">
                    <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">
                      No jobs available at the moment.
                    </p>
                    <Link
                      to="/candidate/complete-profile"
                      className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm"
                    >
                      Update your profile for more opportunities{' '}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                )}
              </>
            )}

            {activeTab === 'attempted' && assessments.attempted.length > 0 && (
              <>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Attempted Assessments
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assessments.attempted.map((assessment) => (
                    <div
                      key={assessment.attempt_id}
                      className="bg-white dark:bg-gray-900 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="bg-indigo-50 dark:bg-indigo-900/50 p-2 rounded-md">
                          <Briefcase className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {assessment.job_title}
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">
                            Company: {assessment.company}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span>Status: {assessment.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span>
                            Attempted:{' '}
                            {format(
                              new Date(assessment.attempt_date),
                              'MMM d, yyyy'
                            )}
                          </span>
                        </div>
                      </div>
                      <Link
                        to={`/candidate/assessment/${assessment.attempt_id}/results`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-md text-sm font-medium transition-colors"
                      >
                        View Report <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm max-w-5xl mx-auto mt-20 border border-gray-200 dark:border-gray-800 outline-none"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex justify-center items-center p-4 z-50"
        >
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Start Assessment
            </h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {selectedAssessment && (
            <div>
              <div className="space-y-3 mb-4 text-sm">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Job Title
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedAssessment.job_title}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Company
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedAssessment.company}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Duration
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedAssessment.duration} minutes
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Questions
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedAssessment.num_questions}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Description
                  </h3>
                  <p className="text-gray-900 text-base dark:text-gray-100 bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-auto h-[15rem] ">
                    {selectedAssessment.job_description ||
                      'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/50 p-3 rounded-md mb-4">
                <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2 uppercase">
                  Important Notes:
                </h3>
                <ul className="text-base text-indigo-700 dark:text-indigo-300 space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span>Ensure you have a stable internet connection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span>Find a quiet environment without distractions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span>You cannot pause once started</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStartAssessment}
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 flex items-center gap-2"
                >
                  Start Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={isIneligibleModalOpen}
          onRequestClose={() => setIsIneligibleModalOpen(false)}
          className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm max-w-md mx-auto mt-20 border border-gray-200 dark:border-gray-800 outline-none"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex justify-center items-center p-4 z-50"
        >
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              Not Eligible
            </h2>
            <button
              onClick={() => setIsIneligibleModalOpen(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            {ineligibleMessage}
          </p>
          <div className="flex justify-end gap-2">
            <Link
              to="/candidate/complete-profile"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 flex items-center gap-2"
            >
              Update Profile <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setIsIneligibleModalOpen(false)}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
            >
              Close
            </button>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default CandidateDashboard