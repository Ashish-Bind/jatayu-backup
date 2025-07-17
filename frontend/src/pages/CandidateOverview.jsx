import React, { useState, useEffect, useContext } from 'react'
import { useAuth } from '../context/AuthContext'
import { ThemeContext } from '../context/ThemeContext'
import {
  BookOpen,
  User,
  Clock,
  Award,
  Calendar,
  LogOut,
  Verified,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import ClockLoader from '../components/ClockLoader'
import { Link } from 'react-router-dom'
import LinkButton from '../components/LinkButton'
import Button from '../components/Button'

const CandidateOverview = () => {
  const { user, logout } = useAuth()
  const [candidate, setCandidate] = useState(null)
  const [assessments, setAssessments] = useState({
    eligible: [],
    all: [],
    attempted: [],
  })
  const [error, setError] = useState('')

  const links = [
    {
      name: 'Profile',
      link: '/candidate/profile',
      icon: User,
    },
    {
      name: 'Dashboard',
      link: '/candidate/dashboard',
      icon: BookOpen,
    },
    {
      name: 'Reports',
      link: '/candidate/results',
      icon: Award,
    },
  ]

  useEffect(() => {
    if (!user || user.role !== 'candidate') return

    // Fetch candidate profile
    fetch(`http://localhost:5000/api/candidate/profile/${user.id}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => setCandidate(data))
      .catch((error) => setError(`Failed to load profile: ${error.message}`))

    // Fetch assessments
    fetch(
      `http://localhost:5000/api/candidate/eligible-assessments/${user.id}`,
      {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    )
      .then((response) => response.json())
      .then((data) => setAssessments(data))
      .catch((error) =>
        setError(`Failed to load assessments: ${error.message}`)
      )
  }, [user])

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        {error}
      </div>
    )
  }

  if (!candidate) {
    return <ClockLoader />
  }

  const skillColor = [
    'bg-yellow-200 text-yellow-800',
    'bg-pink-200 text-pink-800',
    'bg-green-200 text-green-800',
    'bg-orange-200 text-orange-800',
    'bg-blue-200 text-blue-800',
    'bg-red-200 text-red-800',
    'bg-indigo-200 text-indigo-800',
    'bg-cyan-200 text-cyan-800',
    'bg-teal-200 text-teal-800',
    'bg-purple-200 text-purple-800',
    'bg-green-200 text-green-800',
    'bg-orange-200 text-orange-800',
    'bg-yellow-200 text-yellow-800',
    'bg-blue-200 text-blue-800',
    'bg-red-200 text-red-800',
    'bg-teal-200 text-teal-800',
    'bg-pink-200 text-pink-800',
    'bg-purple-200 text-purple-800',
    'bg-indigo-200 text-indigo-800',
    'bg-cyan-200 text-cyan-800',
  ]

  return (
    <>
      <Navbar />
      <div
        className={`min-h-screen transition-colors duration-300 bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex`}
      >
        {/* Sidebar */}
        <div className="w-64 p-6 space-y-6 bg-white dark:bg-gray-900 shadow-sm dark:border-r dark:border-gray-800">
          <nav className="space-y-4">
            {links.map((item) => (
              <LinkButton
                key={item.name}
                to={item.link}
                className="w-full flex items-center gap-2 text-left p-3 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-base font-medium"
              >
                <item.icon className="text-indigo-600 dark:text-indigo-200" />
                {item.name}
              </LinkButton>
            ))}
            <LinkButton
              onClick={logout}
              className="w-full flex items-center gap-2 text-left p-3 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-base font-medium"
            >
              <LogOut className="text-indigo-600 dark:text-indigo-200" />
              Logout
            </LinkButton>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl mb-2 text-center shadow-md">
            <h2 className="text-2xl font-semibold">
              Sharpen Your Skills with Professional Online Courses
            </h2>
            <button className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition">
              Join Now
            </button>
          </div>
          <div
            className={`bg-gradient-to-r ${
              user.is_profile_complete ? 'from-green-600' : 'from-yellow-500'
            } ${
              user.is_profile_complete ? 'to-teal-600' : 'to-orange-500'
            } text-white p-6 rounded-xl mb-2 text-center shadow-md`}
          >
            <h2 className="text-2xl font-semibold">
              {user.is_profile_complete
                ? 'Congratulations your profile is 100% complete'
                : 'Complete profile helps us find the right job for you'}
            </h2>
            {!user.is_profile_complete && (
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-teal-300 h-2.5 rounded-full"
                  style={{ width: '60%' }}
                ></div>
              </div>
            )}
          </div>

          {/* Candidate Info */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-2 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <User className="w-6 h-6 text-indigo-600" /> My Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="flex flex-col gap-2">
                <p className="text-base text-gray-700 dark:text-gray-300">
                  <strong>Name:</strong> {candidate.name}
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  <strong>Email:</strong> {candidate.email}
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  <strong>Phone:</strong> {candidate.phone || 'Not provided'}
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  <strong>Location:</strong>{' '}
                  {candidate.location || 'Not specified'}
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  <strong>Experience:</strong> {candidate.years_of_experience}{' '}
                  years
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  <strong>Profile Status:</strong>{' '}
                  <span
                    className={`font-semibold ${
                      candidate.is_profile_complete
                        ? 'text-green-600'
                        : 'text-red-500'
                    }`}
                  >
                    {candidate.is_profile_complete ? 'Complete' : 'Incomplete'}
                  </span>
                </p>
                <p>
                  <strong>Resume:</strong>{' '}
                  <a
                    href={`http://localhost:5000/static/uploads/${candidate.resume}`}
                    className="text-indigo-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {candidate.resume.split('/').pop() || 'Not provided'}
                  </a>
                </p>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-2">
                <p className="text-base text-gray-700 dark:text-gray-300">
                  <strong>Degree:</strong> {candidate.degree}
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  <strong>Branch:</strong> {candidate.degree_branch}
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  <strong>Passout Year:</strong>{' '}
                  {candidate.passout_year || 'Not specified'}
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  <strong>LinkedIn:</strong>{' '}
                  <a
                    href={candidate.linkedin}
                    className="text-indigo-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {candidate.linkedin || 'Not provided'}
                  </a>
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  <strong>GitHub:</strong>{' '}
                  <a
                    href={candidate.github}
                    className="text-indigo-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {candidate.github || 'Not provided'}
                  </a>
                </p>
                <LinkButton
                  to="/candidate/complete-profile"
                  variant="primary"
                  className={'w-fit'}
                >
                  Edit Profile
                </LinkButton>
              </div>
            </div>
          </div>

          {/* Available Jobs */}
          <div className="mb-2">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <BookOpen className="w-6 h-6 text-indigo-600" /> Available Jobs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessments.eligible_assessments?.map((assessment) => (
                <div
                  key={assessment.job_id}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition transform hover:-translate-y-1"
                >
                  <img
                    src={`http://localhost:5000/static/uploads/${assessment.company_image}`}
                    alt={'Company Logo'}
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                  <h4 className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {assessment.job_title}
                  </h4>
                  <p className="text-base text-gray-600 dark:text-gray-400">
                    Company: {assessment.company}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <span className="text-base text-gray-700 dark:text-gray-300">
                      {assessment.experience_min}-{assessment.experience_max}{' '}
                      years
                    </span>
                  </div>
                  <Button
                    to={'/candidate/dashboard'}
                    className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    View Job
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Attempted Jobs */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <BookOpen className="w-6 h-6 text-indigo-600" /> Attempted Jobs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessments.attempted_assessments?.map((attempt) => (
                <div
                  key={attempt.attempt_id}
                  className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {attempt.job_title}
                    </h4>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      {attempt.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Company:{' '}
                    <span className="font-medium">{attempt.company}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Attempt Date:{' '}
                    <span className="font-medium">
                      {new Date(attempt.attempt_date).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                      })}
                    </span>
                  </p>
                  <Link
                    to={`/candidate/result/${attempt.attempt_id}`}
                    className="inline-block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                  >
                    View Result
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mt-4">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Clock className="w-6 h-6 text-indigo-600" /> Recent Activity
            </h3>
            <p className="text-base text-gray-700 dark:text-gray-300">
              Last login: {new Date().toLocaleString()}
            </p>
            <p className="text-base text-gray-700 dark:text-gray-300">
              Last job attempt:{' '}
              {assessments.attempted_assessments?.length > 0
                ? new Date(
                    assessments.attempted_assessments[0].attempt_date
                  ).toLocaleString()
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 p-6 space-y-8 bg-white dark:bg-gray-900 shadow-sm dark:border-l dark:border-gray-800">
          <div className="text-center">
            <img
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-indigo-600"
              src={`http://localhost:5000/static/uploads/${candidate.profile_picture}`}
              alt="Profile"
            />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {candidate.name}
            </h3>
            <p className="text-base text-gray-500 dark:text-gray-400">
              Good Afternoon {candidate.name} 🔥
            </p>
            <p className="text-base text-indigo-600 mt-2 flex items-center gap-2 justify-center">
              {candidate.is_profile_complete && (
                <Verified className="w-5 h-5" />
              )}
              {candidate.is_profile_complete
                ? '100% Profile Completion'
                : 'Complete profile for better results'}
            </p>
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Skills
              </h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {candidate.skills.map(({ skill_name }, i) => (
                  <span
                    key={skill_name}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      skillColor[i] || 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {skill_name}
                  </span>
                ))}
              </div>
            </div>

            <Button
              className={'w-full mt-4'}
              to={'/candidate/complete-profile'}
            >
              Tailor Profile
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default CandidateOverview
