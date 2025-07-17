import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { ThemeContext } from '../context/ThemeContext'
import {
  Briefcase,
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

const RecruiterOverview = () => {
  const { user, logout } = useAuth()
  const [recruiter, setRecruiter] = useState(null)
  const [jobs, setJobs] = useState({
    active: [],
    suspended: [],
    deleted: [],
  })
  const [candidates, setCandidates] = useState([])
  const [error, setError] = useState('')

  const links = [
    {
      name: 'Dashboard',
      link: '/recruiter/dashboard',
      icon: Briefcase,
    },
    {
      name: 'Analytics',
      link: '/recruiter/analytics',
      icon: User,
    },
  ]

  useEffect(() => {
    if (!user || user.role !== 'recruiter') return

    // Fetch recruiter profile
    fetch(`http://localhost:5000/api/recruiter/assessments/${user.id}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => {
        setRecruiter({
          company: data[0]?.company || 'Not specified',
          company_image: data[0]?.company_image || null,
        })
      })
      .catch((error) => setError(`Failed to load profile: ${error.message}`))

    // Fetch jobs
    fetch('http://localhost:5000/api/recruiter/analytics/jobs', {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => {
        const active = data.filter((job) => job.status === 'active')
        const suspended = data.filter((job) => job.status === 'suspended')
        const deleted = data.filter((job) => job.status === 'deleted')
        setJobs({ active, suspended, deleted })
      })
      .catch((error) => setError(`Failed to load jobs: ${error.message}`))

    // Fetch candidates (example with no filter)
    fetch('http://localhost:5000/api/recruiter/analytics/candidates', {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => setCandidates(data))
      .catch((error) => setError(`Failed to load candidates: ${error.message}`))
  }, [user])

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        {error}
      </div>
    )
  }

  if (!recruiter) {
    return <ClockLoader />
  }

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
              Manage Your Recruitment Process Efficiently
            </h2>
            <button className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition">
              Explore More
            </button>
          </div>
          <div
            className={`bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-xl mb-2 text-center shadow-md`}
          >
            <h2 className="text-2xl font-semibold">
              Welcome to Your Recruiter Dashboard
            </h2>
          </div>

          {/* Recruiter Info */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-2 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Briefcase className="w-6 h-6 text-indigo-600" /> My Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <p className="text-base text-gray-700 dark:text-gray-300">
                  <strong>Company:</strong> {recruiter.company}
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  <strong>Total Jobs:</strong>{' '}
                  {jobs.active.length +
                    jobs.suspended.length +
                    jobs.deleted.length}
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  <strong>Active Jobs:</strong> {jobs.active.length}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-base text-gray-700 dark:text-gray-300">
                  <strong>Suspended Jobs:</strong> {jobs.suspended.length}
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  <strong>Deleted Jobs:</strong> {jobs.deleted.length}
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  <strong>Total Candidates:</strong> {candidates.length}
                </p>
                <LinkButton
                  to="/recruiter/profile"
                  variant="primary"
                  className={'w-fit'}
                >
                  Edit Profile
                </LinkButton>
              </div>
            </div>
          </div>

          {/* Active Jobs */}
          <div className="mb-2">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Briefcase className="w-6 h-6 text-indigo-600" /> Active Jobs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.active.map((job) => (
                <div
                  key={job.job_id}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition transform hover:-translate-y-1"
                >
                  {recruiter.company_image && (
                    <img
                      src={`http://localhost:5000/static/uploads/${recruiter.company_image}`}
                      alt={'Company Logo'}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h4 className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {job.job_title}
                  </h4>
                  <p className="text-base text-gray-600 dark:text-gray-400">
                    Created:{' '}
                    {new Date(job.created_at).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                    })}
                  </p>
                  <Button
                    to={`/recruiter/assessment/${job.job_id}`}
                    className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    View Job
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Candidates Overview */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <User className="w-6 h-6 text-indigo-600" /> Candidate Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((candidate) => (
                <div
                  key={candidate.candidate_id}
                  className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {candidate.name}
                    </h4>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        candidate.status === 'blocked'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {candidate.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Job: {candidate.job_title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Score: {candidate.total_score}%
                  </p>
                  <Link
                    to={`/recruiter/candidate/${candidate.candidate_id}`}
                    className="inline-block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                  >
                    View Details
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
              Last login:{' '}
              {new Date().toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
              })}
            </p>
            <p className="text-base text-gray-700 dark:text-gray-300">
              Last job created:{' '}
              {jobs.active.length > 0
                ? new Date(jobs.active[0].created_at).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                  })
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 p-6 space-y-8 bg-white dark:bg-gray-900 shadow-sm dark:border-l dark:border-gray-800">
          <div className="text-center">
            {recruiter.company_image && (
              <img
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-indigo-600"
                src={`http://localhost:5000/static/uploads/${recruiter.company_image}`}
                alt="Company Logo"
              />
            )}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {recruiter.company}
            </h3>
            <p className="text-base text-gray-500 dark:text-gray-400">
              Good Afternoon, Recruiter 🔥
            </p>
            <p className="text-base text-indigo-600 mt-2 flex items-center gap-2 justify-center">
              Active Jobs: {jobs.active.length}
            </p>
            <Button
              className={'w-full mt-4'}
              to={'/recruiter/create-assessment'}
            >
              Create New Job
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default RecruiterOverview
