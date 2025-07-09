import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import {
  User,
  Phone,
  MapPin,
  Linkedin,
  Github,
  GraduationCap,
  Briefcase,
  FileText,
  ArrowRight,
  Check,
  X,
  Loader2,
  Camera,
} from 'lucide-react'
import Navbar from './components/Navbar'
import LinkButton from './components/LinkButton'
import Button from './components/Button'

const CompleteProfile = () => {
  const { user } = useAuth()
  const [candidate, setCandidate] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    degree: '',
    years_of_experience: '',
  })
  const [resume, setResume] = useState(null)
  const [profilePicture, setProfilePicture] = useState(null)
  const [profilePreview, setProfilePreview] = useState(null)
  const [webcamImage, setWebcamImage] = useState(null)
  const [webcamPreview, setWebcamPreview] = useState(null)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    fetch(`http://localhost:5000/api/candidate/profile/${user.id}`)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch profile')
        return response.json()
      })
      .then((data) => {
        setCandidate(data)
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          location: data.location || '',
          linkedin: data.linkedin || '',
          github: data.github || '',
          degree: data.degree || '',
          years_of_experience: data.years_of_experience || '',
        })
        if (data.profile_picture) {
          setProfilePreview(
            `http://localhost:5000/static/uploads/${data.profile_picture}`
          )
        }
        if (data.camera_image) {
          setWebcamPreview(
            `http://localhost:5000/static/uploads/${data.camera_image}`
          )
        }
      })
      .catch((error) => {
        console.error('Error fetching candidate:', error)
        setMessage({
          text: 'Failed to fetch profile data. Please try again.',
          type: 'error',
        })
      })
  }, [user.id])

  // Handle webcam stream setup
  useEffect(() => {
    if (isWebcamActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [isWebcamActive])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleFileChange = (e) => {
    const { name, files } = e.target
    if (name === 'resume') {
      setResume(files[0])
    }
    if (name === 'profile_picture') {
      const file = files[0]
      setProfilePicture(file)
      if (file) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setProfilePreview(reader.result)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      setIsWebcamActive(true)
    } catch (err) {
      setMessage({
        text: `Failed to access webcam: ${err.message}`,
        type: 'error',
      })
    }
  }

  const captureWebcamImage = () => {
    if (!videoRef.current || !canvasRef.current) {
      setMessage({
        text: 'Webcam is not ready. Please try again.',
        type: 'error',
      })
      return
    }
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      const file = new File([blob], `webcam_${user.id}.jpg`, {
        type: 'image/jpeg',
      })
      setWebcamImage(file)
      setWebcamPreview(URL.createObjectURL(file))
    }, 'image/jpeg')
  }

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setIsWebcamActive(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage({ text: '', type: '' })

    if (!profilePicture && !webcamImage) {
      setMessage({
        text: 'Please provide either a profile picture or a webcam image.',
        type: 'error',
      })
      setIsLoading(false)
      return
    }

    const data = new FormData()
    for (const key in formData) {
      data.append(key, formData[key])
    }
    if (resume) data.append('resume', resume)
    if (profilePicture) data.append('profile_picture', profilePicture)
    if (webcamImage) data.append('webcam_image', webcamImage)

    try {
      const response = await fetch(
        `http://localhost:5000/api/candidate/profile/${user.id}`,
        {
          method: 'POST',
          body: data,
        }
      )
      const result = await response.json()
      if (response.ok) {
        // Log face verification details
        if (result.face_verification) {
          console.log('Face Verification Result:', result.face_verification)
          console.log(
            `Similarity Score: ${result.face_verification.similarity}%`
          )
          console.log(
            `Verification ${
              result.face_verification.verified ? 'successful' : 'failed'
            }`
          )
          setMessage({
            text: `Profile updated successfully! Face verification: ${result.face_verification.similarity}% similarity.`,
            type: 'success',
          })
        } else {
          setMessage({
            text: 'Profile updated successfully! Skills have been extracted from your resume.',
            type: 'success',
          })
        }
        setTimeout(() => navigate('/candidate/dashboard'), 1500)
      } else {
        setMessage({
          text:
            result.error ||
            'An error occurred while updating your profile. Please try again.',
          type: 'error',
        })
        // Reset form fields on error to allow retry
        setFormData({
          name: candidate.name || '',
          phone: candidate.phone || '',
          location: candidate.location || '',
          linkedin: candidate.linkedin || '',
          github: candidate.github || '',
          degree: candidate.degree || '',
          years_of_experience: candidate.years_of_experience || '',
        })
        setResume(null)
        setProfilePicture(null)
        setProfilePreview(
          candidate.profile_picture
            ? `http://localhost:5000/static/uploads/${candidate.profile_picture}`
            : null
        )
        setWebcamImage(null)
        setWebcamPreview(
          candidate.camera_image
            ? `http://localhost:5000/static/uploads/${candidate.camera_image}`
            : null
        )
      }
    } catch (error) {
      console.error('Submission Error:', error)
      setMessage({
        text: 'An unexpected error occurred. Please try again.',
        type: 'error',
      })
      // Reset form fields on error
      setFormData({
        name: candidate.name || '',
        phone: candidate.phone || '',
        location: candidate.location || '',
        linkedin: candidate.linkedin || '',
        github: candidate.github || '',
        degree: candidate.degree || '',
        years_of_experience: candidate.years_of_experience || '',
      })
      setResume(null)
      setProfilePicture(null)
      setProfilePreview(
        candidate.profile_picture
          ? `http://localhost:5000/static/uploads/${candidate.profile_picture}`
          : null
      )
      setWebcamImage(null)
      setWebcamPreview(
        candidate.camera_image
          ? `http://localhost:5000/static/uploads/${candidate.camera_image}`
          : null
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!candidate)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Navbar />
      <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="relative mx-auto w-24 h-24 mb-4 group">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-indigo-200 dark:border-indigo-600 group-hover:border-indigo-400 dark:group-hover:border-indigo-300 shadow-sm transition-all">
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <User className="w-12 h-12 text-indigo-400 dark:text-indigo-300" />
                  </div>
                )}
              </div>
              <label
                htmlFor="profile_picture"
                className="absolute bottom-0 right-0 bg-indigo-600 dark:bg-indigo-600 text-white p-1.5 rounded-full cursor-pointer shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-all group-hover:scale-110"
              >
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  name="profile_picture"
                  id="profile_picture"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Complete Your Profile
            </h1>
            <p className="text-sm text-gray-700 dark:text-gray-200">
              Fill in your details to get the most out of our platform
            </p>
          </div>

          {message.text && (
            <div
              className={`mb-6 p-3 rounded-md flex items-center text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300'
              }`}
            >
              {message.type === 'success' ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              {message.text}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="col-span-2">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-300" />
                      Full Name
                    </span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 взрос

text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    <span className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-300" />
                      Phone Number
                    </span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    placeholder="+1234567890"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-300" />
                      Location
                    </span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    id="location"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    placeholder="New York, NY"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="linkedin"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    <span className="flex items-center">
                      <Linkedin className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-300" />
                      LinkedIn Profile
                    </span>
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    id="linkedin"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    placeholder="https://linkedin.com/in/johndoe"
                    value={formData.linkedin}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="github"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    <span className="flex items-center">
                      <Github className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-300" />
                      GitHub Profile
                    </span>
                  </label>
                  <input
                    type="url"
                    name="github"
                    id="github"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    placeholder="https://github.com/johndoe"
                    value={formData.github}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="degree"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    <span className="flex items-center">
                      <GraduationCap className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-300" />
                      Degree
                    </span>
                  </label>
                  <input
                    type="text"
                    name="degree"
                    id="degree"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    placeholder="B.Tech in Computer Science"
                    value={formData.degree}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="years_of_experience"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    <span className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-300" />
                      Years of Experience
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="years_of_experience"
                    id="years_of_experience"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    placeholder="3.5"
                    value={formData.years_of_experience}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label
                    htmlFor="resume"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    <span className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-300" />
                      Resume (PDF)
                    </span>
                  </label>
                  <div className="w-full flex justify-between items-center sm:flex-col md:flex-row">
                    {formData.resume && (
                      <LinkButton
                        variant="link"
                        to={`http://localhost:5000/static/uploads/${formData.resume}`}
                        className="text-sm text-indigo-600 dark:text-indigo-300 hover:underline"
                        target="_blank"
                      >
                        {formData.resume.split('/')[1]}
                      </LinkButton>
                    )}
                    <input
                      type="file"
                      name="resume"
                      id="resume"
                      className="w-content text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800/30"
                      accept=".pdf"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="webcam_image"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    <span className="flex items-center">
                      <Camera className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-300" />
                      Webcam Image
                    </span>
                  </label>
                  <div className="space-y-2">
                    <video
                      ref={videoRef}
                      autoPlay
                      className={`w-full max-w-md rounded-md ${
                        isWebcamActive ? '' : 'hidden'
                      }`}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {!isWebcamActive ? (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={startWebcam}
                      >
                        Start Webcam
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          onClick={captureWebcamImage}
                        >
                          Capture Image
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={stopWebcam}
                        >
                          Stop Webcam
                        </Button>
                      </div>
                    )}
                    {webcamPreview && (
                      <img
                        src={webcamPreview}
                        alt="Webcam preview"
                        className="w-full max-w-md rounded-md mt-2"
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-6">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Save Profile
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompleteProfile
