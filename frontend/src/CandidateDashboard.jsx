import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
import Navbar from './components/Navbar'

// Bind modal to your appElement (for accessibility)
Modal.setAppElement('#root')

const CandidateDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [selectedAssessment, setSelectedAssessment] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

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

    // Fetch eligible assessments
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
      .then((data) => setAssessments(data))
      .catch((error) => {
        console.error('Error fetching assessments:', error)
        setErrorMessage(`Failed to load assessments: ${error.message}`)
      })
  }, [navigate, user])

  const handleRegisterAssessment = (assessment) => {
    setErrorMessage('')
    setSuccessMessage('')
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
          // Refresh assessments to update is_registered
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
            .then((data) => setAssessments(data))
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
    const scheduleTime = new Date(assessment.schedule)
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
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-gray-700 text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {errorMessage && (
          <div
            className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md flex items-start gap-3"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div
            className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md flex items-start gap-3"
            role="alert"
          >
            <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        {!candidate.is_profile_complete ? (
          <div
            className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md flex items-start gap-3"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p>Please complete your profile to access assessments.</p>
              <Link
                to="/candidate/complete-profile"
                className="inline-flex items-center mt-2 text-yellow-800 hover:text-yellow-900 font-medium text-sm"
              >
                Complete Profile <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Available Assessments
            </h2>
            {assessments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assessments.map((assessment) => (
                  <div
                    key={assessment.job_id}
                    className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-indigo-50 p-2 rounded-md">
                        <Briefcase className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {assessment.job_title}
                        </h3>
                        <p className="text-gray-700 text-sm">
                          Company: {assessment.company}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-600" />
                        <span>
                          Experience: {assessment.experience_min}-
                          {assessment.experience_max} years
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>
                          Degree: {assessment.degree_required || 'None'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>Questions: {assessment.num_questions}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <span>Duration: {assessment.duration} minutes</span>
                      </div>
                      {assessment.schedule_start && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <span>
                            Start Date:{' '}
                            {new Date(
                              assessment.schedule_start
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {assessment.schedule_end && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <span>
                            End Dat:{' '}
                            {new Date(assessment.schedule_end).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {assessment.is_registered ? (
                        <button
                          onClick={() => handleStartAssessment(assessment)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
                        >
                          Start Assessment <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegisterAssessment(assessment)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                        >
                          Register <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-sm text-center border border-gray-200">
                <p className="text-gray-700 mb-3 text-sm">
                  No assessments available at the moment.
                </p>
                <Link
                  to="/candidate/profile"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                >
                  Update your profile for more opportunities{' '}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            )}
          </>
        )}

        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          className="bg-white p-6 rounded-lg shadow-sm max-w-md mx-auto mt-20 border border-gray-200 outline-none"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50"
        >
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Start Assessment
            </h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {selectedAssessment && (
            <div>
              <div className="space-y-3 mb-4 text-sm">
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase">
                    Job Title
                  </h3>
                  <p className="text-gray-900">
                    {selectedAssessment.job_title}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase">
                    Company
                  </h3>
                  <p className="text-gray-900">{selectedAssessment.company}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase">
                    Duration
                  </h3>
                  <p className="text-gray-900">
                    {selectedAssessment.duration} minutes
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase">
                    Questions
                  </h3>
                  <p className="text-gray-900">
                    {selectedAssessment.num_questions}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase">
                    Description
                  </h3>
                  <p className="text-gray-900">
                    {selectedAssessment.description ||
                      'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="bg-indigo-50 p-3 rounded-md mb-4">
                <h3 className="text-xs font-medium text-indigo-800 mb-2 uppercase">
                  Important Notes:
                </h3>
                <ul className="text-xs text-indigo-700 space-y-1">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Ensure you have a stable internet connection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Find a quiet environment without distractions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>You cannot pause once started</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStartAssessment}
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                >
                  Start Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}

export default CandidateDashboard
