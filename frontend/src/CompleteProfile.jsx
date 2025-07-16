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
  Calendar,
} from 'lucide-react'
import Navbar from './components/Navbar'
import LinkButton from './components/LinkButton'
import Button from './components/Button'
import Select from 'react-select'

const CompleteProfile = () => {
  const { user } = useAuth()
  const [candidate, setCandidate] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    degree_id: '',
    degree_branch: '',
    passout_year: '',
    years_of_experience: '',
    resume: '',
  })
  const [degrees, setDegrees] = useState([])
  const [branches, setBranches] = useState([])
  const [resume, setResume] = useState(null)
  const [profilePicture, setProfilePicture] = useState(null)
  const [profilePreview, setProfilePreview] = useState(null)
  const [webcamImage, setWebcamImage] = useState(null)
  const [webcamPreview, setWebcamPreview] = useState(null)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [enforceFaceVerification, setEnforceFaceVerification] = useState(false)
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    // Fetch candidate profile
    fetch(`http://localhost:5000/api/candidate/profile/${user.id}`, {
      credentials: 'include',
    })
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
          degree_id: data.degree_id || '',
          degree_branch: data.degree_branch || '',
          passout_year: data.passout_year || '',
          years_of_experience: data.years_of_experience || '',
          resume: data.resume || '',
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

      // Fetch enforce_face_verification flag
fetch('http://localhost:5000/api/auth/check', {
  credentials: 'include',
})
  .then((response) => {
    if (!response.ok) throw new Error('Failed to check auth')
    return response.json()
  })
  .then((data) => {
    if (data.user) {
      console.log('✅ Auth check:', {
        enforceFaceVerification: data.user.enforce_face_verification,
        lastLoginIP: data.user.last_login_ip, // OPTIONAL if you expose it
        currentIP: data.user.current_ip,       // OPTIONAL if you expose it
      });
      if (data.user.enforce_face_verification) {
        setEnforceFaceVerification(true)
      }
    }
  })
  .catch((error) => {
    console.error('❌ Error checking face verification requirement:', error)
  })

    // Fetch degrees
    fetch('http://localhost:5000/api/candidate/degrees', {
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch degrees')
        return response.json()
      })
      .then((data) => {
        setDegrees(data.map(degree => ({ value: degree.degree_id, label: degree.degree_name })))
      })
      .catch((error) => {
        console.error('Error fetching degrees:', error)
        setMessage({
          text: 'Failed to fetch degree options. Please try again.',
          type: 'error',
        })
      })

    // Fetch branches
    fetch('http://localhost:5000/api/candidate/branches', {
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch branches')
        return response.json()
      })
      .then((data) => {
        setBranches(data.map(branch => ({ value: branch.branch_id, label: branch.branch_name })))
      })
      .catch((error) => {
        console.error('Error fetching branches:', error)
        setMessage({
          text: 'Failed to fetch branch options. Please try again.',
          type: 'error',
        })
      })
  }, [user.id])

  useEffect(() => {
    if (isWebcamActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [isWebcamActive])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleDegreeChange = (selectedOption) => {
    setFormData({ ...formData, degree_id: selectedOption ? selectedOption.value : '' })
  }

  const handleBranchChange = (selectedOption) => {
    setFormData({ ...formData, degree_branch: selectedOption ? selectedOption.value : '' })
  }

  const handleFileChange = (e) => {
    const { name, files } = e.target
    if (name === 'resume') {
      setResume(files[0])
      setFormData({ ...formData, resume: files[0] ? files[0].name : formData.resume })
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

    // Validate passout_year
    if (formData.passout_year && !/^\d{4}$/.test(formData.passout_year)) {
      setMessage({
        text: 'Passout year must be a valid 4-digit year',
        type: 'error',
      })
      setIsLoading(false)
      return
    }

if (enforceFaceVerification && (!profilePicture || !webcamImage)) {
  console.warn('⚠️ Face verification is required but missing images.', {
    profilePicture: !!profilePicture,
    webcamImage: !!webcamImage,
  });
  setMessage({
    text: 'Both profile picture and webcam image are required for verification.',
    type: 'error',
  });
  setIsLoading(false);
  return;
} else {
  console.log('✅ Face verification check passed.', {
    enforceFaceVerification,
    profilePicture: !!profilePicture,
    webcamImage: !!webcamImage,
  });
}


const data = new FormData()
for (const key in formData) {
  if (key !== 'resume') {
    data.append(key, formData[key])
  }
}
if (resume) data.append('resume', resume)
if (profilePicture) data.append('profile_picture', profilePicture)
if (webcamImage) data.append('webcam_image', webcamImage)
data.append('enforce_face_verification', enforceFaceVerification) // ✅ Add this


    try {
      const response = await fetch(
        `http://localhost:5000/api/candidate/profile/${user.id}`,
        {
          method: 'POST',
          credentials: 'include',
          body: data,
        }
      )
      
      const result = await response.json()
if (response.ok) {
  console.log('✅ Profile updated successfully!')
  console.log('📸 Face Verification Result:', result.face_verification)
  if (result.face_verification) {
    console.log(
      `🔍 Similarity Score: ${result.face_verification.similarity}%`
    )
    console.log(
      `🎯 Verification ${result.face_verification.verified ? '✅ successful' : '❌ failed'}`
    )
  } else {
    console.log('ℹ️ No face verification performed by backend.')
  }

  setMessage({
    text: `Profile updated successfully! ${
      result.face_verification
        ? `Face verification: ${result.face_verification.similarity}% similarity.`
        : ''
    }`,
    type: 'success',
  })
  setTimeout(() => navigate('/candidate/dashboard'), 1500)
} else {
  console.error('❌ Profile update failed:', result.error || 'Unknown error')
  setMessage({
    text:
      result.error ||
      'An error occurred while updating your profile. Please try again.',
    type: 'error',
  })
}

    } catch (error) {
      console.error('Submission Error:', error)
      setMessage({
        text: 'An unexpected error occurred. Please try again.',
        type: 'error',
      })
    } finally {
      setIsLoading(false)
      stopWebcam()
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
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-indigo-500 dark:border-indigo-600 group-hover:border-indigo-600 dark:group-hover:border-indigo-500 shadow-sm transition-all">
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
              {candidate.is_profile_complete ? 'Edit Your Profile' : 'Complete Your Profile'}
            </h1>
            <p className="text-sm text-gray-700 dark:text-gray-200">
              {candidate.is_profile_complete
                ? 'Update your details to keep your profile current and access more job opportunities'
                : 'Fill in your details to get the most out of our platform'}
            </p>
            {enforceFaceVerification && (
              <p className="text-sm text-red-500 font-semibold mt-2">
                Face verification required due to location change.
              </p>
            )}
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

          <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
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
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-800 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
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
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-800 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
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
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-800 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
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
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-800 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
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
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-800 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    placeholder="https://github.com/johndoe"
                    value={formData.github}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="degree_id"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    <span className="flex items-center">
                      <GraduationCap className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-300" />
                      Degree
                    </span>
                  </label>
                  <Select
                    options={degrees}
                    value={degrees.find(option => option.value === formData.degree_id) || null}
                    onChange={handleDegreeChange}
                    placeholder="Select your degree..."
                    className="text-sm"
                    classNamePrefix="react-select"
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        borderColor: '#e5e7eb',
                        borderRadius: '0.375rem',
                        padding: '2px',
                        backgroundColor: '#fff',
                        '&:hover': { borderColor: '#6366f1' },
                      }),
                      menu: (provided) => ({
                        ...provided,
                        backgroundColor: '#fff',
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#e0e7ff' : '#fff',
                        color: state.isSelected ? '#fff' : '#374151',
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                        color: '#374151',
                      }),
                    }}
                    theme={(theme) => ({
                      ...theme,
                      colors: {
                        ...theme.colors,
                        primary: '#6366f1',
                        primary25: '#e0e7ff',
                      },
                    })}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="degree_branch"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    <span className="flex items-center">
                      <GraduationCap className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-300" />
                      Branch/Specialization
                    </span>
                  </label>
                  <Select
                    options={branches}
                    value={branches.find(option => option.value === formData.degree_branch) || null}
                    onChange={handleBranchChange}
                    placeholder="Select your branch..."
                    className="text-sm"
                    classNamePrefix="react-select"
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        borderColor: '#e5e7eb',
                        borderRadius: '0.375rem',
                        padding: '2px',
                        backgroundColor: '#fff',
                        '&:hover': { borderColor: '#6366f1' },
                      }),
                      menu: (provided) => ({
                        ...provided,
                        backgroundColor: '#fff',
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#e0e7ff' : '#fff',
                        color: state.isSelected ? '#fff' : '#374151',
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                        color: '#374151',
                      }),
                    }}
                    theme={(theme) => ({
                      ...theme,
                      colors: {
                        ...theme.colors,
                        primary: '#6366f1',
                        primary25: '#e0e7ff',
                      },
                    })}
                  />
                </div>
                <div>
                  <label
                    htmlFor="passout_year"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                  >
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-300" />
                      Passout Year
                    </span>
                  </label>
                  <input
                    type="number"
                    name="passout_year"
                    id="passout_year"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-800 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    placeholder="2023"
                    value={formData.passout_year}
                    onChange={handleChange}
                    min="1900"
                    max={new Date().getFullYear() + 5}
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
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-800 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-300"
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
                <div className="col-span-2">
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
                      className={`w-full max-w-md m-auto rounded-md ${
                        isWebcamActive ? '' : 'hidden'
                      }`}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {webcamPreview && (
                      <img
                        src={webcamPreview}
                        alt="Webcam preview"
                        className="w-full max-w-md rounded-md mt-2 m-auto"
                      />
                    )}
                    {!isWebcamActive ? (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={startWebcam}
                      >
                        Start Webcam
                      </Button>
                    ) : (
                      <div className="flex gap-2 justify-center w-full">
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