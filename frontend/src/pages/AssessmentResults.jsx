import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import { Home, XCircle, RefreshCw } from 'lucide-react'
import { formatDate } from '../utils/utils'
import LinkButton from '../components/LinkButton'

const AssessmentResults = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [assessments, setAssessments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Fetch assessments on mount
  useEffect(() => {
    if (!user) {
      setErrorMessage('You must be logged in to view results.')
      return
    }

    const fetchAssessments = async () => {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const response = await fetch(
          `http://localhost:5000/api/assessment/all`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          }
        )
        if (!response.ok) {
          const data = await response.json()
          if (response.status === 401 || response.status === 403) {
            setErrorMessage('Unauthorized: Please log in again.')
          } else if (response.status === 404) {
            setErrorMessage('No assessments found.')
          } else {
            throw new Error(data.error || `HTTP error ${response.status}`)
          }
          return
        }
        const data = await response.json()
        setAssessments(data.attempted || [])
      } catch (error) {
        setErrorMessage(`Failed to fetch assessments: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssessments()
  }, [user])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Navbar />
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Home className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
            Assessment Results
          </h1>
          <Button
            onClick={() => navigate('/candidate/dashboard')}
            variant="secondary"
            size="sm"
            className=" flex items-center justify-center gap-1 w-fit"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
        {errorMessage && (
          <div
            className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-3 mb-6 rounded-md text-sm flex items-center gap-2"
            role="alert"
          >
            <XCircle className="w-4 h-4" />
            {errorMessage}
          </div>
        )}
        {isLoading && (
          <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm border border-gray-200 dark:border-gray-600 mb-6 text-center text-sm text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading assessments...
          </div>
        )}
        {!isLoading && assessments.length === 0 && !errorMessage && (
          <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm border border-gray-200 dark:border-gray-600 mb-6 text-center text-sm text-gray-700 dark:text-gray-200">
            No assessments completed.
          </div>
        )}
        {!isLoading && assessments.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-600 overflow-x-auto">
            <table
              className="min-w-full divide-y divide-gray-200 dark:divide-gray-600"
              role="table"
              aria-label="Completed Assessments"
            >
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Attempt ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Job Title
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Company
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Attempt Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {assessments.map((assessment) => (
                  <tr key={assessment.attempt_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {assessment.attempt_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {assessment.job_title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {assessment.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(assessment.attempt_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {assessment.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <LinkButton
                        to={`/candidate/assessment/${assessment.attempt_id}/results`}
                        variant="link"
                        size="sm"
                        className="hover:underline"
                      >
                        View Details
                      </LinkButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AssessmentResults
