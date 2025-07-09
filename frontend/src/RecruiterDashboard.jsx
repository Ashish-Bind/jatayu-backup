import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import { Briefcase, ChevronRight, X, Check, Plus, Trash2 } from 'lucide-react'
import Button from './components/Button'

const RecruiterDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [assessments, setAssessments] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
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
    custom_prompt: '',
    skills: [],
  })
  const [newSkill, setNewSkill] = useState({ name: '', priority: 'low' })

  useEffect(() => {
    if (!user || user.role !== 'recruiter') {
      navigate('/recruiter/login')
      return
    }

    fetch('http://localhost:5000/api/recruiter/assessments', {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch assessments: ${response.statusText}`)
        }
        return response.json()
      })
      .then((data) => {
        setAssessments([...data.active_assessments, ...data.past_assessments])
      })
      .catch((error) => {
        console.error('Error fetching assessments:', error)
        setError(`Failed to load assessments: ${error.message}`)
      })
  }, [user, navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSkillChange = (e) => {
    const { name, value } = e.target
    setNewSkill({ ...newSkill, [name]: value })
  }

  const addSkill = () => {
    if (!newSkill.name.trim()) {
      setError('Skill name is required')
      return
    }
    setFormData({
      ...formData,
      skills: [
        ...formData.skills,
        { name: newSkill.name.trim(), priority: newSkill.priority },
      ],
    })
    setNewSkill({ name: '', priority: 'low' })
    setError('')
  }

  const removeSkill = (index) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate skills
    if (formData.skills.length === 0) {
      setError('At least one skill is required')
      return
    }

    // Validate schedule_end >= schedule_start
    if (formData.schedule_start && formData.schedule_end) {
      const start = new Date(formData.schedule_start)
      const end = new Date(formData.schedule_end)
      if (end < start) {
        setError('End date must be after start date')
        return
      }
    }

    try {
      const response = await fetch(
        'http://localhost:5000/api/recruiter/assessments',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
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
          custom_prompt: '',
          skills: [],
        })
        setNewSkill({ name: '', priority: 'low' })
        setIsFormOpen(false)
      } else {
        setError(data.error || 'Failed to create assessment.')
      }
    } catch (err) {
      setError(`Network error: ${err.message}. Is the backend running?`)
    }
  }

  const currentDate = new Date()
  const activeAssessments = assessments.filter(
    (assessment) =>
      new Date(assessment.schedule_end || assessment.schedule) >= currentDate
  )
  const pastAssessments = assessments.filter(
    (assessment) =>
      new Date(assessment.schedule_start || assessment.schedule) < currentDate
  )

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Navbar />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Recruiter Dashboard
        </h1>

        {error && (
          <div
            className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-3 mb-6 rounded-md text-sm flex items-center gap-2"
            role="alert"
          >
            <X className="w-4 h-4" />
            {error}
          </div>
        )}
        {success && (
          <div
            className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300 p-3 mb-6 rounded-md text-sm flex items-center gap-2"
            role="alert"
          >
            <Check className="w-4 h-4" />
            {success}
          </div>
        )}

        <Button
          onClick={() => setIsFormOpen(!isFormOpen)}
          variant="primary"
          className="mb-6 flex items-center justify-center gap-2"
        >
          {isFormOpen ? 'Cancel' : 'Create New Assessment'}
          {isFormOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Briefcase className="w-4 h-4" />
          )}
        </Button>

        {isFormOpen && (
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
              Create New Assessment
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="job_title"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="job_title"
                    id="job_title"
                    value={formData.job_title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    placeholder="Software Engineer"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    id="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    placeholder="Tech Corp"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="experience_min"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    Min Experience (years)
                  </label>
                  <input
                    type="number"
                    name="experience_min"
                    id="experience_min"
                    value={formData.experience_min}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    min="0"
                    step="0.1"
                    placeholder="2"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="experience_max"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    Max Experience (years)
                  </label>
                  <input
                    type="number"
                    name="experience_max"
                    id="experience_max"
                    value={formData.experience_max}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    min={formData.experience_min || 0}
                    step="0.1"
                    placeholder="5"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="duration"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    id="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    min="1"
                    placeholder="30"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="num_questions"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    name="num_questions"
                    id="num_questions"
                    value={formData.num_questions}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    min="1"
                    placeholder="10"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="schedule_start"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    name="schedule_start"
                    id="schedule_start"
                    value={
                      formData.schedule_start
                        ? formData.schedule_start.slice(0, 16)
                        : ''
                    }
                    onChange={(e) => {
                      const date = new Date(e.target.value)
                      setFormData({
                        ...formData,
                        schedule_start: date.toISOString(),
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="schedule_end"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    name="schedule_end"
                    id="schedule_end"
                    value={
                      formData.schedule_end
                        ? formData.schedule_end.slice(0, 16)
                        : ''
                    }
                    onChange={(e) => {
                      const date = new Date(e.target.value)
                      setFormData({
                        ...formData,
                        schedule_end: date.toISOString(),
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="degree_required"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    Required Degree
                  </label>
                  <input
                    type="text"
                    name="degree_required"
                    id="degree_required"
                    value={formData.degree_required}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    placeholder="B.Tech in Computer Science"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    rows="5"
                    placeholder="E.g., Looking for a backend engineer with experience in Django, REST APIs, and PostgreSQL..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="custom_prompt"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    Customized Prompt
                  </label>
                  <textarea
                    name="custom_prompt"
                    id="custom_prompt"
                    value={formData.custom_prompt}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    rows="4"
                    placeholder="E.g., I want code snippet based questions..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Skills
                  </label>
                  <div className="flex gap-4 mb-2">
                    <input
                      type="text"
                      name="name"
                      value={newSkill.name}
                      onChange={handleSkillChange}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
                      placeholder="e.g., Python"
                    />
                    <select
                      name="priority"
                      value={newSkill.priority}
                      onChange={handleSkillChange}
                      className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <Button
                      type="button"
                      onClick={addSkill}
                      variant="primary"
                      className="flex items-center gap-2 w-fit"
                    >
                      Add
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.skills.length > 0 && (
                    <ul className="space-y-2">
                      {formData.skills.map((skill, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-md"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-200">
                            {skill.name} ({skill.priority})
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 focus:outline-none"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex items-center justify-center gap-2"
                >
                  Create Assessment
                  <Briefcase className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        )}

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
          Active Assessments
        </h2>
        {activeAssessments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {activeAssessments.map((assessment) => (
              <div
                key={assessment.job_id}
                className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-md">
                    <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {assessment.job_title}
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                      Company: {assessment.company}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 mb-4 text-sm text-gray-700 dark:text-gray-200">
                  <p>
                    Experience: {assessment.experience_min}-
                    {assessment.experience_max} years
                  </p>
                  <p>
                    Schedule:{' '}
                    {new Date(
                      assessment.schedule_start || assessment.schedule
                    ).toLocaleString()}{' '}
                    -{' '}
                    {new Date(
                      assessment.schedule_end || assessment.schedule
                    ).toLocaleString()}
                  </p>
                  {assessment.skills && assessment.skills.length > 0 && (
                    <p>
                      Skills:{' '}
                      {assessment.skills
                        .map((s) => `${s.name} (${s.priority})`)
                        .join(', ')}
                    </p>
                  )}
                </div>
                <Link
                  to={`/recruiter/candidates/${assessment.job_id}`}
                  className="inline-flex items-center text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-400 font-medium text-sm"
                >
                  View Candidates
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm text-center border border-gray-200 dark:border-gray-600 mb-8">
            <p className="text-sm text-gray-700 dark:text-gray-200">
              No active assessments.
            </p>
          </div>
        )}

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
          Past Assessments
        </h2>
        {pastAssessments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastAssessments.map((assessment) => (
              <div
                key={assessment.job_id}
                className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-md">
                    <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {assessment.job_title}
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                      Company: {assessment.company}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 mb-4 text-sm text-gray-700 dark:text-gray-200">
                  <p>
                    Experience: {assessment.experience_min}-
                    {assessment.experience_max} years
                  </p>
                  <p>
                    Schedule:{' '}
                    {new Date(
                      assessment.schedule_start || assessment.schedule
                    ).toLocaleString()}{' '}
                    -{' '}
                    {new Date(
                      assessment.schedule_end || assessment.schedule
                    ).toLocaleString()}
                  </p>
                  {assessment.skills && assessment.skills.length > 0 && (
                    <p>
                      Skills:{' '}
                      {assessment.skills
                        .map((s) => `${s.name} (${s.priority})`)
                        .join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to={`/recruiter/candidates/${assessment.job_id}`}
                    className="inline-flex items-center text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-400 font-medium text-sm"
                  >
                    View Candidates
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                  <Link
                    to={`/recruiter/report/${assessment.job_id}`}
                    className="inline-flex items-center text-green-600 dark:text-green-300 hover:text-green-800 dark:hover:text-green-400 font-medium text-sm"
                  >
                    View Report
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                  <Link
                    to={`/recruiter/combined-report/${assessment.job_id}`}
                    className="inline-flex items-center text-purple-600 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-400 font-medium text-sm"
                  >
                    View Combined Report
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm text-center border border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-700 dark:text-gray-200">
              No past assessments.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecruiterDashboard
