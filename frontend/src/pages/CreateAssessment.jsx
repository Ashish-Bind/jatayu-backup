import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

const RecruiterDashboard = () => {
  const { user } = useAuth()
  const [assessments, setAssessments] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    job_title: '',
    company: '',
    experience_min: '',
    experience_max: '',
    duration: '',
    num_questions: '',
    schedule_start: '',
    schedule_end: '',
    degree_required: '',
    description: '',
  })
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'recruiter') return

    // Fetch assessments for recruiter using user.id
    fetch('http://localhost:5000/api/recruiter/assessments')
      .then((response) => response.json())
      .then((data) => setAssessments(data))
      .catch((error) => {
        console.error('Error fetching assessments:', error)
        setError('Failed to load assessments.')
      })
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        'http://localhost:5000/api/recruiter/assessments',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      )

      const data = await response.json()
      if (response.ok) {
        setSuccess('Assessment created successfully!')
        setAssessments([...assessments, { ...formData, job_id: data.job_id }])
        setFormData({
          job_title: '',
          company: '',
          experience_min: '',
          experience_max: '',
          duration: '',
          num_questions: '',
          schedule_start: '',
          schedule_end: '',
          degree_required: '',
          description: '',
        })
        setIsFormOpen(false)
      } else {
        setError(data.error || 'Failed to create assessment.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    }
  }

  // Segregate assessments
  const currentDate = new Date('2025-05-04T00:00:00Z')
  const activeAssessments = assessments.filter(
    (assessment) => new Date(assessment.schedule) >= currentDate
  )
  const pastAssessments = assessments.filter(
    (assessment) => new Date(assessment.schedule) < currentDate
  )

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Recruiter Dashboard</h1>

      {error && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6"
          role="alert"
        >
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div
          className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6"
          role="alert"
        >
          <p>{success}</p>
        </div>
      )}

      <button
        onClick={() => setIsFormOpen(!isFormOpen)}
        className="mb-6 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
      >
        {isFormOpen ? 'Cancel' : 'Create New Assessment'}
      </button>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4">Create New Assessment</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Min Experience (years)
                </label>
                <input
                  type="number"
                  name="experience_min"
                  value={formData.experience_min}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                  min="0"
                  step="0.1"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Max Experience (years)
                </label>
                <input
                  type="number"
                  name="experience_max"
                  value={formData.experience_max}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                  min="0"
                  step="0.1"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                  min="1"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Number of Questions
                </label>
                <input
                  type="number"
                  name="num_questions"
                  value={formData.num_questions}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                  min="1"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  name="schedule_start"
                  value={formData.schedule}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  name="schedule_end"
                  value={formData.schedule}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Required Degree
                </label>
                <input
                  type="text"
                  name="degree_required"
                  value={formData.degree_required}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
                rows="4"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Create Assessment
              </button>
            </div>
          </form>
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-4">Active Assessments</h2>
      {activeAssessments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {activeAssessments.map((assessment) => (
            <div
              key={assessment.job_id}
              className="bg-white p-4 rounded-lg shadow-md"
            >
              <h3 className="text-xl font-semibold">{assessment.job_title}</h3>
              <p className="text-gray-600">Company: {assessment.company}</p>
              <p className="text-gray-600">
                Experience: {assessment.experience_min}-
                {assessment.experience_max} years
              </p>
              <p className="text-gray-600">
                Schedule: {new Date(assessment.schedule).toLocaleString()}
              </p>
              <Link
                to={`/recruiter/candidates/${assessment.job_id}`}
                className="text-blue-500 hover:underline mt-2 inline-block"
              >
                View Candidates
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 mb-8">No active assessments.</p>
      )}

      <h2 className="text-2xl font-semibold mb-4">Past Assessments</h2>
      {pastAssessments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pastAssessments.map((assessment) => (
            <div
              key={assessment.job_id}
              className="bg-white p-4 rounded-lg shadow-md"
            >
              <h3 className="text-xl font-semibold">{assessment.job_title}</h3>
              <p className="text-gray-600">Company: {assessment.company}</p>
              <p className="text-gray-600">
                Experience: {assessment.experience_min}-
                {assessment.experience_max} years
              </p>
              <p className="text-gray-600">
                Schedule: {new Date(assessment.schedule).toLocaleString()}
              </p>
              <Link
                to={`/recruiter/candidates/${assessment.job_id}`}
                className="text-blue-500 hover:underline mt-2 inline-block"
              >
                View Candidates
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No past assessments.</p>
      )}
    </div>
  )
}

export default RecruiterDashboard
