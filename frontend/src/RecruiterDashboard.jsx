import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import {
  Briefcase,
  ChevronRight,
  X,
  Check,
  Plus,
  Trash2,
  Calendar,
  User2,
  Badge,
  Award,
  Code,
  User,
} from 'lucide-react'
import Button from './components/Button'
import { format } from 'date-fns'
import LinkButton from './components/LinkButton'
import FormInput from './components/FormInput'

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

const degreeOptions = [
  { label: 'Bachelor of Technology (B.Tech)', value: 'B.Tech' },
  { label: 'Bachelor of Science (B.Sc)', value: 'B.Sc' },
  { label: 'Bachelor of Engineering (B.E)', value: 'B.E' },
  { label: 'Master of Technology (M.Tech)', value: 'M.Tech' },
  { label: 'Master of Science (M.Sc)', value: 'M.Sc' },
  { label: 'Master of Business Administration (MBA)', value: 'MBA' },
  { label: 'Bachelor of Arts (B.A)', value: 'B.A' },
  { label: 'Master of Arts (M.A)', value: 'M.A' },
  { label: 'Doctor of Philosophy (Ph.D)', value: 'Ph.D' },
]

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
    job_description: '',
    custom_prompt: '',
    skills: [],
    degree_branch: '',
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
          degree_branch: '',
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
          <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-md shadow-sm border border-gray-100 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
              <Briefcase className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Create New Assessment
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormInput
                  label="Job Title"
                  id="job_title"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleInputChange}
                  placeholder="Software Engineer"
                  required
                />
                <FormInput
                  label="Company"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Tech Corp"
                  required
                />
                <FormInput
                  label="Min Experience (years)"
                  id="experience_min"
                  type="number"
                  name="experience_min"
                  value={formData.experience_min}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                  placeholder="2"
                  required
                />
                <FormInput
                  label="Max Experience (years)"
                  id="experience_max"
                  type="number"
                  name="experience_max"
                  value={formData.experience_max}
                  onChange={handleInputChange}
                  min={formData.experience_min || 0}
                  step="0.1"
                  placeholder="5"
                  required
                />
                <FormInput
                  label="Duration (minutes)"
                  id="duration"
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="30"
                  required
                />
                <FormInput
                  label="Number of Questions"
                  id="num_questions"
                  type="number"
                  name="num_questions"
                  value={formData.num_questions}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="10"
                  required
                />
                <FormInput
                  label="Start Date"
                  id="schedule_start"
                  type="datetime-local"
                  name="schedule_start"
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
                  required
                />
                <FormInput
                  label="End Date"
                  id="schedule_end"
                  type="datetime-local"
                  name="schedule_end"
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
                  required
                />
                <FormInput
                  label="Degree"
                  id="degree_required"
                  type="select"
                  name="degree_required"
                  value={formData.degree_required}
                  onChange={handleInputChange}
                  options={degreeOptions}
                  placeholder={'Select a degree'}
                  required
                />
                <FormInput
                  label="Branch/Specialization"
                  id="degree_branch"
                  name="degree_branch"
                  value={formData.degree_branch || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., Computer Science"
                />
                <div className="sm:col-span-2">
                  <label
                    htmlFor="job_description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="job_description"
                    name="job_description"
                    value={formData.job_description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300 transition-all duration-200 resize-y"
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
                    id="custom_prompt"
                    name="custom_prompt"
                    value={formData.custom_prompt}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300 transition-all duration-200 resize-y"
                    rows="4"
                    placeholder="E.g., I want code snippet based questions..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Skills
                  </label>
                  <div className="flex gap-4 mb-4">
                    <input
                      type="text"
                      name="name"
                      value={newSkill.name}
                      onChange={handleSkillChange}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300 transition-all duration-200"
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
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white dark:text-gray-100 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                    >
                      Add
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.skills.length > 0 && (
                    <ul className="space-y-3">
                      {formData.skills.map((skill, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-md shadow-sm"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-200">
                            {skill.name} ({skill.priority})
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 focus:outline-none transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white dark:text-gray-100 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-md hover:shadow-lg"
                >
                  Create Assessment
                  <Briefcase className="w-5 h-5" />
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
                      {assessment.company}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm">
                      {assessment.experience_min}-{assessment.experience_max}{' '}
                      years
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <div className="inline-flex items-center rounded-md">
                      {formatDate(
                        assessment.schedule_start || assessment.schedule
                      )}{' '}
                      -{' '}
                      {formatDate(
                        assessment.schedule_end || assessment.schedule
                      )}
                    </div>
                  </div>
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

                <LinkButton
                  to={`/recruiter/candidates/${assessment.job_id}`}
                  variant="primary"
                  className={'flex items-center gap-2 justify-center'}
                >
                  View Candidates
                </LinkButton>
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
                className="bg-white dark:bg-gray-900 p-6 rounded-md shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-800 max-w-md w-full "
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="bg-indigo-100 dark:bg-indigo-950 p-3 rounded-lg">
                    <Briefcase className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {assessment.job_title}
                    </h3>
                    <p className="text-base text-gray-600 dark:text-gray-300">
                      {assessment.company}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 mb-5">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>
                      {assessment.experience_min}-{assessment.experience_max}{' '}
                      years
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <div className="inline-flex items-center rounded-md text-sm">
                      {formatDate(
                        assessment.schedule_start || assessment.schedule
                      )}{' '}
                      -{' '}
                      {formatDate(
                        assessment.schedule_end || assessment.schedule
                      )}
                    </div>
                  </div>
                  {assessment.skills && assessment.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      {assessment.skills.map((skill, index) => (
                        <span
                          key={index}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                            skill.priority
                          )}`}
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 justify-between">
                    <LinkButton
                      to={`/recruiter/candidates/${assessment.job_id}`}
                      variant="link"
                      className={
                        'flex items-center gap-2 justify-center hover:underline'
                      }
                    >
                      View Candidates
                    </LinkButton>
                    <LinkButton
                      to={`/recruiter/report/${assessment.job_id}`}
                      variant="link"
                      className={
                        'flex items-center gap-2 justify-center hover:underline'
                      }
                    >
                      View Report
                    </LinkButton>
                  </div>
                  <LinkButton
                    to={`/recruiter/combined-report/${assessment.job_id}`}
                    variant="primary"
                    className={'flex items-center gap-2 justify-center w-full'}
                  >
                    View Combined Report
                  </LinkButton>
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
